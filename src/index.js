import cors from "cors"
import mongoose from "mongoose"
import Model from "./services/rooms/schema.js"
import server from "./server.js"
import { createServer } from "http"
import { Server } from "socket.io"
import { verifyToken } from "./auth/tools.js"
import { corsOptions } from "./server.js"

const http = createServer(server)
const io = new Server(http, { allowEIO3: true })

let online = []

export const sockets = {}

io.use(cors(corsOptions))
io.use(async (socket, next) => {
    const token = socket.handshake.headers.cookie.accessToken
    if (token) (await verifyToken(token)) ? next() : next(createError(401))
    else next(createError(400, "Missing credentials"))
})

io.on("connection", socket => {
    // socket.on("join-room", (room) => {
    //     socket.join(room)
    //     console.log(socket.rooms)
    // })

    socket.on("joinServer", ({ username, room }) => {
        online.push({ username: username, id: socket.id, room })

        //.emit - echoing back to itself
        socket.emit("loggedIn")

        //.broadcast.emit - emitting to everyone else
        socket.broadcast.emit("newConnection")
        socket.join(room)
        sockets[socket.id] = socket
        //io.sockets.emit - emitting to everybody in the known world
        //io.sockets.emit("newConnection")
    })

    socket.on("disconnect", () => {
        console.log("Disconnecting...")
        delete sockets[socket.id]
        onlineUsers = onlineUsers.filter(user => user.id !== socket.id)
    })

    socket.on("sendMessage", async ({ message, room }) => {
        await Model.findOneAndUpdate({ name: room }, { $push: { chats: message } }, { useFindAndModify: false })
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
