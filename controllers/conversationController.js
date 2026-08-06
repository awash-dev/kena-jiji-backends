const chatRepository = require("../repositories/chatRepository");
const userRepository = require("../repositories/userRepository");

const getConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await chatRepository.findConversationsByUser(userId);

    const conversationUserData = await Promise.all(
      conversations.map(async (conversation) => {
        const receiverId = (conversation.members || []).find((member) => member !== userId);
        const user = receiverId ? await userRepository.findById(receiverId) : null;
        return {
          user: user
            ? {
                receiverId: user._id,
                email: user.email,
                fullName: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
              }
            : null,
          conversationId: conversation._id,
        };
      })
    );

    res.status(200).json(conversationUserData);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getConversations };
