
function getJobFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('job');
}

window.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const blocks = document.querySelectorAll('.loading-block');

    let current = 0;
    const interval = 45;

    // Inicializa os blocos
    blocks.forEach(b => {
        b.classList.remove('loading-block-pink');
        b.classList.add('loading-block-blue');
        b.style.opacity = '0.25';
    });

    function fillNextBlock() {
        if (current < blocks.length) {
            blocks[current].classList.remove('loading-block-blue');
            blocks[current].classList.add('loading-block-pink');
            blocks[current].style.opacity = '1';
            current++;
            setTimeout(fillNextBlock, interval);
        } else {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    startAnticipation(startGame); // Inicia o jogo após a tela de antecipação
                }, 400);
            }, 400);
        }
    }

    function startAnticipation(callback) {
        const anticipation = document.getElementById('anticipation-sequence'); 
        anticipation.classList.remove('hidden');

        setTimeout(() => {
            anticipation.style.display = 'none';
            startCountdown(callback); // Passa o callback aqui
        }, 2000); // tempo da tela de antecipação
    }

    function startCountdown(callback) {
        const anticipationDiv = document.getElementById('countdown-screen');
        const img = document.getElementById('countdown-image');

        const images = [
            '/assets/images/8-countdown 3.png',
            '/assets/images/9-countdown 2.png',
            '/assets/images/10-countdown 1.png',
            '/assets/images/ready.png'
        ];

        anticipationDiv.classList.remove('hidden');
        let index = 0;

        function showNextImage() {
            if (index >= images.length) {
                anticipationDiv.classList.add('hidden');
                if (typeof callback === 'function') callback(); // Executa callback de forma segura
                return;
            }

            img.src = images[index];
            img.classList.remove('fadeScale');
            void img.offsetWidth; // Reinicia animação
            img.classList.add('fadeScale');

            index++;
            setTimeout(showNextImage, 1000);
        }

        showNextImage();
    }


    async function startGame() {
        const job = getJobFromURL();
        const jobTitle = document.getElementById('job-title');
        const questionsContainer = document.getElementById('questions-container');
        const gameContainer = document.getElementById('game-container');

        try {
            const response = await fetch('../db/questions.json');
            if (!response.ok) throw new Error('Erro ao carregar o JSON');

            const data = await response.json();

            const generalQuestions = data.general.map(q => q.question);
            const jobQuestions = data[job]?.map(q => q.question);

            if (!jobQuestions || jobQuestions.length === 0) {
                jobTitle.textContent = 'Job inválido!';
                return;
            }

            // Calcular quantidades (metade de cada, arredondando para baixo e completando se necessário)
            const totalQuestions = Math.min(10, generalQuestions.length + jobQuestions.length); // Ex: no máx 10 questões
            const half = Math.floor(totalQuestions / 2);

            const selectedGeneral = shuffleArray(generalQuestions).slice(0, half);
            const selectedJob = shuffleArray(jobQuestions).slice(0, totalQuestions - half);
            const selectedQuestions = shuffleArray([...selectedGeneral, ...selectedJob]);

            jobTitle.textContent = `Jogo iniciado para: ${job.toUpperCase()}`;
            gameContainer.style.display = 'block';

            selectedQuestions.forEach((q, i) => {
                const p = document.createElement('p');
                p.textContent = `${i + 1}. ${q}`;
                questionsContainer.appendChild(p);
            });

        } catch (error) {
            console.error("Erro ao carregar perguntas:", error);
            jobTitle.textContent = 'Erro ao carregar perguntas!';
        }
    }

    // Função utilitária para embaralhar array (Fisher-Yates)
    function shuffleArray(array) {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Supondo que job esteja na URL como ?job=developer
    function getJobFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('job') || 'general'; // Fallback para general
    }

    fillNextBlock(); // Inicia o carregamento
});
