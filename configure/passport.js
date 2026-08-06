const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const userRepository = require("../repositories/userRepository");
const { hashPassword } = require("../services/passwordService");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;
      let user = await userRepository.findOneByProvider("google_id", profile.id);

      if (!user) {
        user = await userRepository.create({
          google_id: profile.id,
          email,
          firstname: profile.name?.givenName || "Google",
          lastname: profile.name?.familyName || "User",
          provider: "google",
          mobile: `${Date.now()}`,
          password: await hashPassword(profile.id),
          is_email_verified: true,
        });
      }

      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id || user.id));

passport.deserializeUser(async (id, done) => {
  done(null, await userRepository.findById(id));
});

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value || `${profile.id}@facebook.local`;
      let user = await userRepository.findOneByProvider("facebook_id", profile.id);

      if (!user) {
        user = await userRepository.create({
          facebook_id: profile.id,
          email,
          firstname: profile.name?.givenName || "Facebook",
          lastname: profile.name?.familyName || "User",
          provider: "facebook",
          mobile: `${Date.now()}`,
          password: await hashPassword(profile.id),
          is_email_verified: true,
        });
      }

      done(null, user);
    }
  )
);

module.exports = passport;
