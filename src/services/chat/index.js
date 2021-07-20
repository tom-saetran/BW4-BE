import express from "express"
import Model from "./schema.js"

const chatRoutes = express.Router()

chatRoutes.post("/room", async (req, res) => {
    const room = new RoomModel(req.body)
    await room.save()

    res.status(201).send(room)
})

chatRoutes.get("/room/:name", async (req, res) => {
    const room = await Model.findOne({ name: req.params.name })
    res.status(200).send({ chatHistory: room.chatHistory })
})

export default chatRoutes
