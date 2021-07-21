import express from "express"
import Model from "./schema.js"
import createError from "http-errors"

const chatRoutes = express.Router()

// POST /room

/**
 * req.body = { members: ['saidevid', 'tomid'] }
 *
 * const {`members } = req.body
 * let {`room } = RoomModel.find({ members })
 *
 * if room send room
 *
 *
 * room = new RoomModel(req.body)
 *
 * // if the room dont exist, clearly the sockets were not joined
 *
 * for each participant id, grab their socket and have these sockets join the new room id
 *
 * res send room._id
 *
 */

chatRoutes.post("/room", async (req, res, next) => {
    const { members } = req.body
    const room = await Model.findOne({ members })

    if (room) res.status(200).send(room._id)
    else {
        room = new Model(members)
        await room.save()
        res.status(201).send(room._id)
    }
})
// FRONT END CLUES 🦊
// if (res.status === 200) => "OLD ROOM ID"
// else if (res.status === 201) => "NEW ROOM ID"
// else => "💩 WE LOST CONNECTION 🔌 OR SERVER EXPLODED 💥"

// GET chat history for room
// GET rooms for user with userid

// GET ROOMS FROM USERDB? WITH ROOM ID
chatRoutes.get("/", async (req, res, next) => {
    const myRooms = await Model.find({ members: req.user._id })
    if (myRooms.length > 0) res.send(myRooms)
    else next(createError(404, "You are alone in this world"))
})

//GET CHATS IN ROOM WITH ID
chatRoutes.get("/room/:chatid", async (req, res, next) => {
    try {
        const room = await Model.findById(req.params.chatid)
        res.status(200).send({ chats: room.chats })
    } catch (error) {
        next(error)
    }
})

export default chatRoutes

/*

    search user - in progress

    get /users/me/chats retrieve all chats (rooms) from db when logging in but not all history, participant id = my id
    get /users/me/chats/:id retrieve chat history from db, participant id = my id
    post /room with two user ids then join, if exist go there instead

*/
