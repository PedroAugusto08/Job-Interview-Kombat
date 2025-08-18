import { global } from "./global.js"

const soundOnInput = document.querySelector("#sound-on")
const soundOffInput = document.querySelector("#sound-off")

soundOnInput.addEventListener("change", () => {
    if(soundOnInput.checked) {
        global.sound = true
    } else {
        global.sound = false
    }
})

soundOffInput.addEventListener("change", () => {
    if(soundOffInput.checked) {
        global.sound = false
    } else {
        global.sound = true
    }
})