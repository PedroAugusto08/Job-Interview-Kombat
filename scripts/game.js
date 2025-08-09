// ============== UTILITIES ==============
class URLHelper {
  static getJobFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('job') || 'general';
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
    const percentage = Math.min((elapsed / this.duration) * 100, 100);
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
  static show() {
    return new Promise(resolve => {
      const overlay = document.getElementById("judgmentOverlay");
      const screen = overlay.querySelector(".judgment-screen");
      const resultScreen = document.getElementById("resultScreen");
      const winnerText = document.getElementById("winnerText");
      const voteTeam1Btn = document.getElementById("voteTeam1");
      const voteTeam2Btn = document.getElementById("voteTeam2");
      const continueBtn = document.getElementById("continueBtn");

      let votedTeam = null;

      // Reset UI
      overlay.classList.remove("hidden");
      screen.classList.remove("hidden");
      resultScreen.classList.add("hidden");
      winnerText.textContent = '';
      votedTeam = null;

      // Ativar botões de voto
      voteTeam1Btn.disabled = false;
      voteTeam2Btn.disabled = false;
      continueBtn.disabled = true;

      function onVote(team) {
        votedTeam = team;
        voteTeam1Btn.disabled = true;
        voteTeam2Btn.disabled = true;

        screen.classList.add("hidden");
        resultScreen.classList.remove("hidden");

        winnerText.textContent = `${team.toUpperCase()} GETS THE POINT!`;
        continueBtn.disabled = false;
      }

      voteTeam1Btn.onclick = () => onVote('team1');
      voteTeam2Btn.onclick = () => onVote('team2');

      continueBtn.onclick = () => {
        overlay.classList.add("hidden");
        resolve(votedTeam);
      };
    });
  }
}

class Game {
  constructor(job) {
    this.job = job;
    this.selectedQuestions = [];
    this.currentQuestion = 0;
    this.visualTimer = null;

    this.teamScores = { team1: 0, team2: 0 };
    this.maxPoints = 10; // para escala da barra de pontos
  }

  async initialize() {
    const { general, jobSpecific } = await QuestionLoader.loadQuestions(this.job);

    if (!jobSpecific || jobSpecific.length === 0) {
      throw new Error('Job inválido ou sem perguntas específicas');
    }

    this.selectedQuestions = QuestionSelector.selectQuestions(general, jobSpecific);

    return this;
  }

  createVisualTimer() {
    this.visualTimer = new VisualTimer('visual-timer', 10);
  }

  updateScoreboard() {
    document.getElementById('team1points').textContent = this.teamScores.team1;
    document.getElementById('team2points').textContent = this.teamScores.team2;

    const t1Percent = Math.min((this.teamScores.team1 / this.maxPoints) * 100, 100);
    const t2Percent = Math.min((this.teamScores.team2 / this.maxPoints) * 100, 100);

    document.getElementById('team1bar').style.width = `${t1Percent}%`;
    document.getElementById('team2bar').style.width = `${t2Percent}%`;
  }

  async showFightPrelude(team) {
    return new Promise(res => {
      const container = document.getElementById('questions-container');
      container.innerHTML = `
        <div class="fight-screen ${team}">
          <h1>FIGHT!</h1>
        </div>
      `;
      setTimeout(res, 2000);
    });
  }

  async showTeamTimer(team, seconds) {
        return new Promise(res => {
            const container = document.getElementById('questions-container');
            container.innerHTML = `
                <div class="team-timer ${team}">
                    <h2>${team.toUpperCase()}'S TURN!</h2>
                    <div id="team-timer" class="timer-circle"><span>${seconds}</span></div>
                </div>
            `;

            const timerElement = document.getElementById('team-timer');
            const timerSpan = timerElement.querySelector('span');

            let startTime = Date.now();
            let timeLeft = seconds;

            // Atualiza o fundo conic-gradient para animar o timer
            const interval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                const remaining = Math.max(seconds - elapsed, 0);
                const percentage = (remaining / seconds) * 100;
                const deg = (percentage / 100) * 360;

                timerElement.style.background = `conic-gradient(${team === 'team1' ? '#3a87ad' : '#e37ea3'} ${deg}deg, #eee 0deg)`;
                timerSpan.textContent = Math.ceil(remaining);

                if (remaining <= 0) {
                    clearInterval(interval);
                    res();
                }
            }, 100);
        });
    }


  async showCurrentQuestion() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    const p = document.createElement('p');
    p.textContent = `${this.currentQuestion + 1}. ${this.selectedQuestions[this.currentQuestion]}`;
    container.appendChild(p);

    this.visualTimer.reset();
    this.visualTimer.start();

    // Tempo para ler a pergunta
    await this.delay(10000);
    this.visualTimer.reset();

    // Prelúdio de luta para equipe 1
    await this.showFightPrelude("team1");

    // Equipe 1 pensa
    await this.showTeamTimer("team1", 5);

    // Prelúdio de luta para equipe 2
    await this.showFightPrelude("team2");

    // Equipe 2 pensa
    await this.showTeamTimer("team2", 5);

    // Votação dos juízes
    const vencedor = await JudgingScreen.show();

    if (vencedor) {
      this.teamScores[vencedor]++;
      this.updateScoreboard();
    }

    await this.nextQuestion();
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
    const container = document.getElementById('questions-container');
    let winnerText = '';
    if (this.teamScores.team1 > this.teamScores.team2) {
      winnerText = "TEAM 1 WINS!";
    } else if (this.teamScores.team2 > this.teamScores.team1) {
      winnerText = "TEAM 2 WINS!";
    } else {
      winnerText = "IT'S A DRAW!";
    }
    container.innerHTML = `<h2>Fim do jogo!</h2><p>${winnerText}</p>`;
  }

  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  startQuestionsDisplay() {
    this.createVisualTimer();
    this.updateScoreboard();
    this.showCurrentQuestion();
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
        this.element.classList.add('hidden');
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
      void this.image.offsetWidth;
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

// ============== MAIN GAME FLOW ==============
class GameFlow {
  static async start() {
    const job = URLHelper.getJobFromURL();

    try {
      const loadingScreen = new LoadingScreen('loading-screen', '.loading-block');
      const anticipation = new AnticipationSequence('anticipation-sequence');
      const countdown = new Countdown('countdown-screen', 'countdown-image', [
        '/assets/images/8-countdown 3.png',
        '/assets/images/9-countdown 2.png',
        '/assets/images/10-countdown 1.png',
        '/assets/images/ready.png'
      ]);

      loadingScreen.start();
      await anticipation.show();
      await countdown.start();

      const game = await new Game(job).initialize();
      GameUI.displayGame(job, game.selectedQuestions);

      game.startQuestionsDisplay();
    } catch (error) {
      console.error("Erro no fluxo do jogo:", error);
      document.getElementById('job-title').textContent = 'Erro ao carregar o jogo!';
    }
  }
}

// ============== UI HELPER ==============
class GameUI {
  static displayGame(job, questions) {
    document.getElementById('job-title').textContent = `THEME: ${job.toUpperCase()}`;
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('questions-container').innerHTML = '';

    // Você pode mostrar a lista das perguntas aqui se quiser (opcional)
  }
}

// ============== INIT ==============
window.addEventListener('DOMContentLoaded', () => {
  GameFlow.start();
});
