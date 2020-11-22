// server

const express = require('express')
const path = require("path")
const hbs = require("hbs")
const http = require("http")
const socketIo = require('socket.io')
const Filter = require('bad-words')
const {
    generateMessage,
    generateLocationMessage
} = require('./utils/messages')
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

const port = process.env.PORT


// Define paths for Express Config

const public = (path.join(__dirname, "../public"))
const viewPath = path.join(__dirname, "../templates/views")
const partialsPath = path.join(__dirname, "../templates/partials")

// Setup handlebars engine and views location
app.set("view engine", "hbs")
app.set("views", viewPath)
hbs.registerPartials(partialsPath)

// Setup static directory to serve
app.use(express.static(public))
app.get("", (req, res) => {
    res.render("index", {
        title: "Chat App",
        name: "Nicholas Hartman",
    })
})

app.get("/chat", (req, res) => {
    res.render("chat", {
        title: "Chat App",
        name: "Nicholas Hartman",
    })
})


io.on("connection", (socket) => {
    console.log("New websocket connection")

    socket.on("join", ({
        username,
        room
    }, callback) => {
        const {
            error,
            user
        } = addUser({
            id: socket.id,
            username,
            room
        })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit("message", generateMessage("Admin", "Welcome!")) //Broadcast to only the user
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined!`)) //Broadcast to everyone but the user
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })

    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)

        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed!")
        }
        io.to(user.room).emit("message", generateMessage(user.username, message)) // Broadcast to everyone including user
        // for IO.emit first argument is "message" 2nd argument is information from client side
        callback()
    })

    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on("disconnect", () => {

        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left!`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })


})

server.listen(port, () => {
    console.log(`Port is up on ${ port }`)
})