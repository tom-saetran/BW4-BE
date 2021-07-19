import mongoose from "mongoose"
import server from "./server.js"

process.env.TS_NODE_DEV && require("dotenv").config()
const port = process.env.PORT || 3030

const { MONGO_CONNECTION } = process.env
if (!MONGO_CONNECTION) throw new Error("No Mongo DB specified")

mongoose
  .connect(MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() =>
    server.listen(port, () => console.log("Server running on port", port))
  )
  .catch((e) => console.log(e))

// TODO: connect to postgres as well
