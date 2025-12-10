const modelChat = require('../model/model_chat');

module.exports = (io, socket) => {
    console.log("User connected:", socket.id);

    socket.on('join chat', (chatId) => {
        socket.join(chatId);
        console.log("User joined chat:", chatId);
    });

    socket.on('send message', async (data) => {
        try {
            const { chatId, senderId, content } = data;

            const chat = await modelChat.findById(chatId)
                .populate('participants', 'name avatar');

            if (!chat) return;

            const newMessage = {
                sender: senderId,
                content,
                timestamp: new Date(),
                isRead: false
            };

            chat.messages.push(newMessage);
            chat.lastMessage = newMessage;
            chat.updatedAt = new Date();
            await chat.save();

            io.to(chatId).emit('new message', {
                chatId,
                message: {
                    ...newMessage,
                    sender: { _id: senderId }
                }
            });

        } catch (err) {
            console.error("Error sending message:", err);
        }
    });

    socket.on("typing", ({ chatId, userId }) => {
        socket.to(chatId).emit("user typing", { userId });
    });

    socket.on("stop typing", ({ chatId }) => {
        socket.to(chatId).emit("user stop typing");
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
};
