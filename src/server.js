import cors from "cors"
import csrf from "csurf"
import express from "express"
import passport from "passport"
import oauth from "./auth/oauth.js"
import cookieParser from "cookie-parser"
import createError from "http-errors"
import usersRoutes from "./services/users/index.js"
import chatRoutes from "./services/chat/index.js"
import { catchAllHandler, error4xx } from "./errors.js"
import { JWTAuthMiddleware } from "./auth/middlewares.js"
import { cookieOptions } from "./auth/tools.js"

const server = express()

if (process.env.TS_NODE_DEV || process.env.NODE_ENV === "test") require("dotenv").config()

const { FRONTEND_DEV_URL, FRONTEND_PROD_URL } = process.env
if (!FRONTEND_DEV_URL || !FRONTEND_PROD_URL) throw new Error("Environment variables unreachable.")

const whitelist = [FRONTEND_DEV_URL, FRONTEND_PROD_URL, `${FRONTEND_PROD_URL}/`, `${FRONTEND_DEV_URL}/`]
const corsOptions = {
    origin: (origin, next) => {
        try {
            if (whitelist.indexOf(origin) !== -1) next(null, true)
            else next(createError(400, "Cross-Site Origin Policy blocked your request"), true)
        } catch (error) {
            next(error)
        }
    }
}

server.use(cors(corsOptions))
server.use(express.json())
server.use(cookieParser())
server.use(passport.initialize({ session: true }))
//server.use(csrf({ cookie: cookieOptions }))

server.use("/users", usersRoutes)
server.use("/chat", JWTAuthMiddleware, chatRoutes)

server.use(error4xx)
server.use(catchAllHandler)

export default server
