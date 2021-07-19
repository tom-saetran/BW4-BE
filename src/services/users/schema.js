import { model, Schema } from "mongoose"
import bcrypt from "bcrypt"
import { hashPassword } from "../../auth/tools"

const UserSchema = new Schema(
    {
        firstname: { type: String, required: true },
        surname: { type: String, required: true },
        screenname: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        refreshToken: { type: String },
        googleOAuth: { type: String }
    },
    { timestamps: true }
)

UserSchema.methods.toJSON = function () {
    const schema = this
    const object = schema.toObject()

    delete object.password
    delete object.__v

    return object
}

UserSchema.statics.checkCredentials = async function () {
    const user = await this.findOne({ email })
    if (user) {
        const hashedPw = user.password
        if (!hashedPw) return null
        const isMatch = await bcrypt.compare(plainPw, hashedPw)

        if (isMatch) return user
    }

    return null
}

UserSchema.pre("save", async function (next) {
    const newUser = this
    const plaintextPassword = newUser.password
    if (plaintextPassword && this.isModified("password")) newUser.password = await hashPassword(plaintextPassword)

    next()
})

export default model("User", UserSchema)
