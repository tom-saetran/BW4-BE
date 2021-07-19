import s from "sequelize"
import bcrypt, { hash } from "bcrypt"
const { Sequelize, DataTypes } = s
import pg from "pg"
const Client = pg.Client
const { PGUSER, PGPORT, PGDATABASE, PGPASSWORD, PGHOST, PGURL } = process.env

const client = new Client({
  connectionString: PGURL,
  ssl: {
    rejectUnauthorized: false,
  },
})

client.connect()

// client.query(
//   "SELECT table_schema,table_name FROM information_schema.tables;",
//   (err, res) => {
//     if (err) throw err
//     for (let row of res.rows) {
//       console.log(JSON.stringify(row))
//     }
//     client.end()
//   }
// )

const sequelize = new Sequelize(PGDATABASE, PGUSER, PGPASSWORD, {
  port: PGPORT,
  host: PGHOST,
  dialect: "postgres",
})

sequelize
  .authenticate()
  .then(() => {
    console.log("connected")
  })
  .catch((err) => console.log(err))

const chatSchema = sequelize.define("chats", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
  },
  unread: {
    type: DataTypes.BOOLEAN,
  },
})
export { chatSchema }
export default sequelize
