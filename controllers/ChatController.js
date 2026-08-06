const asyncHandler = require("express-async-handler");
const chatRepository = require("../repositories/chatRepository");
const userRepository = require("../repositories/userRepository");

const hydrateChat = async (chat) => {
  if (!chat) return null;
  const users = await Promise.all((chat.users || []).map((id) => userRepository.findById(id)));
  const latestMessage = chat.latestMessage ? (await chatRepository.findMessagesByChat(chat._id)).find((message) => message._id === chat.latestMessage) : null;
  const groupAdmin = chat.groupAdmin ? await userRepository.findById(chat.groupAdmin) : null;
  return {
    ...chat,
    users: users.filter(Boolean).map((user) => ({ _id: user._id, email: user.email, name: user.firstname, pic: user.ProfilePicture })),
    latestMessage,
    groupAdmin: groupAdmin ? { _id: groupAdmin._id, email: groupAdmin.email, name: groupAdmin.firstname } : null,
  };
};

const accessChat = async (req, res) => {
  if (!req.body.userId) return res.status(400).json({ error: "userId not present in the request body." });
  try {
    const existingChat = await chatRepository.findDirectChat(req.user._id, req.body.userId);
    if (existingChat) return res.status(200).json(await hydrateChat(existingChat));

    const newChat = await chatRepository.createChat({
      chat_name: "sender",
      is_group_chat: false,
      users: [req.user._id, req.body.userId],
    });

    res.status(201).json(await hydrateChat(newChat));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await chatRepository.findChatsByUser(req.user._id);
    if (!chats.length) return res.status(422).json({ message: "No chats found." });
    res.status(200).json(await Promise.all(chats.map(hydrateChat)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users && !req.body.name) return res.status(422).json({ error: "Please fill all the details." });
  const users = JSON.parse(req.body.users);
  if (users.length < 2) return res.status(422).json({ error: "Minimum two users are required to create a group." });
  users.push(req.user._id);

  const existingChats = await chatRepository.findChatsByUser(req.user._id);
  const existingChat = existingChats.find((chat) => chat.isGroupChat && users.every((id) => (chat.users || []).includes(id)));
  if (existingChat) return res.status(200).json(await hydrateChat(existingChat));

  const chatGroup = await chatRepository.createChat({
    chat_name: req.body.name,
    users,
    is_group_chat: true,
    group_admin: req.user._id,
  });
  res.status(201).json(await hydrateChat(chatGroup));
});

const renameGroup = asyncHandler(async (req, res) => {
  if (!req.body.chatName) return res.status(422).json({ error: "Please Enter New Name." });
  const newChatObj = await chatRepository.updateChat(req.body.chatId, { chat_name: req.body.chatName });
  if (!newChatObj) return res.status(404).json({ error: "Chat Not Found." });
  res.status(200).json(await hydrateChat(newChatObj));
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const chat = await chatRepository.findChatById(req.body.chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found." });
  const adminId = String(chat.groupAdmin || "");
  const filteredUsers = (req.body.userId || []).filter((id) => id !== adminId);
  const updatedChat = await chatRepository.updateChat(
    req.body.chatId,
    { users: (chat.users || []).filter((id) => !filteredUsers.includes(id)) }
  );
  res.status(200).json(await hydrateChat(updatedChat));
});

const addToGroup = asyncHandler(async (req, res) => {
  const chat = await chatRepository.findChatById(req.body.chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found." });
  const nextUsers = Array.from(new Set([...(chat.users || []), ...(req.body.userId || [])]));
  const newChatObj = await chatRepository.updateChat(req.body.chatId, { users: nextUsers });
  res.status(200).json({ data: await hydrateChat(newChatObj), message: "Successfully added to group" });
});

module.exports = { accessChat, getChats, createGroupChat, renameGroup, removeFromGroup, addToGroup };
