
import { global, loadOptions } from "./global.js";
import { MusicManager } from "./game.js";


document.addEventListener("DOMContentLoaded", () => {

    const inputs = [
        { id: "timeToThink", key: "timeToThink" },
        { id: "timeToJudge", key: "timeToJudge" },
        { id: "roundDuration", key: "roundDuration" },
        { id: "roundsCount", key: "roundsCount" }
    ];

    inputs.forEach(({ id, key }) => {
        const input = document.getElementById(id);
        if (!input) {
            console.warn(`Elemento com id="${id}" não encontrado no HTML`);
            return; // pula esse input
        }

        const saved = localStorage.getItem(key);
        if (saved !== null) input.value = saved;

        input.addEventListener("input", () => {
            localStorage.setItem(key, input.value);
            loadOptions(); 
        });
    });


    // Música: só inicia quando o usuário habilitar o som
    const musicManager = new MusicManager();
    const soundOn = document.querySelector('input[type="radio"][id="sound-on"]');
    const soundOff = document.querySelector('input[type="radio"][id="sound-off"]');

    // Por padrão, som OFF
    if (soundOn && soundOff) {
        // Recupera preferência do localStorage
        const savedSound = localStorage.getItem('sound');
        if (savedSound === 'on') {
            soundOn.checked = true;
            soundOff.checked = false;
            musicManager.play(true);
        } else {
            soundOn.checked = false;
            soundOff.checked = true;
        }


        soundOn.addEventListener('change', async function() {
            if (soundOn.checked) {
                localStorage.setItem('sound', 'on');
                await musicManager.play(true); // menu music
            }
        });
        soundOff.addEventListener('change', function() {
            if (soundOff.checked) {
                localStorage.setItem('sound', 'off');
                musicManager.stop();
            }
        });
    }

    loadOptions();
});



// Transição suave ao clicar em PLAY na escolha de job
document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.querySelector('.job-modal-play');
    const fadeDiv = document.getElementById('job-fade-transition');
    if (playBtn && fadeDiv) {
        playBtn.addEventListener('click', function (e) {
            e.preventDefault();
            fadeDiv.classList.remove('hidden');
            // Força reflow para garantir transição
            setTimeout(() => {
                fadeDiv.classList.add('active');
            }, 10);
            setTimeout(() => {
                window.location.href = 'pages/game.html';
            }, 800);
        });
    }
});
/// SOUND
let playingSoundsController = {
    hover: false
}

// Constrói URL absoluta correta considerando subpath do GitHub Pages
const hoverUrl = new URL('assets/audio/hover.wav', window.location.href).toString();
const hoverSound = new Howl({
    src: [hoverUrl],
    html5: true,
    pool: 20, // aumenta ainda mais o número de instâncias simultâneas
    preload: true
});

hoverSound.volume(0.4)

// Se der erro de carregamento, loga para diagnosticar caminho incorreto
hoverSound.on('loaderror', (id, err) => {
    try {
        const src = (hoverSound && hoverSound._src) || (hoverSound && hoverSound._sounds && hoverSound._sounds[0] && hoverSound._sounds[0]._src) || 'unknown';
        console.error('Hover sound loaderror:', err, 'src:', src);
    } catch (e) {
        console.error('Hover sound loaderror (no src info):', err);
    }
});

// Delegação garante que funcione mesmo que o DOM mude

// Garante desbloqueio do áudio em primeiro input do usuário
let audioUnlocked = false;
const tryUnlockAudio = () => {
        if (audioUnlocked) return;
        audioUnlocked = true;
        try { if (Howler && Howler.ctx && Howler.ctx.state === 'suspended') { Howler.ctx.resume(); } } catch(_){}
        try { hoverSound.load(); } catch(_){}
        // Prime silencioso para garantir liberação do contexto
        try {
            const prevMute = Howler._muted;
            Howler.mute(true);
            const id = hoverSound.play();
            hoverSound.once('play', () => {
                try { hoverSound.stop(id); } catch(_){}
                Howler.mute(prevMute || false);
            });
        } catch(_){}
        // remove unlock listeners após sucesso
        ['pointerdown','click','touchstart','keydown'].forEach(evt => {
            try { window.removeEventListener(evt, tryUnlockAudio, true); } catch(_){}
        });
};
['pointerdown','click','touchstart','keydown'].forEach(evt => {
    window.addEventListener(evt, tryUnlockAudio, { capture: true });
});

document.addEventListener("mouseover", (e) => {
    const opt = e.target.closest('.option');
    if (!opt) return;
    if (playingSoundsController.hover == false) {
        const id = hoverSound.play();
        // Só marcar como ocupando após iniciar de fato
        hoverSound.once('play', () => { playingSoundsController.hover = true; });
        hoverSound.once('playerror', () => { playingSoundsController.hover = false; });
        hoverSound.once('loaderror', () => { playingSoundsController.hover = false; });
    }
});

hoverSound.on('end', () => {
    playingSoundsController.hover = false
})
hoverSound.on('playerror', () => {
    playingSoundsController.hover = false;
})

// DIALOG

const dialogOverlay = document.querySelector(".dialog-overlay")
const dialogClose = document.querySelector(".dialog-close")

// Exibe a tela de escolha de job ao clicar em PLAY
document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.getElementById('menu-play');
    const chooseJobScreen = document.querySelector('.choose-job-screen');
    const menuOptions = document.querySelector('.menu-options');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const backBtn = document.querySelector('.choose-job-back');
    if (playBtn && chooseJobScreen) {
        playBtn.addEventListener('click', function () {
            menuOptions.style.display = 'none';
            header.style.display = 'none';
            footer.style.display = 'none';
            chooseJobScreen.style.display = 'block';
        });
    }
    // Garante que só o botão de voltar da tela de job execute esse código
    if (backBtn && chooseJobScreen) {
        backBtn.addEventListener('click', function () {
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

document.addEventListener("DOMContentLoaded", () => {
    startMusic();
    const jobCards = document.querySelectorAll(".choose-job-card");
    jobCards.forEach(card => {
        try { card.classList.remove("locked"); } catch (e) { /* ignore */ }
    });
});
const synth = new Tone.Synth().toDestination();

const notes = ["C4", "E4", "G4", "B4", "A4", "F4", "D4", "G3"];

let index = 0;
const loop = new Tone.Loop(time => {
    synth.triggerAttackRelease(notes[index % notes.length], "8n", time);
    index++;
}, "0.5s");

    // Iniciar transporte e loop após interação (alguns browsers exigem isso)
    async function startMusic() {
      await Tone.start();
      loop.start(0);
      Tone.Transport.start();
    }
