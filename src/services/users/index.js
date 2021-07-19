import q2m from "query-to-mongo"
import express from "express"
import passport from "passport"
import Model from "./schema.js"
import createError from "http-errors"
import { validationResult } from "express-validator"
import mongoose from "mongoose"
const { isValidObjectId } = mongoose
import { JWTAuthMiddleware } from "../../auth/middlewares.js"
import { checkIfAdmin } from "../../auth/permissions.js"
import { LoginValidator, UserValidator, UserEditValidator } from "./validator.js"
import { refreshTokens, JWTAuthenticate } from "../../auth/tools.js"
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer from "multer"

const usersRouter = express.Router()

usersRouter.post("/register", UserValidator, async (req, res, next) => {
    try {
        const errors = validationResult(req)
        if (errors.isEmpty()) {
            const entry = new Model(req.body)
            const result = await entry.save()

            const { email, password } = req.body
            const user = await Model.checkCredentials(email, password)

            if (user) {
                const { accessToken, refreshToken } = await JWTAuthenticate(user)

                res.cookie("accessToken", accessToken, { httpOnly: true /*sameSite: "lax", secure: true*/ })
                res.cookie("refreshToken", refreshToken, { httpOnly: true /*sameSite: "lax", secure: true*/ })
                res.redirect("http://localhost:666/")
            } else next(createError(500, "Something went wrong while registering"))
        } else next(createError(400, errors.mapped()))
    } catch (error) {
        next(error)
    }
})

usersRouter.post("/login", LoginValidator, async (req, res, next) => {
    try {
        const errors = validationResult(req)
        if (errors.isEmpty()) {
            const { email, password } = req.body
            const tokens = req.user
            const user = await Model.checkCredentials(email, password)

            if (user) {
                const { accessToken, refreshToken } = await JWTAuthenticate(user)

                res.cookie("accessToken", tokens.accessToken, { httpOnly: true /*sameSite: "lax", secure: true*/ })
                res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true /*sameSite: "lax", secure: true*/ })
                res.status(200).redirect(req.baseUrl)
            } else next(createError(401, "Wrong credentials provided"))
        } else next(createError(400, errors.mapped()))
    } catch (error) {
        next(error)
    }
})

usersRouter.get("/login/oauth/google/login", passport.authenticate("google", { scope: ["profile", "email"] }))
usersRouter.get("/login/oauth/google/redirect", passport.authenticate("google"), async (req, res, next) => {
    try {
        const tokens = req.user
        res.cookie("accessToken", tokens.accessToken, { httpOnly: true /*sameSite: "lax", secure: true*/ })
        res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true /*sameSite: "lax", secure: true*/ })
        res.status(200).redirect("http://localhost:666/")
    } catch (error) {
        next(error)
    }
})

usersRouter.post("/logout", JWTAuthMiddleware, async (req, res, next) => {
    try {
        let user = req.user
        user.refreshToken = undefined
        await user.save()
        res.status(205).send("Logged out")
    } catch (error) {
        next(error)
    }
})

usersRouter.post("/refreshToken", async (req, res, next) => {
    try {
        if (!req.body.refreshToken) next(createError(400, "Refresh Token not provided"))
        else {
            const { newAccessToken, newRefreshToken } = await refreshTokens(req.body.refreshToken)
            res.send({ newAccessToken, newRefreshToken })
        }
    } catch (error) {
        next(error)
    }
})

usersRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
    try {
        const query = q2m(req.query)
        const pages = await Model.countDocuments(query.criteria)
        const maxLimit = 10
        const result = await Model.find(query.criteria)
            .sort(query.options.sort)
            .skip(query.options.skip || 0)
            .limit(query.options.limit && query.options.limit < maxLimit ? query.options.limit : maxLimit)
        const response = result.map(entry => ({ _id: entry._id, firstname: entry.firstname, surname: entry.surname }))
        res.status(200).send({ navigation: query.links("/users", pages), pages, response })
    } catch (error) {
        next(error)
    }
})

usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
    try {
        res.send(req.user)
    } catch (error) {
        next(error)
    }
})

usersRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
    try {
        const user = req.user
        await user.deleteOne()
        res.status(404).send("User not found")
        //res.sendStatus(204)
    } catch (error) {
        next(error)
    }
})

usersRouter.put("/me", JWTAuthMiddleware, UserEditValidator, async (req, res, next) => {
    const { firstname, surname, email } = req.body
    try {
        const errors = validationResult(req)
        if (errors.isEmpty()) {
            let user = req.user
            user.firstname = firstname
            user.surname = surname
            user.email = email
            //user.password = await hashPassword(req.body.password) // <= goes to own route in next revision

            const result = await user.save()

            res.status(200).send(result)
        } else next(createError(400, errors.mapped()))
    } catch (error) {
        next(error)
    }
})

const mongoUploadOptions = { new: true, useFindAndModify: false, timestamps: false }
const cloudinaryStorage = new CloudinaryStorage({ cloudinary, params: { folder: "BW4" } })
const upload = multer({ storage: cloudinaryStorage }).single("avatar")
usersRouter.post("/me/avatar", upload, async (req, res, next) => {
    try {
        let user = req.user
        user.avatar = await Model.findByIdAndUpdate(req.user._id, { $set: { avatar: req.file.path } }, mongoUploadOptions)
        const result = await user.save()
        res.status(200).send(result)
    } catch (error) {
        next(error)
    }
})

usersRouter.get("/:id", async (req, res, next) => {
    try {
        if (!isValidObjectId(req.params.id)) next(createError(400, `ID ${req.params.id} is invalid`))
        else {
            const result = await Model.findById(req.params.id)
            if (!result) next(createError(404, `ID ${req.params.id} was not found`))
            else res.status(200).send(result)
        }
    } catch (error) {
        next(error)
    }
})

usersRouter.delete("/:id", JWTAuthMiddleware, checkIfAdmin, async (req, res, next) => {
    try {
        let result
        if (!isValidObjectId(req.params.id)) next(createError(400, `ID ${req.params.id} is invalid`))
        else result = await Model.findByIdAndDelete(req.params.id, { useFindAndModify: false })

        if (result) res.status(204).send()
        else next(createError(404, `ID ${req.params.id} was not found`))
    } catch (error) {
        next(error)
    }
})

const mongoPutOptions = { runValidators: true, new: true, useFindAndModify: false }
usersRouter.put("/:id", JWTAuthMiddleware, checkIfAdmin, async (req, res, next) => {
    try {
        let result
        if (!isValidObjectId(req.params.id)) next(createError(400, `ID ${req.params.id} is invalid`))
        else result = await Model.findByIdAndUpdate(req.params.id, req.body, mongoPutOptions)

        if (!result) next(createError(404, `ID ${req.params.id} was not found`))
        else res.status(200).send(result)
    } catch (error) {
        next(error)
    }
})

export default usersRouter
