const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { addUser, removeUser, getUsers } = require("./user");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {

    socket.on("join", ({username, room}) => {
        socket.join(room);
        addUser(socket.id, username, room);

        io.to(room).emit("users", getUsers(room));
    });

    socket.on("message", (msg) => {
        io.to(msg.room).emit("message", msg);
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