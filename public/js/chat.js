const socket = io()

// Elements

const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML

socket.on('message', (message) => {
    const html = Handlebars.compile(messageTemplate)

    $messages.insertAdjacentHTML('beforeend', html({
        message
    }))

})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute("disabled", "disabled")
    // disable

    const chat = e.target.elements.message.value
    socket.emit("submit", chat, (error) => {
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