import mongoose from "mongoose"

const { Schema, model } = mongoose

const MessageSchema = new Schema({
    text: { type: String, required: true },
    id: { type: String, required: true },
    sender: { type: String, required: true },
    timestamp: { type: Date, required: true }
})

const RoomSchema = new Schema({
    name: { type: String, required: true },
    chatHistory: { type: [MessageSchema], required: true, default: [] }
})

export default model("Room", RoomSchema)
