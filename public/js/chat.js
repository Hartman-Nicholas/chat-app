// Client


const socket = io()

// Elements

const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector("#sidebar")


// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const {
    username,
    room
} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

const autoScroll = () => {

    // New message element
    const $newMessage = $messages.lastElementChild


    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Handlebars.compile(messageTemplate)

    $messages.insertAdjacentHTML('beforeend', html({
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    }))
    autoScroll()
})


socket.on("locationMessage", (locationMessage) => {
    const html = Handlebars.compile(locationTemplate)

    $messages.insertAdjacentHTML("beforeend", html({
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format("h:mm a")
    }))
    autoScroll()
})

socket.on("roomData", ({
    room,
    users
}) => {
    const html = Handlebars.compile(sidebarTemplate)
    $sidebar.innerHTML = html({
        room,
        users
    })
})





$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute("disabled", "disabled")
    // disable

    const message = e.target.elements.message.value
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()
        // enable
        if (error) {
            return console.log(error)
        }
        console.log("The message was delivered!")
    }) // for socket.emit first argument is linking name to server 2nd argument is for relaying the data

})



$sendLocationButton.addEventListener("click", () => {

    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser")
    }
    $sendLocationButton.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            if (error) {
                return console.log(error)
            }
            $sendLocationButton.removeAttribute("disabled")
            console.log("Location shared successfully")
        })
    })
})

socket.emit("join", {
    username,
    room
}, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})