import express from "express"
import Model from "./schema.js"

const chatRoutes = express.Router()

chatRoutes.post("/room", async (req, res) => {
    try {
        const room = await Model.findOne({ name: req.body })
        if (room) {
            res.status(201).send(room)
        } else {
            const newRoom = new RoomModel(req.body)
            await newRoom.save()

            res.status(201).send(newRoom)
        }
    } catch (error) {
        next(error)
    }
})

chatRoutes.get("/room/:id", async (req, res) => {
    try {
        const room = await Model.findById(req.params.id)
        res.status(200).send({ chats: room.chats })
    } catch (error) {
        next(error)
    }
})

export default chatRoutes

/*

    search user - in progress

    get /users/me/chats retrieve all chats (rooms) from db when logging in but not all history, participant id = my id
    get /users/me/chats/:id retrieve chat history from db, participant id = my id
    post /room with two user ids then join, if exist go there instead

*/
