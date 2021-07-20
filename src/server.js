import cors from "cors"
import csrf from "csurf"
import express from "express"
import passport from "passport"
import oauth from "./auth/oauth.js"
import cookieParser from "cookie-parser"
import usersRoutes from "./services/users/index.js"
import chatRoutes from "./services/chat/index.js"
import { catchAllHandler, error4xx } from "./errors.js"
import { JWTAuthMiddleware } from "./auth/middlewares.js"
import { cookieOptions } from "./auth/tools.js"

const server = express()
// MIDDLEWARES
const whitelist = [process.env.FRONTEND_DEV_URL, process.env.FRONTEND_PROD_URL]
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

server.use(cors())
server.use(express.json())
server.use(cookieParser())
server.use(passport.initialize({ session: true }))
server.use(csrf({ cookie: cookieOptions }))

// ROUTES
server.use("/users", usersRoutes)
server.use("/chat", JWTAuthMiddleware, chatRoutes)

// ERROR HANDLERS
server.use(error4xx)
server.use(catchAllHandler)

export default server
