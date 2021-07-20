import multer from "multer"
import express from "express"
import passport from "passport"
import mongoose from "mongoose"
import q2m from "query-to-mongo"
import createError from "http-errors"
import rateLimiter from "express-rate-limit"
import speedLimiter from "express-slow-down"
import { v2 as cloudinary } from "cloudinary"
import { validationResult } from "express-validator"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import Model from "./schema.js"
import { cookieOptions } from "../../auth/tools.js"
import { checkIfAdmin } from "../../auth/permissions.js"
import { JWTAuthMiddleware } from "../../auth/middlewares.js"
import { refreshTokens, JWTAuthenticate } from "../../auth/tools.js"
import { LoginValidator, UserValidator, UserEditValidator } from "./validator.js"

const { isValidObjectId } = mongoose
const usersRouter = express.Router()

const heavyRateLimiter = rateLimiter({ windowMs: 60000, max: 5 })
const normalSpeedLimiter = speedLimiter({ windowMs: 60000, delayAfter: 60, delayMs: 1000 })

usersRouter.post("/register", heavyRateLimiter, UserValidator, async (req, res, next) => {
    try {
        const errors = validationResult(req)
        if (errors.isEmpty()) {
            const entry = new Model(req.body)
            const result = await entry.save()

            if (result) {
                const { email, password } = req.body
                const user = await Model.checkCredentials(email, password)

                if (user) {
                    const { accessToken, refreshToken } = await JWTAuthenticate(user)

                    res.cookie("accessToken", accessToken, { httpOnly: true /*sameSite: "lax", secure: true*/ })
                    res.cookie("refreshToken", refreshToken, cookieOptions)
                    res.redirect("http://localhost:666/")
                } else next(createError(500, "Something went wrong while logging in"))
            } else next(createError(500, "Something went wrong while registering"))
        } else next(createError(400, errors.mapped()))
    } catch (error) {
        next(error)
    }
})

usersRouter.post("/login", heavyRateLimiter, LoginValidator, async (req, res, next) => {
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

usersRouter.get("/login/oauth/google/login", normalSpeedLimiter, passport.authenticate("google", { scope: ["profile", "email"] }))
usersRouter.get("/login/oauth/google/redirect", normalSpeedLimiter, passport.authenticate("google"), async (req, res, next) => {
    try {
        const { tokens } = req.user
        res.cookie("accessToken", tokens.accessToken, cookieOptions)
        res.cookie("refreshToken", tokens.refreshToken, cookieOptions)
        res.redirect("./chat")
    } catch (error) {
        next(error)
    }
})

usersRouter.post("/logout", heavyRateLimiter, JWTAuthMiddleware, async (req, res, next) => {
    try {
        let user = req.user
        user.refreshToken = undefined
        await user.save()
        res.status(205).send("Logged out")
    } catch (error) {
        next(error)
    }
})

usersRouter.post("/refreshToken", heavyRateLimiter, async (req, res, next) => {
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

usersRouter.get("/", normalSpeedLimiter, JWTAuthMiddleware, async (req, res, next) => {
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

usersRouter.get("/me", normalSpeedLimiter, JWTAuthMiddleware, async (req, res, next) => {
    try {
        res.send(req.user)
    } catch (error) {
        next(error)
    }
})

usersRouter.delete("/me", heavyRateLimiter, JWTAuthMiddleware, async (req, res, next) => {
    try {
        const user = req.user
        await user.deleteOne()
        res.status(404).send("User not found")
        //res.sendStatus(204)
    } catch (error) {
        next(error)
    }
})

usersRouter.put("/me", heavyRateLimiter, UserEditValidator, JWTAuthMiddleware, async (req, res, next) => {
    const { firstname, surname, email, screenname } = req.body
    try {
        const errors = validationResult(req)
        if (errors.isEmpty()) {
            let user = req.user
            user.firstname = firstname
            user.surname = surname
            user.screenname = screenname
            user.email = email
            user.password = await hashPassword(req.body.password) // <= goes to own route in next revision

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
usersRouter.post("/me/avatar", heavyRateLimiter, JWTAuthMiddleware, upload, async (req, res, next) => {
    try {
        let user = req.user
        user.avatar = await Model.findByIdAndUpdate(req.user._id, { $set: { avatar: req.file.path } }, mongoUploadOptions)
        const result = await user.save()
        res.status(200).send(result)
    } catch (error) {
        next(error)
    }
})

usersRouter.get("/:id", normalSpeedLimiter, JWTAuthMiddleware, async (req, res, next) => {
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

usersRouter.delete("/:id", heavyRateLimiter, JWTAuthMiddleware, checkIfAdmin, async (req, res, next) => {
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
usersRouter.put("/:id", heavyRateLimiter, JWTAuthMiddleware, checkIfAdmin, async (req, res, next) => {
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
