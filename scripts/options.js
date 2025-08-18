import { global } from "./global.js"

const soundOnInput = document.querySelector("#sound-on")
const soundOffInput = document.querySelector("#sound-off")
const fullscreenOnInput = document.querySelector("#fs-on")
const fullscreenOffInput = document.querySelector("#fs-off")

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

fullscreenOnInput.addEventListener("change", () => {
    if(fullscreenOnInput.checked) {
        document.documentElement.requestFullscreen()
    } else {
        document.exitFullscreen()
    }
})

fullscreenOffInput.addEventListener("change", () => {
    if(fullscreenOffInput.checked) {
        document.exitFullscreen()
    } else {
        document.documentElement.requestFullscreen()
    }
})
