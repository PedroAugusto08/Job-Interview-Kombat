// ============== UTILITIES ==============
class URLHelper {
    static getJobFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('job') || 'general'; // Fallback para general
    }
}

class ArrayHelper {
    static shuffle(array) {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

// ============== DATA LOADER ==============
class QuestionLoader {
    static async loadQuestions(job) {
        const response = await fetch('../db/questions.json');
        if (!response.ok) throw new Error('Erro ao carregar o JSON');

        const data = await response.json();
        return {
            general: data.general?.map(q => q.question) || [],
            jobSpecific: data[job]?.map(q => q.question) || []
        };
    }
}

// ============== GAME LOGIC ==============
class QuestionSelector {
    static selectQuestions(generalQuestions, jobQuestions, maxQuestions = 10) {
        const totalAvailable = generalQuestions.length + jobQuestions.length;
        const totalQuestions = Math.min(maxQuestions, totalAvailable);
        const half = Math.floor(totalQuestions / 2);

        const selectedGeneral = ArrayHelper.shuffle(generalQuestions).slice(0, half);
        const selectedJob = ArrayHelper.shuffle(jobQuestions).slice(0, totalQuestions - half);

        return ArrayHelper.shuffle([...selectedGeneral, ...selectedJob]);
    }
}

class Game {
    selectedQuestions = [];
    job = "";
    currentQuestion = 0;
    questionInterval = null;
    visualTimer = null;

    async initialize() {
        const { general, jobSpecific } = await QuestionLoader.loadQuestions(this.job);
        
        if (!jobSpecific || jobSpecific.length === 0) {
            throw new Error('Job inválido ou sem perguntas específicas');
        }

        this.selectedQuestions = QuestionSelector.selectQuestions(general, jobSpecific);
        return this;
    }

    startQuestionsDisplay() {
        this.createVisualTimer();
        this.showCurrentQuestion();
    }

    async showCurrentQuestion() {
        const questionsContainer = document.getElementById('questions-container');
        questionsContainer.innerHTML = '';

        const p = document.createElement('p');
        p.textContent = `${this.currentQuestion + 1}. ${this.selectedQuestions[this.currentQuestion]}`;
        questionsContainer.appendChild(p);

        this.visualTimer.reset();
        this.visualTimer.start();

        // Espera o tempo da pergunta
        await new Promise(res => setTimeout(res, 10000));

        await this.showJudgingScreen();
        this.nextQuestion();
    }

    async showJudgingScreen() {
        this.visualTimer.reset();
        await JudgingScreen.show();
    }

    async nextQuestion() {
        this.currentQuestion++;
        
        if (this.currentQuestion >= this.selectedQuestions.length) {
            this.stopQuestionsDisplay();
            return;
        }

        await this.showCurrentQuestion();
    }

    stopQuestionsDisplay() {
        this.visualTimer.reset();
        this.showGameOver();
    }

    showGameOver() {
        const questionsContainer = document.getElementById('questions-container');
        questionsContainer.innerHTML = '<h2>Fim do jogo!</h2><p>Todas as perguntas foram respondidas.</p>';
    }

    createVisualTimer() {
        const container = document.createElement('div');
        container.id = 'visual-timer';
        container.className = 'timer-circle';
        document.getElementById('game-container').prepend(container);

        this.visualTimer = new VisualTimer('visual-timer', 10);
    }

    constructor(job) {
        this.job = job;
    }
}

class VisualTimer {
    constructor(containerId, duration) {
        this.container = document.getElementById(containerId);
        this.duration = duration;
        this.startTime = null;
        this.interval = null;
    }

    start() {
        this.startTime = Date.now();
        this.update();

        this.interval = setInterval(() => this.update(), 100);
    }

    update() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const percentage = (elapsed / this.duration) * 100;
        const deg = (percentage / 100) * 360;

        this.container.style.background = `conic-gradient(#a5dfff ${deg}deg, #f69ac1 0deg)`;

        if (elapsed >= this.duration) {
            clearInterval(this.interval);
        }
    }

    reset() {
        clearInterval(this.interval);
        this.container.style.background = `conic-gradient(#a5dfff 0deg, #f69ac1 0deg)`;
    }
}

class JudgingScreen {
    static async show(duration = 3000) {
        const screen = document.getElementById('judging-screen');
        screen.style.display = 'block';
        await new Promise(res => setTimeout(res, duration));
        screen.style.display = 'none';
    }
}


// ============== UI COMPONENTS ==============
class LoadingScreen {
    constructor(loadingScreenId, blockSelector) {
        this.loadingScreen = document.getElementById(loadingScreenId);
        this.blocks = document.querySelectorAll(blockSelector);
        this.currentBlock = 0;
        this.interval = 45;
    }

    initialize() {
        this.blocks.forEach(b => {
            b.classList.remove('loading-block-pink');
            b.classList.add('loading-block-blue');
            b.style.opacity = '0.25';
        });
    }

    fillNext() {
        if (this.currentBlock < this.blocks.length) {
            const block = this.blocks[this.currentBlock];
            block.classList.remove('loading-block-blue');
            block.classList.add('loading-block-pink');
            block.style.opacity = '1';

            this.currentBlock++;
            setTimeout(() => this.fillNext(), this.interval);
        } else {
            setTimeout(() => {
                this.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    this.loadingScreen.style.display = 'none';
                }, 400);
            }, 400);
        }
    }

    start() {
        this.initialize();
        this.fillNext();
    }
}

class AnticipationSequence {
    constructor(anticipationId) {
        this.element = document.getElementById(anticipationId);
    }

    show(duration = 2500) {
        this.element.classList.remove('hidden');
        return new Promise(resolve => {
            setTimeout(() => {
                this.element.style.display = 'none';
                resolve();
            }, duration);
        });
    }
}

class Countdown {
    constructor(countdownId, imageId, images) {
        this.element = document.getElementById(countdownId);
        this.image = document.getElementById(imageId);
        this.images = images;
        this.currentIndex = 0;
        this.interval = 1500;
    }

    showNext() {
        if (this.currentIndex >= this.images.length) {
            this.element.classList.add('hidden');
            return Promise.resolve();
        }

        return new Promise(resolve => {
            this.image.src = this.images[this.currentIndex];
            this.image.classList.remove('show');
            void this.image.offsetWidth; // Reinicia animação
            this.image.classList.add('show');

            this.currentIndex++;
            setTimeout(() => resolve(this.showNext()), this.interval);
        });
    }

    async start() {
        this.element.classList.remove('hidden');
        await this.showNext();
    }
}

class GameUI {
    static displayGame(job, questions) {
        const jobTitle = document.getElementById('job-title');
        const questionsContainer = document.getElementById('questions-container');
        const gameContainer = document.getElementById('game-container');

        jobTitle.textContent = `THEME: ${job.toUpperCase()}`;
        gameContainer.style.display = 'block';

        // Limpa perguntas anteriores
        questionsContainer.innerHTML = '';

        // Adiciona novas perguntas
        questions.forEach((q, i) => {
            const p = document.createElement('p');
            p.textContent = `${i + 1}. ${q}`;
            questionsContainer.appendChild(p);
        });
    }
}

// ============== MAIN GAME FLOW ==============
class GameFlow {
    static async start() {
        const job = URLHelper.getJobFromURL();

        try {
            // Configura sequência de inicialização
            const loadingScreen = new LoadingScreen('loading-screen', '.loading-block');
            const anticipation = new AnticipationSequence('anticipation-sequence');
            const countdown = new Countdown('countdown-screen', 'countdown-image', [
                '/assets/images/8-countdown 3.png',
                '/assets/images/9-countdown 2.png',
                '/assets/images/10-countdown 1.png',
                '/assets/images/ready.png'
            ]);

            // Executa fluxo
            loadingScreen.start();
            await anticipation.show();
            await countdown.start();

            // Inicia o jogo
            const game = await new Game(job).initialize();
            GameUI.displayGame(job, game.selectedQuestions);

            game.startQuestionsDisplay();
        } catch (error) {
            console.error("Erro no fluxo do jogo:", error);
            document.getElementById('job-title').textContent = 'Erro ao carregar o jogo!';
        }
    }
}

// ============== INITIALIZATION ==============
window.addEventListener('DOMContentLoaded', () => {
    GameFlow.start();
});