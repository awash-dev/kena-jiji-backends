const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const createConversation = async (members) => {
  const result = await db.query(
    `INSERT INTO conversations (members) VALUES ($1::jsonb) RETURNING *`,
    [JSON.stringify(members)]
  );
  return serializeRow(result.rows[0]);
};

const findConversationsByUser = async (userId) => {
  const result = await db.query(
    `SELECT * FROM conversations WHERE members @> $1::jsonb ORDER BY created_at DESC`,
    [JSON.stringify([userId])]
  );
  return serializeRows(result.rows);
};

const findDirectChat = async (userA, userB) => {
  const result = await db.query(
    `
      SELECT *
      FROM chats
      WHERE is_group_chat = FALSE
        AND users @> $1::jsonb
        AND users @> $2::jsonb
      LIMIT 1
    `,
    [JSON.stringify([userA]), JSON.stringify([userB])]
  );
  return serializeRow(result.rows[0]);
};

const createChat = async ({ chat_name, is_group_chat, users, group_admin, order_id }) => {
  const result = await db.query(
    `
      INSERT INTO chats (chat_name, is_group_chat, users, group_admin, order_id)
      VALUES ($1, $2, $3::jsonb, $4, $5)
      RETURNING *
    `,
    [chat_name, is_group_chat, JSON.stringify(users), group_admin || null, order_id || null]
  );
  return serializeRow(result.rows[0]);
};

const findChatsByUser = async (userId) => {
  const result = await db.query(
    `SELECT * FROM chats WHERE users @> $1::jsonb ORDER BY updated_at DESC`,
    [JSON.stringify([userId])]
  );
  return serializeRows(result.rows);
};

const updateChat = async (chatId, payload) => {
  const fields = [];
  const values = [];
  Object.entries(payload).forEach(([key, value]) => {
    values.push(Array.isArray(value) ? JSON.stringify(value) : value);
    fields.push(`${key} = $${values.length}`);
  });
  const result = await db.query(
    `UPDATE chats SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
    [...values, chatId]
  );
  return serializeRow(result.rows[0]);
};

const findChatById = async (chatId) => {
  const result = await db.query(`SELECT * FROM chats WHERE id = $1`, [chatId]);
  return serializeRow(result.rows[0]);
};

const createMessage = async ({ sender, chat, message, images }) => {
  const result = await db.query(
    `INSERT INTO messages (sender, chat, message, images) VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
    [sender, chat, message, JSON.stringify(Array.isArray(images) ? images : [])]
  );
  return serializeRow(result.rows[0]);
};

const findMessagesByChat = async (chatId) => {
  const result = await db.query(`SELECT * FROM messages WHERE chat = $1 ORDER BY created_at ASC`, [chatId]);
  return serializeRows(result.rows);
};

module.exports = {
  createConversation,
  findConversationsByUser,
  findDirectChat,
  createChat,
  findChatsByUser,
  updateChat,
  findChatById,
  createMessage,
  findMessagesByChat,
};
