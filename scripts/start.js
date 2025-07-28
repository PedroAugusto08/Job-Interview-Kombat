
const hoverSound = new Howl({
    src: ['../assets/audio/hover.wav'],
    html5: true
})

hoverSound.volume(0.4)

const options = document.querySelectorAll(".option")

options.forEach(opt => {
    opt.addEventListener("mouseover", () => {
        hoverSound.play();
    })
})