import mongoose from "mongoose"
import bcrypt from "bcrypt"
import { hashPassword } from "../../auth/tools.js"
const { model, Schema } = mongoose

const ChatSchema = new Schema(
    {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
        media: { type: String },
        message: { type: String, required: true, default: "" },
        password: { type: String },
        refreshToken: { type: String },
        googleOAuth: { type: String },
        role: { type: String, enum: ["User", "Moderator", "Admin"], required: true, default: "User" },
        avatar: { type: String, required: true, default: "https://bw4-be.herokuapp.com/images/noavatar.png" }
    },
    { timestamps: true }
)

ChatSchema.methods.toJSON = function () {
    const schema = this
    const object = schema.toObject()

    object.sent = object.createdAt

    delete object.createdAt
    delete object.password
    delete object.refreshToken
    delete object.__v

    return object
}

ChatSchema.statics.checkCredentials = async function () {
    const user = await this.findOne({ email })
    if (user) {
        const hashedPw = user.password
        if (!hashedPw) return null
        const isMatch = await bcrypt.compare(plainPw, hashedPw)

        if (isMatch) return user
    }

    return null
}

ChatSchema.pre("save", async function (next) {
    //
    next()
})

export default model("Chat", ChatSchema)
