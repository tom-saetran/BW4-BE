import mongoose from "mongoose"
import server from "./server.js"
import { createServer } from "http"
import { Server } from "socket.io"
import { verifyToken } from "./auth/tools.js"

const http = createServer(server)
const io = new Server(http, { allowEIO3: true })

let onlineUsers = []

io.use(async (socket, next) => {
    const token = socket.handshake.headers.cookie.accessToken
    if (token) {
        if (await verifyToken(token)) next()
        else next(createError(401))
    } else next(createError(400, "Missing credentials"))
})

io.on("connection", socket => {
    // socket.on("join-room", (room) => {
    //     socket.join(room)
    //     console.log(socket.rooms)
    // })

    socket.on("setUsername", ({ username, room }) => {
        onlineUsers.push({ username: username, id: socket.id, room })

        //.emit - echoing back to itself
        socket.emit("loggedin")

        //.broadcast.emit - emitting to everyone else
        socket.broadcast.emit("newConnection")
        socket.join(room)

        //io.sockets.emit - emitting to everybody in the known world
        //io.sockets.emit("newConnection")
    })

    socket.on("disconnect", () => {
        console.log("Disconnecting...")
        onlineUsers = onlineUsers.filter(user => user.id !== socket.id)
    })

    socket.on("sendMessage", async ({ message, room }) => {
        await Model.findOneAndUpdate({ name: room }, { $push: { chatHistory: message } })
        socket.to(room).emit("message", message)
    })
})

process.env.TS_NODE_DEV && require("dotenv").config()
const port = process.env.PORT || 3030

const { MONGO_CONNECTION } = process.env
if (!MONGO_CONNECTION) throw new Error("No Mongo DB specified")

mongoose
    .connect(MONGO_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(() => http.listen(port, () => console.log("Server running on port", port)))
    .catch(e => console.log(e))
