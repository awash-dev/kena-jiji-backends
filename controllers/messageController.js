const asyncHandler = require("express-async-handler");
const chatRepository = require("../repositories/chatRepository");
const userRepository = require("../repositories/userRepository");

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, images } = req.body;
  if ((!content && (!images || !images.length)) || !chatId) {
    return res.status(400).json({ error: "Message or chatId missing." });
  }

  try {
    const message = await chatRepository.createMessage({
      sender: req.user._id,
      message: content || "",
      chat: chatId,
      images: Array.isArray(images) ? images : [],
    });
    await chatRepository.updateChat(chatId, {
      latest_message: message._id,
    });
    const sender = await userRepository.findById(req.user._id);
    const chat = await chatRepository.findChatById(chatId);

    const fullMessage = {
      ...message,
      sender: sender
        ? {
            _id: sender._id || sender.id,
            id: sender._id || sender.id,
            name:
              `${sender.firstname || ""} ${sender.lastname || ""}`.trim() ||
              sender.firstname ||
              sender.email,
            pic: sender.ProfilePicture,
            email: sender.email,
            role: sender.role || "user",
          }
        : null,
      chat,
    };

    const io = req.app.get("io");
    if (io) {
      // Emit to room chatId
      io.to(chatId).emit("message received", fullMessage);

      // Emit to each user in chat
      if (chat && Array.isArray(chat.users)) {
        chat.users.forEach((user) => {
          const uid = typeof user === "object" ? (user._id || user.id) : user;
          if (uid && String(uid) !== String(req.user._id)) {
            io.to(String(uid)).emit("message received", fullMessage);
          }
        });
      }

      // Notify admins
      io.to("admins").emit("message received", fullMessage);
      io.to("admins").emit("chat updated", { chatId, latestMessage: fullMessage });
    }

    res.json(fullMessage);
  } catch (error) {
    return res.status(500).json({ error: "Message could not be sent: " + error.message });
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
