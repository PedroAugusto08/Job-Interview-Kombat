// ---------------------------------------------------------------------------
// RESUME INTEGRATION — detecta topicId da URL
// ---------------------------------------------------------------------------

function getAudioQuizSubModeId() {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    return topic ? topic + '_audio' : null;
}

const game = {
    session: null,
    hp: null,
    score: 0,
    answered: false
};

game.hasMoreQuestions = function () {
    return this.session.currentIndex < this.session.questions.length - 1;
};

const audioEl = document.getElementById('aq-audio');
const playBtn = document.getElementById('aq-play-btn');
const playIcon = document.getElementById('aq-play-icon');
const progressBar = document.getElementById('aq-progress-bar');
const progressCont = document.getElementById('aq-progress-container');
const timeDisplay = document.getElementById('aq-time');
const replayBtn = document.getElementById('aq-replay-btn');
const playerWrapper = document.getElementById('aq-player-wrapper');
const noAudioNotice = document.getElementById('aq-no-audio-notice');

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateProgress() {
    if (!audioEl.duration) return;

    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    progressBar.style.width = `${pct}%`;
    timeDisplay.textContent = formatTime(audioEl.currentTime);
}

function syncPlayState() {
    if (audioEl.paused) {
        playIcon.textContent = '▶';
        playerWrapper.classList.remove('playing');
    } else {
        playIcon.textContent = '❚❚';
        playerWrapper.classList.add('playing');
    }
}

audioEl.addEventListener('timeupdate', updateProgress);
audioEl.addEventListener('play', syncPlayState);
audioEl.addEventListener('pause', syncPlayState);
audioEl.addEventListener('ended', syncPlayState);

playBtn.addEventListener('click', () => {
    if (audioEl.src && audioEl.src !== window.location.href) {
        audioEl.paused ? audioEl.play() : audioEl.pause();
    }
});

replayBtn.addEventListener('click', () => {
    if (audioEl.src && audioEl.src !== window.location.href) {
        audioEl.currentTime = 0;
        audioEl.play();
    }
});

progressCont.addEventListener('click', (e) => {
    if (!audioEl.duration) return;

    const rect = progressCont.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;

    audioEl.currentTime = ratio * audioEl.duration;
});

function loadAudio(src) {
    progressBar.style.width = '0%';
    timeDisplay.textContent = '0:00';
    playIcon.textContent = '▶';
    playerWrapper.classList.remove('playing');

    if (!src) {
        playerWrapper.style.display = 'none';
        noAudioNotice.style.display = 'block';
        return;
    }

    playerWrapper.style.display = 'flex';
    noAudioNotice.style.display = 'none';

    audioEl.src = src;
    audioEl.load();

    audioEl.onerror = () => {
        playerWrapper.style.display = 'none';
        noAudioNotice.style.display = 'block';
    };
}

function drawHP() {
    const hpContainer = document.querySelector('.hp-container');

    hpContainer.innerHTML = '';

    for (let i = 0; i < game.hp; i++) {
        const el = document.createElement('div');

        el.classList.add('hp');
        hpContainer.appendChild(el);
    }
}

function showVictoryModal() {
    const overlay = document.querySelector('.result-victory-overlay');
    const total = game.session.total;
    const score = game.score;
    const percent = Math.round((score / total) * 100);

    document.getElementById('victory-result-score').innerText = score;
    document.getElementById('victory-result-total').innerText = total;
    document.getElementById('victory-result-percent').innerText = `${percent}%`;

    overlay.classList.add('active');

    // Resume Builder: registra vitória neste sub-modo
    const subModeId = getAudioQuizSubModeId();
    if (subModeId && typeof window.markSubModeWon === 'function') {
        window.markSubModeWon(subModeId);
    }
}

function showDefeatModal() {
    const overlay = document.querySelector('.result-defeat-overlay');
    const total = game.session.total;
    const score = game.score;
    const percent = Math.round((score / total) * 100);

    document.getElementById('defeat-result-score').innerText = score;
    document.getElementById('defeat-result-total').innerText = total;
    document.getElementById('defeat-result-percent').innerText = `${percent}%`;

    overlay.classList.add('active');
}

function showAnswerModal(questionData) {
    const overlay = document.querySelector('.answer-overlay');
    const explanationEl = document.getElementById('answer-explanation');
    const correctEl = document.getElementById('answer-correct');
    const transcriptEl = document.getElementById('answer-transcript');
    const transcriptBlk = document.getElementById('transcript-block');
    const nextBtn = document.getElementById('answer-next-btn');

    correctEl.innerText = questionData.options[questionData.correctOption];
    explanationEl.innerText = questionData.explanation;

    if (questionData.transcript) {
        transcriptEl.innerText = `"${questionData.transcript}"`;
        transcriptBlk.style.display = 'block';
    } else {
        transcriptBlk.style.display = 'none';
    }

    overlay.classList.add('active');

    const newBtn = nextBtn.cloneNode(true);

    nextBtn.parentNode.replaceChild(newBtn, nextBtn);

    newBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        nextQuestion();
    }, { once: true });
}

function showPostAnswerBar(questionData) {
    const bar = document.getElementById('post-answer-bar');
    const showFeedbackBtn = document.getElementById('show-feedback-btn');
    const skipBtn = document.getElementById('skip-feedback-btn');

    bar.classList.add('active');

    // Clone to remove stale listeners
    const newShowBtn = showFeedbackBtn.cloneNode(true);
    showFeedbackBtn.parentNode.replaceChild(newShowBtn, showFeedbackBtn);
    const newSkipBtn = skipBtn.cloneNode(true);
    skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);

    newShowBtn.addEventListener('click', () => {
        bar.classList.remove('active');
        showAnswerModal(questionData);
    }, { once: true });

    newSkipBtn.addEventListener('click', () => {
        bar.classList.remove('active');
        nextQuestion();
    }, { once: true });
}

function validateAnswer(e, letter) {
    if (game.answered) return;

    game.answered = true;

    audioEl.pause();

    const question = game.session.questions[game.session.currentIndex];
    const correct = question.correctOption;

    document.getElementById('options-container').classList.add('answered');

    if (letter === correct) {
        e.target.classList.add('correct');
        game.score++;
    } else {
        e.target.classList.add('wrong');

        const correctBtn = document.querySelector(
            `#options-container .option[data-option="${correct}"]`
        );

        if (correctBtn) {
            correctBtn.classList.add('correct');
        }

        game.hp--;
        drawHP();
    }

    showPostAnswerBar(question);
}

function nextQuestion() {
    if (game.hp <= 0) {
        showDefeatModal();
        return;
    }

    if (!game.hasMoreQuestions()) {
        showVictoryModal();
        return;
    }

    game.session.currentIndex++;
    loadQuestion();
}

function loadQuestion() {
    game.answered = false;

    const { questions, currentIndex } = game.session;
    const question = questions[currentIndex];

    if (game.hp <= 0) {
        showDefeatModal();
        return;
    }

    document.getElementById('quiz-name').innerText = question.category;
    document.getElementById('question-number').innerText = currentIndex + 1;
    document.getElementById('question-text').innerText = question.question;
    document.getElementById('current-question').innerText = currentIndex + 1;
    document.getElementById('total-questions').innerText = game.session.total;

    loadAudio(question.audioSrc || null);

    const optionsContainer = document.getElementById('options-container');

    optionsContainer.innerHTML = '';
    optionsContainer.classList.remove('answered');

    // Hide post-answer bar for new question
    const bar = document.getElementById('post-answer-bar');
    if (bar) bar.classList.remove('active');

    const shuffledOptions = Object.entries(question.options)
        .sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(([letter, text]) => {
        const btn = document.createElement('button');

        btn.classList.add('option');
        btn.dataset.option = letter;
        btn.innerText = text.charAt(0).toUpperCase() + text.slice(1);

        btn.addEventListener('click', (e) => validateAnswer(e, letter));

        optionsContainer.appendChild(btn);
    });
}

async function init() {
    try {
        const res = await fetch('../db/audio_quiz_questions.json');

        if (!res.ok) {
            throw new Error(`Erro ao carregar perguntas: ${res.status}`);
        }

        const questions = await res.json();

        const shuffled = [...questions]
            .sort(() => Math.random() - 0.5);

        game.session = {
            questions: shuffled,
            total: shuffled.length,
            currentIndex: 0
        };

        game.hp = Math.max(
            1,
            Math.round(game.session.total * 0.4)
        );

        drawHP();
        loadQuestion();
    } catch (err) {
        console.error('[AudioQuiz] Falha ao inicializar:', err);
    }
}

init();