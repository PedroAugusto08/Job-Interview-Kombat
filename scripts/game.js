// game.js

// Função para obter parâmetros da URL
function getJobFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('job'); // retorna 'designer', 'dev', etc.
}

// Perguntas por job (exemplo simples, você pode expandir)
const jobQuestions = {
    designer: [
        "Qual software é mais usado para prototipação de interfaces?",
        "O que é design responsivo?",
        "O que significa UI e UX?"
    ],
    dev: [
        "O que é uma API?",
        "Qual a diferença entre front-end e back-end?",
        "O que é um loop infinito?"
    ],
    qa: [
        "O que é um teste de regressão?",
        "Como você reporta um bug?",
        "O que é um teste automatizado?"
    ],
    pm: [
        "O que é um roadmap de projeto?",
        "Como se define um MVP?",
        "O que é metodologia ágil?"
    ],
    data: [
        "O que é uma análise preditiva?",
        "Como o Big Data impacta decisões?",
        "O que é um dashboard?"
    ]
};

// Carregar perguntas baseado no job
function loadGame() {
    const job = getJobFromURL();
    const questions = jobQuestions[job];

    const jobTitle = document.getElementById('job-title');
    const container = document.getElementById('questions-container');

    if (!questions) {
        alert("Job inválido. Redirecionando para o menu.");
        window.location.href = "/start.html"; // ajustar
    }


    jobTitle.textContent = `Jogo iniciado para: ${job.toUpperCase()}`;

    questions.forEach((q, i) => {
        const p = document.createElement('p');
        p.textContent = `${i + 1}. ${q}`;
        container.appendChild(p);
    });
}

// Inicia o jogo
window.addEventListener('DOMContentLoaded', loadGame);
