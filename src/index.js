import cors from "cors"
import mongoose from "mongoose"
import Model from "./services/rooms/schema.js"
import server from "./server.js"
import { createServer } from "http"
import { Server } from "socket.io"
import { verifyToken } from "./auth/tools.js"
import { corsOptions } from "./server.js"
import cookieParser from "cookie-parser"

const http = createServer(server)
const io = new Server(http, { allowEIO3: true })

export const sockets = {}

//io.use(cors(corsOptions))

//io.use(cookieParser())
io.use(async (socket, next) => {
    const token = socket.handshake.headers.cookie.split('=')[1]

    if (token) (await verifyToken(token)) ? next() : next(createError(401))
    else next(createError(400, "Missing credentials"))
})

io.on("connection", socket => {
    // socket.on("join-room", (room) => {
    //     socket.join(room)
    //     console.log(socket.rooms)
    // })

    socket.on("joinRoom", ({ username, roomId }) => {
        //online.push({ username: username, id: socket.id, room })

        //.emit - echoing back to itself
        socket.emit("loggedIn")

        //.broadcast.emit - emitting to everyone else
        socket.join(roomId)
        sockets[socket.id] = { socket, username, roomId }
        socket.broadcast.emit("newConnection")
        //io.sockets.emit - emitting to everybody in the known world
        //io.sockets.emit("newConnection")
    })

    socket.on("disconnect", () => delete sockets[socket.id])

    socket.on("sendMessage", async ({ roomId, message }) => {

        console.log(message, roomId)
        try {
            const room = await Model.findByIdAndUpdate(roomId, { $push: { chats: message } }, { useFindAndModify: false })
            if (room) socket.to(room._id.toString()).emit("message", message)
            else throw new Error("Room not found")
        } catch (error) {
            console.error(error)
        }
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
