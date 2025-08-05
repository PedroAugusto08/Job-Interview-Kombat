
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
        description: 'Codifica as interfaces, aplicativos e servidores.\nJunto do seu time, é uma parte essencial para a criação do produto!',
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
    card.addEventListener('click', function () {
        const nameSpan = card.querySelector('.choose-job-name');
        if (nameSpan) {
            openJobModal(nameSpan.textContent.trim());
        }
    });
});

// Botão de voltar no modal
jobModalBack.addEventListener('click', closeJobModalSidebar);

// Botão de jogar (aqui só fecha o modal, mas vai iniciar o jogo depois)
jobModalPlay.addEventListener('click', function () {
    closeJobModalSidebar();
    const job = jobModalTitle.textContent.trim().toLowerCase(); // ex: 'designer'
    window.location.href = `/pages/game.html?job=${job}`;
});