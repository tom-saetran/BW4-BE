import csrf from "csurf"
import cors from "cors"
import express from "express"
import passport from "passport"
import oauth from "./auth/oauth.js"
import cookieParser from "cookie-parser"
import usersRoutes from "./services/users/index.js"
//import chatRoutes from "./services/chat/index.js"
import { unAuthorizedHandler, forbiddenHandler, catchAllHandler, error400 } from "./errorHandlers.js"

const server = express()

// MIDDLEWARES

server.use(cors({ origin: "localhost", credentials: true }))
server.use(express.json())
server.use(cookieParser())
server.use(passport.initialize({ session: true }))
server.use(csrf({ cookie: { httpOnly: true /*, sameSite: "lax", secure: true*/ } }))

// ROUTES
server.use("/users", usersRoutes)
//server.use("/chat", chatRoutes)

// ERROR HANDLERS
server.use(error400)
server.use(unAuthorizedHandler)
server.use(forbiddenHandler)
server.use(catchAllHandler)

export default server
