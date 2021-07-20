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

const server = express()
// MIDDLEWARES

server.use(cors({ origin: "localhost", credentials: true }))
server.use(express.json())
server.use(cookieParser())
server.use(passport.initialize({ session: true }))
server.use(csrf({ cookie: { httpOnly: true /*, sameSite: "lax", secure: true*/ } }))

// ROUTES
server.use("/users", usersRoutes)
server.use("/chat", JWTAuthMiddleware, chatRoutes)

// ERROR HANDLERS
server.use(error4xx)
server.use(catchAllHandler)

export default server
