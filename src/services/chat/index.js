import express from "express"
import createError from "http-errors"
import { chatSchema } from "./schema.js"
import sequelize from "./schema.js"

const chatRouter = express.Router()
chatRouter
  .route("/")
  .get(async (req, res, next) => {
    try {
      const data = await chatSchema.findAll()
      res.send(data)
    } catch (e) {
      console.log(e)
      next(
        createError(500, "Oops something went wrong, please try again later")
      )
    }
  })

  .post(async (req, res, next) => {
    try {
      const data = await chatSchema.create(req.body)
      res.send(data)
    } catch (e) {
      console.log(e)
      next(
        createError(500, "Oops something went wrong, please try again later")
      )
    }
  })

chatRouter
  .route("/:id")

  .get(async (req, res, next) => {
    try {
      const data = await chatSchema.findByPk(req.params.id)
      res.send(data)
    } catch (e) {
      console.log(e)
      next(
        createError(500, "Oops something went wrong, please try again later")
      )
    }
  })
  .put(async (req, res, next) => {
    try {
      const data = await chatSchema.update(req.body, {
        returning: true,
        where: { id: req.params.id },
      })
      res.send(data)
    } catch (e) {
      console.log(e)
      next(
        createError(500, "Oops something went wrong, please try again later")
      )
    }
  })
  .delete(async (req, res, next) => {
    try {
      const Deleted = await chatSchema.destroy({ where: { id: req.params.id } })
      res.send("Deleted successfully")
    } catch (e) {
      console.log(e)
      next(
        createError(500, "Oops something went wrong, please try again later")
      )
    }
  })
export default chatRouter
