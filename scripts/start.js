// LOADING SCREEN
window.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const blocks = document.querySelectorAll('.loading-bar-blocks .loading-block');
    let current = 0;
    const total = blocks.length;
    const interval = 45; // ms por bloco

    // Inicialmente, todos os blocos ficam azuis e transparentes
    blocks.forEach(b => {
        b.classList.remove('loading-block-pink');
        b.classList.add('loading-block-blue');
        b.style.opacity = '0.25';
    });

    function fillNextBlock() {
        if (current < total) {
            blocks[current].classList.remove('loading-block-blue');
            blocks[current].classList.add('loading-block-pink');
            blocks[current].style.opacity = '1';
            current++;
            setTimeout(fillNextBlock, interval);
        } else {
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 400);
                }
            }, 400);
        }
    }
    fillNextBlock();
});

/// SOUND
let playingSoundsController = {
    hover: false
}

const hoverSound = new Howl({
    src: ['../assets/audio/hover.wav'],
    html5: true
})

hoverSound.volume(0.4)

const options = document.querySelectorAll(".option")

options.forEach(opt => {
    opt.addEventListener("mouseover", () => {
        if (playingSoundsController.hover == false) {
            hoverSound.play();
            playingSoundsController.hover = true
        }
    })
})

hoverSound.on('end', () => {
    playingSoundsController.hover = false
})

// DIALOG

const dialogOverlay = document.querySelector(".dialog-overlay")
const dialogClose = document.querySelector(".dialog-close")

// Exibe a tela de escolha de job ao clicar em PLAY
document.addEventListener('DOMContentLoaded', function() {
    const playBtn = document.getElementById('menu-play');
    const chooseJobScreen = document.querySelector('.choose-job-screen');
    const menuOptions = document.querySelector('.menu-options');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const backBtn = document.querySelector('.choose-job-back');
    if (playBtn && chooseJobScreen) {
        playBtn.addEventListener('click', function() {
            menuOptions.style.display = 'none';
            header.style.display = 'none';
            footer.style.display = 'none';
            chooseJobScreen.style.display = 'block';
        });
    }
    // Garante que só o botão de voltar da tela de job execute esse código
    if (backBtn && chooseJobScreen) {
        backBtn.addEventListener('click', function() {
            if (chooseJobScreen.style.display === 'block') {
                chooseJobScreen.style.display = 'none';
                menuOptions.style.display = 'flex';
                header.style.display = 'flex';
                footer.style.display = 'block';
            }
        });
    }
});
const menuRulesDialog = document.querySelector(".rules")
const menuOptionsDialog = document.querySelector(".options")
const menuCreditsDialog = document.querySelector(".credits")

const menuRulesButton = document.querySelector("#menu-rules")
const menuOptionsButton = document.querySelector("#menu-options")
const menuCreditsButton = document.querySelector("#menu-credits")

menuRulesButton.addEventListener("click", () => {
    resetMenus()
    menuRulesDialog.classList.add("active")
    dialogOverlay.classList.add("active")
})

menuOptionsButton.addEventListener("click", () => {
    resetMenus()
    menuOptionsDialog.classList.add("active")
    dialogOverlay.classList.add("active")
})

menuCreditsButton.addEventListener("click", () => {
    resetMenus()
    menuCreditsDialog.classList.add("active")
    dialogOverlay.classList.add("active")
})

dialogClose.addEventListener("click", () => {
    resetMenus()
    dialogOverlay.classList.remove('active')
})

const resetMenus = () => {
    menuRulesDialog.classList.remove("active")
    menuCreditsDialog.classList.remove("active")
    menuOptionsDialog.classList.remove("active")
}