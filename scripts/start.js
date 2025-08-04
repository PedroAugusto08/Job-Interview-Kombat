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
    
    // === JOB MODAL SIDEBAR ===
    const jobModal = document.querySelector('.job-modal-sidebar');
    const jobModalTitle = jobModal.querySelector('.job-modal-title');
    const jobModalDescription = jobModal.querySelector('.job-modal-description');
    const jobModalHearts = jobModal.querySelector('.job-modal-hearts');
    const jobModalBack = jobModal.querySelector('.job-modal-back');
    const jobModalPlay = jobModal.querySelector('.job-modal-play');
    
    // Dados dos jobs (exemplo, pode expandir depois)
    const jobsInfo = {
      'DEV': {
        title: 'DEVELOPER',
        description: 'Special thanks to all beta testers and the entire cefetian community!\nHave fun and get the job!\nSpecial thanks to all beta testers and the entire cefetian community!\nSpecial thanks to all beta testers and the entire cefetian community!',
        hearts: 3
      },
      'DESIGNER': {
        title: 'DESIGNER',
        description: 'Cria as interfaces, animações e artes do jogo.\nColabora com o time para entregar uma experiência incrível!',
        hearts: 2
      },
      'PM': {
        title: 'PROJECT MANAGER',
        description: 'Organiza o time, define metas e garante que tudo saia no prazo.\nFaz a ponte entre todos!',
        hearts: 2
      },
      'QA': {
        title: 'QUALITY ASSURANCE',
        description: 'Testa o jogo, encontra bugs e sugere melhorias.\nNada escapa do olhar atento!',
        hearts: 1
      },
      'DATA': {
        title: 'DATA ANALYST',
        description: 'Analisa dados, gera relatórios e ajuda o time a tomar decisões melhores!',
        hearts: 2
      }
    };
    
    // Função para abrir o modal do job
    function openJobModal(jobKey) {
      const info = jobsInfo[jobKey];
      if (!info) return;
      jobModalTitle.textContent = info.title;
      jobModalDescription.innerHTML = info.description.replace(/\n/g, '<br>');
      jobModalHearts.innerHTML = '❤️ '.repeat(info.hearts).trim();
      jobModal.style.display = 'flex';
    }
    
   // Seleciona o modal lateral
const jobModalSidebar = document.querySelector('.job-modal-sidebar');
// Seleciona o botão de fechar (ajuste o seletor se necessário)
const jobModalBackBtn = document.querySelector('.job-modal-back');

// Função para fechar com animação
function closeJobModalSidebar() {
  if (!jobModalSidebar) return;
  jobModalSidebar.classList.add('slide-out');
  // Espera a animação terminar antes de esconder
  setTimeout(() => {
    jobModalSidebar.style.display = 'none';
    jobModalSidebar.classList.remove('slide-out');
  }, 400); // tempo igual ao da animação
}

// Adiciona o evento ao botão de voltar
if (jobModalBackBtn) {
  jobModalBackBtn.addEventListener('click', closeJobModalSidebar);
}
    
    // Adiciona evento nos cards de job
    document.querySelectorAll('.choose-job-card').forEach(card => {
      card.addEventListener('click', function() {
        const nameSpan = card.querySelector('.choose-job-name');
        if (nameSpan) {
          openJobModal(nameSpan.textContent.trim());
        }
      });
    });
    
    // Botão de voltar no modal
    jobModalBack.addEventListener('click', closeJobModalSidebar);
    
    // Botão de jogar (aqui só fecha o modal, mas vai iniciar o jogo depois)
    jobModalPlay.addEventListener('click', function() {
      closeJobModalSidebar();
      // Aqui adiciona a lógica para iniciar o jogo
    });