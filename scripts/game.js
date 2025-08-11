// ============== LOADING SCREEN ==============
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
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  startQuestionsDisplay() {
    // Inicia a exibição das perguntas
    this.currentQuestion = 0;
    this.createVisualTimer();
    if (typeof this.showCurrentQuestion === 'function') {
      this.showCurrentQuestion();
    }
  }
  async showCurrentQuestion() {
    // Esconde o placar
    const scoreboard = document.getElementById('scoreboard');
    if (scoreboard) scoreboard.style.display = 'none';

    // Mostra o cronômetro global (visual-timer) só na tela da pergunta
    const visualTimer = document.getElementById('visual-timer');
    if (visualTimer) visualTimer.style.display = '';

    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    // Mostra a pergunta
    const p = document.createElement('p');
    p.textContent = `${this.currentQuestion + 1}. ${this.selectedQuestions[this.currentQuestion]}`;
    container.appendChild(p);

    this.visualTimer.reset();
    this.visualTimer.start();
    await this.delay(10000);
    this.visualTimer.reset();

    // Esconde o visual-timer antes dos turnos
    if (visualTimer) visualTimer.style.display = 'none';

    // Mostra o placar antes do fight
    if (scoreboard) scoreboard.style.display = '';

    // Unifica FIGHT + tela de turnos (mas não esconde o FIGHT ainda)
    await this.showFightAndTurns();

    // Turno equipe 1
    await this.runTeamTurn('team1', 5);
    // Turno equipe 2
    await this.runTeamTurn('team2', 5);

    // Esconde o FIGHT só agora, antes do julgamento
    const fightOverlay = document.getElementById('fight-overlay');
    if (fightOverlay) fightOverlay.style.display = 'none';

    // Após os dois turnos, julgamento
    const vencedor = await JudgingScreen.show();
    if (vencedor) {
      this.teamScores[vencedor]++;
      this.updateScoreboard();
    }
    await this.nextQuestion();
  }

  async showFightAndTurns() {
    const container = document.getElementById('questions-container');
    // Linha dos turnos e cronômetro
    container.innerHTML = `
      <div class="turns-top-row">
        <span id="turn-team1" class="turn-label">TEAM 1'S TURN</span>
        <div class="timer-center-only">
          <div id="team-timer" class="timer-circle"><span></span></div>
        </div>
        <span id="turn-team2" class="turn-label">TEAM 2'S TURN</span>
      </div>
      <div id="fight-overlay" class="fight-overlay">
        <div class="fight-banner">
          <img src="/assets/images/game/fight.png" alt="FIGHT!" class="fight-img" />
        </div>
      </div>
    `;
  }

  showTurnsScreen() {
    const container = document.getElementById('questions-container');
    container.innerHTML = `
      <div class="turns-top-row">
        <span id="turn-team1" class="turn-label">TEAM 1'S TURN</span>
        <div class="timer-center-only">
          <div id="team-timer" class="timer-circle"><span></span></div>
        </div>
        <span id="turn-team2" class="turn-label">TEAM 2'S TURN</span>
      </div>
    `;
  }

  async runTeamTurn(team, seconds) {
    const team1Label = document.getElementById('turn-team1');
    const team2Label = document.getElementById('turn-team2');
    if (team1Label && team2Label) {
      if (team === 'team1') {
        team1Label.classList.add('active-turn-label');
        team2Label.classList.remove('active-turn-label');
        team1Label.classList.remove('inactive-turn-label');
        team2Label.classList.add('inactive-turn-label');
      } else {
        team2Label.classList.add('active-turn-label');
        team1Label.classList.remove('active-turn-label');
        team2Label.classList.remove('inactive-turn-label');
        team1Label.classList.add('inactive-turn-label');
      }
    }
    // Timer
    const timerElement = document.getElementById('team-timer');
    const timerSpan = timerElement.querySelector('span');
    let startTime = Date.now();
    return new Promise(res => {
      const isTeam1 = team === 'team1';
      timerSpan.textContent = seconds;
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(seconds - elapsed, 0);
        const percentage = (remaining / seconds) * 100;
        const deg = (percentage / 100) * 360;
        timerElement.style.background = `conic-gradient(${isTeam1 ? '#3a87ad' : '#e37ea3'} ${deg}deg, #eee 0deg)`;
        timerSpan.textContent = Math.ceil(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          res();
        }
      }, 100);
    });
  }
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
        <div class="fight-screen">
          <div class="fight-banner">
            <img src="/assets/images/game/fight.png" alt="FIGHT!" class="fight-img" />
          </div>
        </div>
      `;
      setTimeout(res, 2000);
    });
  }

  async showTeamTimer(team, seconds) {
    return new Promise(res => {
      // Destaca o placar do topo
      const team1Score = document.querySelector('.team-score.team1');
      const team2Score = document.querySelector('.team-score.team2');
      if (team1Score && team2Score) {
        if (team === 'team1') {
          team1Score.classList.add('active-turn');
          team2Score.classList.remove('active-turn');
          team1Score.classList.remove('inactive-turn');
          team2Score.classList.add('inactive-turn');
        } else {
          team2Score.classList.add('active-turn');
          team1Score.classList.remove('active-turn');
          team2Score.classList.remove('inactive-turn');
          team1Score.classList.add('inactive-turn');
        }
      }

      // Mostra apenas o timer centralizado
      const container = document.getElementById('questions-container');
      container.innerHTML = `
        <div class="timer-center-only">
          <div id="team-timer" class="timer-circle"><span>${seconds}</span></div>
        </div>
      `;

      const timerElement = document.getElementById('team-timer');
      const timerSpan = timerElement.querySelector('span');

      let startTime = Date.now();

      const isTeam1 = team === 'team1';
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(seconds - elapsed, 0);
        const percentage = (remaining / seconds) * 100;
        const deg = (percentage / 100) * 360;

        timerElement.style.background = `conic-gradient(${isTeam1 ? '#3a87ad' : '#e37ea3'} ${deg}deg, #eee 0deg)`;
        timerSpan.textContent = Math.ceil(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          // Remove destaque após o turno
          if (team1Score && team2Score) {
            team1Score.classList.remove('active-turn', 'inactive-turn');
            team2Score.classList.remove('active-turn', 'inactive-turn');
          }
          res();
        }
      }, 100);
    });
  }



  async nextQuestion() {
    this.currentQuestion++;
    if (this.currentQuestion >= this.selectedQuestions.length) {
      this.stopQuestionsDisplay();
      return;
    }
    // Chama o método showCurrentQuestion corretamente
    if (typeof this.showCurrentQuestion === 'function') {
      await this.showCurrentQuestion();
    }
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
        '/assets/images/game/8-countdown 3.png',
        '/assets/images/game/9-countdown 2.png',
        '/assets/images/game/10-countdown 1.png',
        '/assets/images/game/ready.png'
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
