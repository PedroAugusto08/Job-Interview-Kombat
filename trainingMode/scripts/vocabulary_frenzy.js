// ---------------------------------------------------------------------------
// RESUME INTEGRATION — detecta topicId da URL
// ---------------------------------------------------------------------------

function getVocabSubModeId() {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    return topic ? topic + '_vocab' : null;
}

const descriptionGoButton = document.querySelector("#description-go")
const descriptionMenu = document.querySelector(".mode-description")
const descriptionMenuTimer = document.querySelector("#description-time")
const descriptionMenuTheme = document.querySelector("#description-theme")

const gameContainer = document.querySelector(".game-container")
const gameCards = document.querySelector(".game-cards")

const resultsContainer = document.querySelector(".result-container")

const THEMES = [{
    type: 'soft_skills',
    text: "Soft Skills"
}, {
    type: 'hard_skills',
    text: "Hard Skills"
}]

const game = {
    score: 0,
    scoreMultiplier: 10,
    theme: THEMES[Math.floor(Math.random() * THEMES.length)],
    vocabularyData: null,
    chosenVocabulary: [],
    timer: {
        default: 30,
        current: 30
    },
    chooseVocabulary: async (totalCount = 10) => {
        const response = await fetch('../db/vocabulary_frenzy.json')
        const data = await response.json()

        const groups = {}
        data.forEach(item => {
            if (!groups[item.type]) groups[item.type] = []
            groups[item.type].push(item)
        })

        const types = Object.keys(groups)
        const perTypeCount = Math.floor(totalCount / types.length)

        const selected = []
        types.forEach(type => {
            const shuffled = groups[type].sort(() => Math.random() - 0.5)
            selected.push(...shuffled.slice(0, perTypeCount))
        })

        game.vocabularyData = selected.sort(() => Math.random() - 0.5)

        return game.vocabularyData
    },

    createCards: () => {
        gameCards.innerHTML = ""
        game.vocabularyData.forEach((card, index) => {
            const gameCard = document.createElement("div")
            gameCard.classList.add("game-card")
            gameCard.textContent = card.vocabulary
            gameCard.style.animationDelay = `${index * 40}ms`
            gameCard.addEventListener("click", () => {
                gameCard.classList.toggle("selected")
            })
            gameCards.appendChild(gameCard)
        })
    },

    start: async () => {
        await game.chooseVocabulary(16)
        game.createCards()
        game.startTimer()
    },

    timerInterval: null,

    startTimer: () => {
        const timerDisplay = document.querySelector("#timer")

        game.timer.current = game.timer.default
        timerDisplay.textContent = game.timer.current + "s"

        game.timerInterval = setInterval(() => {
            game.timer.current--
            timerDisplay.textContent = game.timer.current + "s"

            if (game.timer.current <= 0) {
                clearInterval(game.timerInterval)
                game.endGame()
            }
        }, 1000)
    },

    endGame: () => {
        const cards = document.querySelectorAll(".game-card")
        cards.forEach(card => {
            card.style.pointerEvents = "none"
            card.style.opacity = "0.5"
            if (card.classList.contains("selected")) {
                game.chosenVocabulary.push(card.textContent)
            }
        })

        const themeVocabSet = new Set(
            game.vocabularyData
                .filter(item => item.type === game.theme.type)
                .map(item => item.vocabulary)
        )

        const correctWords = game.chosenVocabulary.filter(word => themeVocabSet.has(word))
        const wrongWords = game.chosenVocabulary.filter(word => !themeVocabSet.has(word))

        game.score = correctWords.length * game.scoreMultiplier
        game.score -= wrongWords.length * game.scoreMultiplier

        setTimeout(() => {
            setupResultScreen(correctWords, wrongWords)
        }, 500)
    }
}

const setupResultScreen = (correctWords, wrongWords) => {
    document.querySelector("#result-theme").textContent = game.theme.text
    document.querySelector("#result-score").textContent = game.score
    document.getElementById("result-correct-count").textContent = correctWords.length
    document.getElementById("result-wrong-count").textContent = wrongWords.length

    const missedWords = game.vocabularyData
        .filter(item => item.type === game.theme.type && !game.chosenVocabulary.includes(item.vocabulary))
        .map(item => item.vocabulary)

    document.querySelector(".result-left-words .word-list").textContent =
        missedWords.length > 0 ? missedWords.join(", ") : "None, you got all the right answers!"

    // Render picked word chips
    const picksList = document.getElementById('picks-list')
    picksList.innerHTML = ''

    if (game.chosenVocabulary.length === 0) {
        const empty = document.createElement('span')
        empty.classList.add('picks-empty')
        empty.textContent = "You didn't select any words!"
        picksList.appendChild(empty)
    } else {
        const correctSet = new Set(correctWords)
        game.chosenVocabulary.forEach(word => {
            const chip = document.createElement('span')
            chip.classList.add('pick-chip')
            chip.classList.add(correctSet.has(word) ? 'pick-correct' : 'pick-wrong')
            chip.textContent = word
            picksList.appendChild(chip)
        })
    }

    gameContainer.classList.remove("active")
    resultsContainer.classList.add("active")

    // Resume Builder: registra vitória se score positivo
    if (game.score > 0) {
        const subModeId = getVocabSubModeId();
        if (subModeId && typeof window.markSubModeWon === 'function') {
            window.markSubModeWon(subModeId);
        }
    }

    document.querySelector(".finish-button").addEventListener("click", () => {
        document.location.href = "../pages/trainingMode.html"
    })
}

const setupGameScreen = () => {
    document.querySelector("#game-theme").textContent = game.theme.text
    document.querySelector("#timer").textContent = game.timer.current + "s"

    const doneBtn = document.getElementById('done-btn')
    doneBtn.addEventListener('click', () => {
        if (game.timerInterval === null) return // já encerrado
        clearInterval(game.timerInterval)
        game.timerInterval = null
        doneBtn.disabled = true
        game.endGame()
    }, { once: true })
}

descriptionGoButton.addEventListener("click", () => {
    descriptionMenu.classList.remove("active")
    setupGameScreen()
    gameContainer.classList.add("active")

    setTimeout(() => {
        game.start()
    }, 500);
})

const setupDescriptionMenu = () => {
    descriptionMenuTimer.textContent = game.timer.default
    descriptionMenuTheme.textContent = game.theme.text

    setTimeout(() => {
        descriptionMenu.classList.add("active")
    }, 400)
}

addEventListener('load', () => {
    setupDescriptionMenu()
})