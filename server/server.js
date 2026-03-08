require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { addUser, removeUser, getUsers } = require("./user");
const { askAI, summarizeChat } = require("./ai");

const app = express();
app.use(express.static("client"));
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// Per-room message history (last 50 messages for summarization)
const roomHistory = {};

io.on("connection", (socket) => {

    socket.on("join", ({ username, room }) => {
        socket.join(room);
        addUser(socket.id, username, room);
        if (!roomHistory[room]) roomHistory[room] = [];
        io.to(room).emit("users", getUsers(room));
    });

    socket.on("message", async (msg) => {
        const { text, sender, room } = msg;

        // Store in room history (cap at 50)
        if (!roomHistory[room]) roomHistory[room] = [];
        roomHistory[room].push({ sender, text });
        if (roomHistory[room].length > 50) roomHistory[room].shift();

        // Broadcast message to room first
        io.to(room).emit("message", msg);

        // Check if this is an @ai command
        if (text.toLowerCase().startsWith("@ai")) {
            // Show typing indicator to the room
            io.to(room).emit("aiTyping", true);

            try {
                let aiReply;
                const command = text.slice(3).trim().toLowerCase();

                if (command === "summarize") {
                    // Summarize: use history before this message
                    const history = roomHistory[room].slice(0, -1); // exclude the @ai message itself
                    aiReply = await summarizeChat(history);
                } else {
                    // General question
                    const question = text.slice(3).trim();
                    aiReply = await askAI(question);
                }

                io.to(room).emit("aiTyping", false);
                io.to(room).emit("message", {
                    sender: "🤖 SauceAI",
                    text: aiReply,
                    room,
                    isAI: true
                });
            } catch (err) {
                console.error("AI error:", err.message);
                io.to(room).emit("aiTyping", false);
                io.to(room).emit("message", {
                    sender: "🤖 SauceAI",
                    text: "Sorry, I ran into an error. Please try again!",
                    room,
                    isAI: true
                });
            }
        }
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit("users", getUsers(user.room));
        }
    });

});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});