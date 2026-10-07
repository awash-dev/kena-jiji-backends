/* Temporary integration test for the OTP verify + forgot-password flows.
   - sendEmail is STUBBED before the controller loads: NO real email is sent.
   - creates one synthetic user (otp-flow-test-*) and deletes it at the end. */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// ---- stub sendEmail BEFORE userController captures its reference ----
const sendPath = require.resolve("./utils/sendEmail");
let sent = [];
let failNextSend = false;
require.cache[sendPath] = {
  id: sendPath,
  filename: sendPath,
  loaded: true,
  exports: async (opts) => {
    if (failNextSend) throw new Error("SMTP down (simulated)");
    sent.push(opts);
    return { messageId: "stub" };
  },
};

const ctrl = require("./controllers/userController");
const db = require("./configure/wubFashionDB");
const { comparePassword } = require("./services/passwordService");

const results = [];
const check = (name, cond, extra) => {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? "PASS" : "FAIL"} - ${name}${extra ? " :: " + extra : ""}`);
};

const call = (fn, body) =>
  new Promise((resolve) => {
    const req = { body };
    let status = 200;
    let jsonBody = null;
    let error = null;
    const res = {
      status(c) { status = c; return this; },
      json(b) { jsonBody = b; return this; },
    };
    let done = false;
    const finish = () => {
      if (!done) { done = true; resolve({ status, body: jsonBody, error }); }
    };
    const next = (err) => { error = err; finish(); };
    Promise.resolve(fn(req, res, next)).then(finish, (e) => { error = e; finish(); });
  });

const email = `otp-flow-test-${Date.now()}@example.com`;
const oldPass = "OldPass123!";
const newPass = "NewPass456!";
let userId = null;
let r = null;

(async () => {
  try {
    const info = await db.query("SELECT current_database() AS db, current_user AS usr");
    console.log(`DB: ${info.rows[0].db} @ ${info.rows[0].usr}`);
  } catch (e) {
    console.error("DB UNREACHABLE:", e.message);
    process.exit(2);
  }

  try {
    // ---- 1) signup: user created + OTP email really dispatched (stubbed) ----
    r = await call(ctrl.createAppUser, {
      firstname: "Otp", lastname: "Flow", email, password: oldPass, mobile: "0911000000",
    });
    check("appRegister returns 201", r.status === 201, JSON.stringify(r.body || r.error && r.error.message));
    check("verification OTP email dispatched", sent.length === 1, `emails=${sent.length}`);
    const regOtp = ((sent[0] || {}).message || "").match(/(\d{6})/);
    check("OTP is 6 digits in email", !!regOtp, regOtp && regOtp[1]);
    userId = r.body && r.body.user && r.body.user._id;
    check("userId captured", !!userId);

    // ---- 2) email failure on register -> rollback ----
    failNextSend = true;
    const email2 = `otp-flow-test2-${Date.now()}@example.com`;
    r = await call(ctrl.createAppUser, {
      firstname: "X", lastname: "Y", email: email2, password: "abc12345", mobile: "0911000001",
    });
    failNextSend = false;
    check("register fails when email fails", !!r.error && /Could not send/.test(r.error.message), r.error && r.error.message);
    const ghost = await db.query("SELECT id FROM users WHERE LOWER(email)=LOWER($1)", [email2]);
    check("failed-email register rolled back", ghost.rows.length === 0);

    // ---- 3) verify email with OTP ----
    r = await call(ctrl.verifyEmail, { email, otp: regOtp && regOtp[1] });
    check("verify-email correct OTP -> 200", r.status === 200, JSON.stringify(r.body));
    const verified = await db.query("SELECT is_email_verified FROM users WHERE id=$1", [userId]);
    check("is_email_verified=true in DB", verified.rows[0].is_email_verified === true);
    r = await call(ctrl.verifyEmail, { email, otp: regOtp && regOtp[1] });
    check("OTP is single-use (reuse rejected)", r.status === 400, JSON.stringify(r.body));
  } catch (e) {
    check("section 1-3 unexpected error", false, e.message);
  }

  try {
    // ---- 4) forgot password: sends email, does NOT touch password ----
    const before = await db.query("SELECT password FROM users WHERE id=$1", [userId]);
    sent = [];
    r = await call(ctrl.forgotPassword, { email });
    check("ForgotPassword -> 200", r.status === 200, JSON.stringify(r.body || r.error && r.error.message));
    check("reset OTP email dispatched", sent.length === 1, `emails=${sent.length}`);
    const resetOtp = ((sent[0] || {}).message || "").match(/(\d{6})/);
    check("reset email contains OTP + correct copy", !!resetOtp && /reset your password/i.test((sent[0] || {}).message || ""));
    const after = await db.query("SELECT password FROM users WHERE id=$1", [userId]);
    check("password NOT changed by forgotPassword", before.rows[0].password === after.rows[0].password);

    // ---- 5) reset with wrong OTP rejected ----
    const wrongOtp = resetOtp && resetOtp[1] === "999999" ? "888888" : "999999";
    r = await call(ctrl.resetPassword, { email, otp: wrongOtp, newPassword: newPass });
    check("resetPassword wrong OTP -> 400", r.status === 400, JSON.stringify(r.body));
    const still = await db.query("SELECT password FROM users WHERE id=$1", [userId]);
    check("password unchanged after wrong OTP", before.rows[0].password === still.rows[0].password);

    // ---- 6) reset with correct OTP ----
    r = await call(ctrl.resetPassword, { email, otp: resetOtp && resetOtp[1], newPassword: newPass });
    check("resetPassword correct OTP -> 200", r.status === 200, JSON.stringify(r.body || r.error && r.error.message));
    const done = await db.query("SELECT password, password_reset_otp FROM users WHERE id=$1", [userId]);
    check("new password valid", await comparePassword(newPass, done.rows[0].password));
    check("old password no longer valid", !(await comparePassword(oldPass, done.rows[0].password)));
    check("reset OTP cleared after use", done.rows[0].password_reset_otp === null);

    // ---- 7) forgot-password email failure invalidates OTP ----
    sent = [];
    failNextSend = true;
    r = await call(ctrl.forgotPassword, { email });
    failNextSend = false;
    check("ForgotPassword fails when email fails", !!r.error && /Could not send/.test(r.error.message), r.error && r.error.message);
    const cleared = await db.query("SELECT password_reset_otp FROM users WHERE id=$1", [userId]);
    check("OTP invalidated when email fails", cleared.rows[0].password_reset_otp === null);
    const untouched = await db.query("SELECT password FROM users WHERE id=$1", [userId]);
    check("password untouched after failed send", untouched.rows[0].password === done.rows[0].password);

    // ---- 8) resendOtp reports email failure ----
    // Create a new unverified user for this test
    const unverifiedEmail = `otp-flow-unverified-${Date.now()}@example.com`;
    r = await call(ctrl.createAppUser, {
      firstname: "Unverified", lastname: "User", email: unverifiedEmail, password: "TestPass123!", mobile: "0911000002",
    });
    check("unverified user created for resend test", r.status === 201);
    const unverifiedUserId = r.body && r.body.user && r.body.user._id;
    sent = []; // Clear sent emails
    failNextSend = true;
    r = await call(ctrl.resendOtp, { email: unverifiedEmail });
    failNextSend = false;
    check("resendOtp reports email failure", r.status === 500 && /Could not send/.test((r.body || {}).message || ""), JSON.stringify(r.body));
    // Cleanup unverified user
    await db.query("DELETE FROM users WHERE id=$1", [unverifiedUserId]);
  } catch (e) {
    check("section 4-8 unexpected error", false, e.message);
  } finally {
    try {
      await db.query("DELETE FROM users WHERE LOWER(email) LIKE $1", ["otp-flow-test%@example.com"]);
      console.log("Cleanup: test users deleted");
    } catch (e) {
      console.error("Cleanup failed:", e.message);
    }
    const failed = results.filter((x) => !x.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    process.exit(failed.length ? 1 : 0);
  }
})();

