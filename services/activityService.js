const db = require("../configure/wubFashionDB");
const { serializeRow } = require("./sqlHelpers");

const createActivity = async ({
  action,
  user,
  resource,
  resourceId = null,
  details = {},
}) => {
  const result = await db.query(
    `
      INSERT INTO activity_logs (action, user_id, resource, resource_id, details)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING *
    `,
    [action, user || null, resource, resourceId, JSON.stringify(details || {})]
  );

  return serializeRow(result.rows[0]);
};

module.exports = {
  createActivity,
};
