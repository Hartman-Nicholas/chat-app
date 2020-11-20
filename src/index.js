const express = require('express')
const path = require("path")
const hbs = require("hbs")
const http = require("http")
const socketIo = require('socket.io')
const Filter = require('bad-words')

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
        title: "Weather App",
        name: "Nicholas Hartman",
    })
})


io.on("connection", (socket) => {
    console.log("New websocket connection")

    socket.emit("message", "Welcome!") //Broadcast to only the user
    socket.broadcast.emit("message", "A new user has joined") //Broadcast to everyone but the user


    socket.on("submit", (chat, callback) => {
        const filter = new Filter()

        if (filter.isProfane(chat)) {
            return callback("Profanity is not allowed!")
        }
        io.emit("message", chat) // Broadcast to everyone including user
        // for IO.emit first argument is "message" 2nd argument is information from client side
        callback()
    })

    socket.on("sendLocation", (coords, callback) => {
        io.emit("locationMessage", `https://google.com/maps?=${coords.latitude},${coords.longitude}`)
        callback()
    })

    socket.on("disconnect", () => {
        io.emit("message", "A user has left")
    })


})

server.listen(port, () => {
    console.log(`Port is up on ${ port }`)
})