import mongoose from "mongoose"

const { Schema, model } = mongoose

const MessageSchema = new Schema(
    {
        text: { type: String, required: true },
        media: { type: String },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true }
    },
    { timestamps: true }
)

const RoomSchema = new Schema(
    {
        room: { type: String, required: true },
        chats: { type: [MessageSchema], required: true, default: [] }
    },
    { timestamps: true }
)

export default model("Room", RoomSchema)
