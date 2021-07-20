import express from "express"
import mongoose from "mongoose"
import createError from "http-errors"
import rateLimiter from "express-rate-limit"
import speedLimiter from "express-slow-down"
import { validationResult } from "express-validator"
import { JWTAuthMiddleware } from "../../auth/middlewares.js"
import { checkIfAdmin } from "../../auth/permissions.js"
import { ChatValidator } from "./validator.js"
import Model from "./schema.js"

const { isValidObjectId } = mongoose
const chatRouter = express.Router()

const heavyRateLimiter = rateLimiter({ windowMs: 60000, max: 5 })
const normalSpeedLimiter = speedLimiter({ windowMs: 60000, delayAfter: 60, delayMs: 1000 })

chatRouter.get("/", JWTAuthMiddleware, normalSpeedLimiter, async (req, res, next) => {
    try {
        //
    } catch (error) {
        next(error)
    }
})

chatRouter.get("/:id", JWTAuthMiddleware, normalSpeedLimiter, async (req, res, next) => {
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

chatRouter.post("/", heavyRateLimiter, JWTAuthMiddleware, ChatValidator, async (req, res, next) => {
    try {
        //
    } catch (error) {
        next(error)
    }
})

const mongoPutOptions = { runValidators: true, new: true, useFindAndModify: false }
chatRouter.put("/:id", heavyRateLimiter, JWTAuthMiddleware, checkIfAdmin, async (req, res, next) => {
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

chatRouter.delete("/:id", heavyRateLimiter, JWTAuthMiddleware, checkIfAdmin, async (req, res, next) => {
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

export default chatRouter
