const db = require("../configure/wubFashionDB");
const asyncHandler = require("express-async-handler");
const { serializeRows, serializeRow } = require("../services/sqlHelpers");
const { createActivity } = require("../services/activityService");

const logActivity = async (userId, action, resource, resourceId, details = "") =>
  createActivity({ user: userId, action, resource, resourceId, details });

const getallAdminActivity = asyncHandler(async (req, res) => {
  const result = await db.query(`SELECT * FROM activity_logs ORDER BY timestamp DESC`);
  res.json(serializeRows(result.rows));
});

const getAllActivityByRole = asyncHandler(async (req, res) => {
  const result = await db.query(
    `
      SELECT a.*, u.firstname
      FROM activity_logs a
      INNER JOIN users u ON u.id = a.user_id
      WHERE u.role = $1
      ORDER BY a.timestamp DESC
    `,
    [req.params.role]
  );
  if (!result.rows.length) return res.status(404).json({ message: `No activities found for role: ${req.params.role}` });
  res.json(serializeRows(result.rows));
});

const getAdminActivity = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "No activity found for this admin" });
    res.status(200).json({ activityLogs: serializeRows(result.rows) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs" });
  }
};

const getAllActivity = async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT a.*, u.firstname
        FROM activity_logs a
        LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.timestamp DESC
      `
    );
    if (!result.rows.length) return res.status(404).json({ message: "No activity found for this admin" });
    res.status(200).json({ activityLogs: serializeRows(result.rows) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
};

const getEachActivity = async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT a.*, u.firstname
        FROM activity_logs a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.id = $1
      `,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "No activity found " });
    res.status(200).json({ activityLogs: serializeRows(result.rows) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs" });
  }
};

const updateActivityLog = async (req, res) => {
  try {
    if (typeof req.body.Isread !== "boolean") {
      return res.status(400).json({ message: "Invalid value for Isread. It must be a boolean." });
    }
    const result = await db.query(
      `UPDATE activity_logs SET isread = $1 WHERE id = $2 RETURNING *`,
      [req.body.Isread, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Activity log not found." });
    res.status(200).json({ message: "Activity updated successfully.", data: serializeRow(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

const getUnreadActivity = async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT a.*, u.firstname
        FROM activity_logs a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.isread = FALSE
        ORDER BY a.timestamp DESC
      `
    );
    if (!result.rows.length) return res.status(202).json({ message: "No activity found for this" });
    res.status(200).json({ activityLogs: serializeRows(result.rows) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
};

module.exports = { logActivity, getAllActivityByRole, getEachActivity, getAdminActivity, getallAdminActivity, getAllActivity, updateActivityLog, getUnreadActivity };
