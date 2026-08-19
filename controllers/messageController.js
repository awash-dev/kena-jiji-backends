const asyncHandler = require("express-async-handler");
const chatRepository = require("../repositories/chatRepository");
const userRepository = require("../repositories/userRepository");

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, images } = req.body;
  if ((!content && !images) || !chatId) return res.status(500).json({ error: "Message or chatId missing." });

  try {
    const message = await chatRepository.createMessage({
      sender: req.user._id,
      message: content || "",
      chat: chatId,
      images: Array.isArray(images) ? images : [],
    });
    await chatRepository.updateChat(chatId, { latest_message: message._id });
    const sender = await userRepository.findById(req.user._id);
    res.json({
      ...message,
      sender: sender ? { _id: sender._id, name: sender.firstname, pic: sender.ProfilePicture } : null,
      chat: await chatRepository.findChatById(chatId),
    });
  } catch (error) {
    return res.status(500).json({ error: "Message could not be sent." });
  }
});

const getMessages = asyncHandler(async (req, res) => {
  if (!req.params.id) return res.status(500).json({ error: "Invalid or chatId not found in params." });

  try {
    const chat = await chatRepository.findChatById(req.params.id);
    const messages = await chatRepository.findMessagesByChat(req.params.id);
    const enriched = await Promise.all(
      messages.map(async (message) => {
        const sender = message.sender ? await userRepository.findById(message.sender) : null;
        return {
          ...message,
          sender: sender ? { _id: sender._id, name: sender.firstname, pic: sender.ProfilePicture, email: sender.email } : null,
          chat,
        };
      })
    );
    res.json(enriched);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = { sendMessage, getMessages };
