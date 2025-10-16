
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
        description: 'Codes the interfaces, applications and servers.\nTogether with your team, it is an essential part of creating the product!',
        hearts: 3
    },
    'GENERAL': {
        title: 'GENERAL',
        description: 'A mix focused only on common interview questions.\nGreat to warm up before going specific!',
        hearts: 1
    },
    'DESIGNER': {
        title: 'DESIGNER',
        description: 'Create the games interfaces, animations, and art.\nCollaborate with the team to deliver an incredible experience!',
        hearts: 2
    },
    'PM': {
        title: 'PROJECT MANAGER',
        description: 'Organizes the team, sets goals and ensures everything is delivered on time.\nIt bridges the gap between everyone!',
        hearts: 2
    },
    'QA': {
        title: 'QUALITY ASSURANCE',
        description: 'Test the game, find bugs and suggest improvements.\nNothing escapes your watchful eye!',
        hearts: 1
    },
    'DATA': {
        title: 'DATA ANALYST',
        description: 'Analyze data, generate reports, and help the team make better decisions!',
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
    window.location.href = `pages/game.html?job=${encodeURIComponent(job)}`;
});