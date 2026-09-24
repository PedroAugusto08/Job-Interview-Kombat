// ---------------------------------------------------------------------------
// RESUME INTEGRATION — detecta topicId e subModeId da URL
// ---------------------------------------------------------------------------

function getQuizSubModeId() {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    const mode  = params.get('mode');
    if (!topic) return null;
    return topic + (mode === 'interview' ? '_interview' : '_quiz');
}

function pickRandom(arr, count) {
    return [...arr]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(count, arr.length));
}

function toSentenceCase(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function createSession(bank, { softSkills = 5, hardSkills = 2 } = {}) {
    const selected = [
        ...pickRandom(bank.softSkills, softSkills),
        ...pickRandom(bank.hardSkills, hardSkills)
    ].sort(() => Math.random() - 0.5); // embaralha a lista final

    return {
        questions: selected,
        total: selected.length,
        currentIndex: 0
    };
}

// ---------------------------------------------------------------------------
// ESTADO DO JOGO
// ---------------------------------------------------------------------------

const game = {
    hp: null, // calculado após createSession
    session: null, // preenchido após o fetch
    score: 0
};

game.hasQuestions = function () {
    return this.session.currentIndex + 1 <= this.session.questions.length;
}

game.showFinalResults = function () {
    alert('Parabéns! Você acertou ' + game.score + ' perguntas');
}

// ---------------------------------------------------------------------------
// FUNÇÕES DE UI
// ---------------------------------------------------------------------------

function showAnswerModal(questionData) {
    const modalOverlay = document.querySelector(".answer-overlay");
    const explanation = document.querySelector("#answer-explanation");
    const correct = document.querySelector("#answer-correct");
    const nextBtn = document.querySelector(".answer-next-btn");

    explanation.innerText = questionData.explanation;
    correct.innerText = questionData.options[questionData.correctOption];

    modalOverlay.classList.add('active');

    nextBtn.onclick = () => {
        modalOverlay.classList.remove('active');
        nextQuestion();
    }, { once: true };
}

function showPostAnswerBar(questionData) {
    const bar = document.getElementById('post-answer-bar');
    const showFeedbackBtn = document.getElementById('show-feedback-btn');
    const skipBtn = document.getElementById('skip-feedback-btn');

    bar.classList.add('active');

    // Clone buttons to remove any previous listeners
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


function nextQuestion() {
    if (game.session.currentIndex === game.session.questions.length - 1) {
        game.showFinalResults();
        return
    }

    game.session.currentIndex++;
    loadQuestion()
}

function validateAnswer(e, letter) {
    if (!game.hasQuestions()) return
    const correct = game.session.questions[game.session.currentIndex].correctOption;
    if (letter === correct) {
        e.target.classList.add("correct");
        game.score++;
    } else {
        e.target.classList.add("wrong");
        game.hp--;
        drawHP();
    }

    showPostAnswerBar(game.session.questions[game.session.currentIndex]);
}

function loadQuestion() {
    const { questions, currentIndex } = game.session;
    const question = questions[currentIndex];

    if (!question && game.hp > 0) {
        showVictoryModal();
    };

    if (game.hp == 0) {
        showDefeatModal();
    }

    document.querySelector("#quiz-name").innerText = question.category;
    document.querySelector("#question-number").innerText = currentIndex + 1;
    document.querySelector(".question-text").innerText = question.question;

    const optionsContainer = document.querySelector(".options-container");
    optionsContainer.innerHTML = "";

    // Hide post-answer bar when loading new question
    const bar = document.getElementById('post-answer-bar');
    if (bar) bar.classList.remove('active');

    const shuffledOptions = Object.entries(question.options)
        .sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(([letter, text]) => {
        const el = document.createElement("button");
        el.classList.add("option");
        el.dataset.option = letter;
        el.innerText = toSentenceCase(text);
        el.addEventListener("click", (e) => validateAnswer(e, letter));
        optionsContainer.appendChild(el);
    });

    document.querySelector("#total-questions").innerText = game.session.total;
    document.querySelector("#current-question").innerText = currentIndex + 1;
}

function drawHP() {
    const hpContainer = document.querySelector(".hp-container");
    hpContainer.innerHTML = "";

    for (let i = 0; i < game.hp; i++) {
        const el = document.createElement("div");
        el.classList.add("hp");
        hpContainer.appendChild(el);
    }
}

function showVictoryModal() {
    const modalOverlay = document.querySelector(".result-victory-overlay");

    const total = game.session.total;
    const score = game.score;
    const percent = Math.round((score / total) * 100);

    document.querySelector("#victory-result-score").innerText = score;
    document.querySelector("#victory-result-total").innerText = total;
    document.querySelector("#victory-result-percent").innerText = `${percent}%`;

    modalOverlay.classList.add('active');

    // Resume Builder: registra vitória neste sub-modo
    const subModeId = getQuizSubModeId();
    if (subModeId && typeof window.markSubModeWon === 'function') {
        window.markSubModeWon(subModeId);
    }
}


function showDefeatModal() {
    const modalOverlay = document.querySelector(".result-defeat-overlay");

    const total = game.session.total;
    const score = game.score;
    const percent = Math.round((score / total) * 100);

    document.querySelector("#defeat-result-score").innerText = score;
    document.querySelector("#defeat-result-total").innerText = total;
    document.querySelector("#defeat-result-percent").innerText = `${percent}%`;

    modalOverlay.classList.add('active');

}

// ---------------------------------------------------------------------------
// INICIALIZAÇÃO — carrega o banco de perguntas e inicia o jogo
// ---------------------------------------------------------------------------

async function init() {
    try {
        const res = await fetch("../db/trainingModeQuestions.json");

        if (!res.ok) throw new Error(`Erro ao carregar perguntas: ${res.status}`);

        const QUESTION_BANK = await res.json()

        game.session = createSession(QUESTION_BANK);
        game.hp = Math.round(game.session.total * 0.3);

        loadQuestion();
        drawHP();
    } catch (err) {
        console.error(err);
    }
}

init();