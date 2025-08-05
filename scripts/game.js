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
    timeLeft = 10; // Tempo por pergunta (segundos)
    timerInterval = null;
    timerElement = null;

    async initialize() {
        const { general, jobSpecific } = await QuestionLoader.loadQuestions(this.job);
        
        if (!jobSpecific || jobSpecific.length === 0) {
            throw new Error('Job inválido ou sem perguntas específicas');
        }

        this.selectedQuestions = QuestionSelector.selectQuestions(general, jobSpecific);
        return this;
    }

    startQuestionsDisplay() {
        this.createTimerElement();
        this.showCurrentQuestion();
        this.startTimer();

        this.questionInterval = setInterval(() => {
            this.nextQuestion();
        }, 10000); // 10 segundos por pergunta
    }

    createTimerElement() {
        this.timerElement = document.createElement('div');
        this.timerElement.id = 'question-timer';
        Object.assign(this.timerElement.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            fontSize: '2rem',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px 20px',
            borderRadius: '10px',
            zIndex: '1000'
        });
        document.body.appendChild(this.timerElement);
    }

    showCurrentQuestion() {
        const questionsContainer = document.getElementById('questions-container');
        questionsContainer.innerHTML = '';
        
        const p = document.createElement('p');
        p.textContent = `${this.currentQuestion + 1}. ${this.selectedQuestions[this.currentQuestion]}`;
        questionsContainer.appendChild(p);
        
        this.timeLeft = 10;
        this.updateTimerDisplay();
    }

    startTimer() {
        clearInterval(this.timerInterval); // Limpa timer anterior
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
            }
        }, 1000);
    }

    updateTimerDisplay() {
        if (!this.timerElement) return;
        
        this.timerElement.textContent = `⏱️ ${this.timeLeft}s`;
        
        if (this.timeLeft <= 3) {
            this.timerElement.style.color = '#ff5555';
            this.timerElement.style.animation = 'pulse 0.5s infinite alternate';
        } else {
            this.timerElement.style.color = 'white';
            this.timerElement.style.animation = 'none';
        }
    }

    nextQuestion() {
        clearInterval(this.timerInterval);
        this.currentQuestion++;
        
        if (this.currentQuestion >= this.selectedQuestions.length) {
            this.stopQuestionsDisplay();
            return;
        }
        
        this.showCurrentQuestion();
        this.startTimer();
    }

    stopQuestionsDisplay() {
        clearInterval(this.questionInterval);
        clearInterval(this.timerInterval);
        
        if (this.timerElement) {
            this.timerElement.remove();
        }
        
        // Lógica quando o jogo termina
        console.log('Fim das perguntas!');
        this.showGameOver();
    }

    showGameOver() {
        const questionsContainer = document.getElementById('questions-container');
        questionsContainer.innerHTML = '<h2>Fim do jogo!</h2><p>Todas as perguntas foram respondidas.</p>';
    }

    constructor(job) {
        this.job = job;
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