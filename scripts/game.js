import { global } from "./global.js";
// Fade-in suave ao entrar no game.html
window.addEventListener('DOMContentLoaded', function() {
  console.log(global.options);
  const fade = document.getElementById('game-fade-in');
  if (fade) {
    setTimeout(() => {
      fade.classList.add('hide');
      setTimeout(() => fade.remove(), 800);
    }, 60); // delay para garantir efeito
  }
});


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
    this.remainingTime = duration;
    this.interval = null;
    this.isPaused = false;
    this.pauseStartTime = null;
    this.lastDeg = 0; 
  }

  start() {
    this.startTime = Date.now();
    this.remainingTime = this.duration;
    this.isPaused = false;
    this.lastDeg = 0; // Resetar o estado visual
    this.update();
    this.interval = setInterval(() => this.update(), 100);
  }

  update() {
    if (this.isPaused) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    const percentage = Math.min((elapsed / this.duration) * 100, 100);
    const deg = (percentage / 100) * 360;
    this.lastDeg = deg; // Armazenar o estado visual atual

    this.container.style.background = `conic-gradient(#a5dfff ${deg}deg, #f69ac1 0deg)`;
    this.remainingTime = this.duration - elapsed;

    if (elapsed >= this.duration) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  pause() {
    if (this.isPaused || !this.interval) return;
    
    this.isPaused = true;
    this.pauseStartTime = Date.now();
    this.remainingTime = this.duration - ((this.pauseStartTime - this.startTime) / 1000);
    clearInterval(this.interval);
    this.interval = null;
  }

  resume() {
    if (!this.isPaused || this.remainingTime <= 0) return;
    
    this.isPaused = false;
    // Restaurar o estado visual imediatamente
    this.container.style.background = `conic-gradient(#a5dfff ${this.lastDeg}deg, #f69ac1 0deg)`;
    
    this.startTime = Date.now() - ((this.duration - this.remainingTime) * 1000);
    this.interval = setInterval(() => this.update(), 100);
  }

  reset() {
    clearInterval(this.interval);
    this.interval = null;
    this.isPaused = false;
    this.lastDeg = 0;
    this.container.style.background = `conic-gradient(#a5dfff 0deg, #f69ac1 0deg)`;
  }
}
class JudgingScreen {
  static show(teamLives = {team1: 5, team2: 5}, gameInstance = null) {
    return new Promise(resolve => {
      // Remove overlay antigo se existir
      const old = document.getElementById('judging-time-overlay');
      if (old) old.remove();

      // Cria overlay
      const overlay = document.createElement('div');
      overlay.id = 'judging-time-overlay';
      overlay.className = 'judging-time-overlay';
      overlay.style.opacity = '0';

      // Tempo máximo de julgamento (em segundos)
      const judgeTime = global.options.judge;

      // Estrutura do conteúdo central
      overlay.innerHTML = `
        <div class="judging-content diagonal-layout">
          <div class="judging-team judging-team1 diagonal-team1">
            <div class="judging-banner team1">
              <img src="../assets/images/game/team1.png" alt="Team 1" class="judging-banner-img team1" />
            </div>
            <div class="judging-life-bar-wrapper team1">
              <img src="../assets/images/game/life_bar_rosa.png" alt="Coração Rosa" class="judging-life-heart" />
              <div class="judging-life-bar team1"><div id="judging-life-team1" class="judging-life-bar-fill team1"></div></div>
            </div>
          </div>
          <div class="judging-vs diagonal-vs">VS</div>
          <div class="judging-team judging-team2 diagonal-team2">
            <div class="judging-banner team2">
              <img src="../assets/images/game/team2.png" alt="Team 2" class="judging-banner-img team2" />
            </div>
            <div class="judging-life-bar-wrapper team2">
              <div class="judging-life-bar team2"><div id="judging-life-team2" class="judging-life-bar-fill team2"></div></div>
              <img src="../assets/images/game/life_bar_azul.png" alt="Coração Azul" class="judging-life-heart" />
            </div>
          </div>
          <div class="judging-strike-row diagonal-strike-row">
            <button class="judging-strike-btn team1" id="voteTeam1">STRIKE!</button>
            <div class="judging-timer" id="judging-timer">${judgeTime}</div>
            <button class="judging-strike-btn team2" id="voteTeam2">STRIKE!</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Fade-in
      setTimeout(() => { overlay.style.opacity = '1'; }, 10);

      // Atualização em tempo real das barras de vida
      let rafId;
      function updateJudgingLifeBars() {
        if (gameInstance && gameInstance.teamLives) {
          const l1 = document.getElementById('judging-life-team1');
          const l2 = document.getElementById('judging-life-team2');
          if (l1) l1.style.width = `${(gameInstance.teamLives.team1 / gameInstance.maxLives) * 100}%`;
          if (l2) l2.style.width = `${(gameInstance.teamLives.team2 / gameInstance.maxLives) * 100}%`;
        }
        rafId = requestAnimationFrame(updateJudgingLifeBars);
      }
      if (gameInstance) updateJudgingLifeBars();

      // Votação
      let votedTeam = null;
      const voteTeam1Btn = overlay.querySelector('#voteTeam1');
      const voteTeam2Btn = overlay.querySelector('#voteTeam2');
      const timerDisplay = overlay.querySelector('#judging-timer');

      function onVote(team) {
        if (votedTeam) return; // Evita votos duplos
        votedTeam = team;
        voteTeam1Btn.disabled = true;
        voteTeam2Btn.disabled = true;
        clearInterval(timerId);

        // Feedback visual
        if (team === 'team1') {
          voteTeam2Btn.classList.add('inactive');
        } else {
          voteTeam1Btn.classList.add('inactive');
        }
        if (rafId) cancelAnimationFrame(rafId);

        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            overlay.remove();
            resolve(votedTeam);
          }, 500);
        }, 1000);
      }

      voteTeam1Btn.onclick = () => onVote('team1');
      voteTeam2Btn.onclick = () => onVote('team2');

      // Timer de contagem regressiva
      let remaining = judgeTime;
      const timerId = setInterval(() => {
        remaining--;
        if (timerDisplay) timerDisplay.textContent = remaining;
        if (remaining <= 0) {
          clearInterval(timerId);
          // Se ninguém votou, naoo acontece nada
          if (!votedTeam) {
            //  esquema pra votar em um time aleatorio. Acho que não faz sentido, mas pode ser util no futuro. Vou deixar só comentado ent.
            //const randomTeam = Math.random() < 0.5 ? 'team1' : 'team2'; 
            voteTeam2Btn.classList.add('inactive');
            voteTeam1Btn.classList.add('inactive');
            if (rafId) cancelAnimationFrame(rafId);
            setTimeout(() => {
              overlay.style.opacity = '0';
              setTimeout(() => {
                overlay.remove();
                resolve(votedTeam);
              }, 500);
            }, 1000);


          }
        }
      }, 1000);
    });
  }
}


class Game {
  async showJudgesWillDecide() {
    return new Promise(resolve => {
      const container = document.getElementById('questions-container');
      const prevDisplay = container.style.display;
      // Esconde tudo
      container.style.display = 'none';
      // Cria elemento para centralizar o PNG
      const judgesDiv = document.createElement('div');
      judgesDiv.id = 'judges-will-decide-overlay';
      judgesDiv.className = 'judges-will-decide-overlay';
      // Imagem central
      const img = document.createElement('img');
      img.src = '../assets/images/game/judges_will_decide.png';
      img.alt = 'Judges Will Decide';
      img.className = 'judges-will-decide-img';
      judgesDiv.appendChild(img);
      document.body.appendChild(judgesDiv);
      // Fade-in
      setTimeout(() => {
        judgesDiv.style.opacity = '1';
        // Após 1.5s, fade-out e remove
        setTimeout(() => {
          judgesDiv.style.opacity = '0';
          setTimeout(() => {
            judgesDiv.remove();
            // Restaura conteúdo
            container.style.display = prevDisplay;
            resolve();
          }, 500);
        }, 1500);
      }, 10);
    });
  }
  stopQuestionsDisplay() {
    // Lógica para finalizar a exibiçao das perguntas pode ser adicionada aqui
  }
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
  if (!container) return;
  container.innerHTML = '';

  // Mostra a pergunta
  const p = document.createElement('p');
  p.textContent = `${this.currentQuestion + 1}. ${this.selectedQuestions[this.currentQuestion]}`;
  container.appendChild(p);

    this.visualTimer.reset();
    this.visualTimer.start();
    await this.delay(global.options.think * 1000); // Espera o tempo de pensar
    this.visualTimer.reset();

    // Esconde o visual-timer antes dos turnos
    if (visualTimer) visualTimer.style.display = 'none';

    // Mostra o placar antes do fight
    if (scoreboard) scoreboard.style.display = '';

    // Agora sim, inicia os turnos
    await this.showFightAndTurns();
    await this.runTeamTurn('team1', global.options.round);
    await this.runTeamTurn('team2', global.options.round);

    // Esconde o FIGHT antes do julgamento
    const fightOverlay = document.getElementById('fight-overlay');
    if (fightOverlay) fightOverlay.style.display = 'none';

    // Esconde o FIGHT e a linha dos turnos antes do julgamento
    const turnsRow = document.querySelector('.turns-top-row');
    if (turnsRow) turnsRow.style.display = 'none';
    if (fightOverlay) fightOverlay.style.display = 'none';

    // Mostra tela "judges will decide" antes da votação
    await this.showJudgesWillDecide();

    // Garante que a linha dos turnos continue escondida antes de avançar
    const turnsRow2 = document.querySelector('.turns-top-row');
    if (turnsRow2) turnsRow2.style.display = 'none';

    // Após a transição, julgamento
    const perdedor = await JudgingScreen.show(this.teamLives, this);
    if (perdedor) {
      // O time clicado é o que PERDE vida
      if (this.teamLives[perdedor] > 0) {
        this.teamLives[perdedor]--;
      }
      // O outro time ganha ponto
      const vencedor = perdedor === 'team1' ? 'team2' : 'team1';
      this.teamScores[vencedor]++;
      this.updateLifeBars();
      this.updateScoreboard();
    }

    // Avança para a próxima pergunta
    await this.nextQuestion();
  }

  async showFightAndTurns() {
    const container = document.getElementById('questions-container');
    // Linha dos turnos e cronômetro
    container.innerHTML = `
      <div class="turns-top-row">
        <div class="turn-block" data-team="team1">
          <span id="turn-team1" class="turn-label">TEAM 1'S TURN!</span>
          <div class="life-bar-wrapper team1">
            <img src="../assets/images/game/life_bar_rosa.png" alt="Coração Rosa" class="life-heart" />
            <div class="life-bar team1"><div id="life-team1" class="life-bar-fill team1"></div></div>
          </div>
        </div>
        <div class="timer-center-only">
          <div id="team-timer" class="timer-circle"><span></span></div>
        </div>
        <div class="turn-block" data-team="team2">
          <span id="turn-team2" class="turn-label">TEAM 2'S TURN!</span>
          <div class="life-bar-wrapper team2">
            <div class="life-bar team2"><div id="life-team2" class="life-bar-fill team2"></div></div>
            <img src="../assets/images/game/life_bar_azul.png" alt="Coração Azul" class="life-heart" />
          </div>
        </div>
      </div>
      <div id="fight-overlay" class="fight-overlay">
        <div class="fight-banner">
          <img src="../assets/images/game/fight.png" alt="FIGHT!" class="fight-img" />
        </div>
      </div>
    `;
    this.updateLifeBars();
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
  const team1BarWrap = document.querySelector('.life-bar-wrapper.team1');
  const team2BarWrap = document.querySelector('.life-bar-wrapper.team2');

  if (team1Label && team2Label) {
    if (team === 'team1') {
      team1Label.classList.add('active-turn-label');
      team2Label.classList.remove('active-turn-label');
      team1Label.classList.remove('inactive-turn-label');
      team2Label.classList.add('inactive-turn-label');
      if (team1BarWrap) {
        team1BarWrap.classList.remove('inactive');
        const bar = team1BarWrap.querySelector('.life-bar');
        const heart = team1BarWrap.querySelector('.life-heart');
        if (bar) bar.classList.remove('inactive');
        if (heart) heart.classList.remove('inactive');
      }
      if (team2BarWrap) {
        team2BarWrap.classList.add('inactive');
        const bar = team2BarWrap.querySelector('.life-bar');
        const heart = team2BarWrap.querySelector('.life-heart');
        if (bar) bar.classList.add('inactive');
        if (heart) heart.classList.add('inactive');
      }
    } else {
      team2Label.classList.add('active-turn-label');
      team1Label.classList.remove('active-turn-label');
      team2Label.classList.remove('inactive-turn-label');
      team1Label.classList.add('inactive-turn-label');
      if (team2BarWrap) {
        team2BarWrap.classList.remove('inactive');
        const bar = team2BarWrap.querySelector('.life-bar');
        const heart = team2BarWrap.querySelector('.life-heart');
        if (bar) bar.classList.remove('inactive');
        if (heart) heart.classList.remove('inactive');
      }
      if (team1BarWrap) {
        team1BarWrap.classList.add('inactive');
        const bar = team1BarWrap.querySelector('.life-bar');
        const heart = team1BarWrap.querySelector('.life-heart');
        if (bar) bar.classList.add('inactive');
        if (heart) heart.classList.add('inactive');
      }
    }
  }
  
  // Timer
  const timerElement = document.getElementById('team-timer');
  const timerSpan = timerElement.querySelector('span');
  let startTime = Date.now();
  let remaining = seconds;
  
  return new Promise(resolve => {
    const isTeam1 = team === 'team1';
    
    const updateTimer = () => {
      if (this.pauseSystem.isPaused) return;
      
      const elapsed = (Date.now() - startTime) / 1000;
      remaining = Math.max(seconds - elapsed, 0);
      const percentage = (remaining / seconds) * 100;
      const deg = (percentage / 100) * 360;

      timerElement.style.background = `conic-gradient(${isTeam1 ? '#3a87ad' : '#e37ea3'} ${deg}deg, #eee 0deg)`;
      timerSpan.textContent = Math.ceil(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        resolve();
      }
    };
    
    // Iniciar o timer
    let intervalId = setInterval(updateTimer, 100);
    updateTimer();
    
    // Listener para pausar/resumir
    const pauseHandler = (e) => {
      if (e.detail.paused) {
        clearInterval(intervalId);
      } else {
        // Ajustar o tempo inicial para compensar o pause
        startTime += (Date.now() - this.pauseSystem.pauseTime);
        intervalId = setInterval(updateTimer, 100);
        updateTimer();
      }
    };
    
    document.addEventListener('pauseStateChanged', pauseHandler);
    
    // Limpar quando terminar
    setTimeout(() => {
      clearInterval(intervalId);
      document.removeEventListener('pauseStateChanged', pauseHandler);
      resolve();
    }, seconds * 1000);
  });
}
    constructor(job) {
    this.job = job;
    this.selectedQuestions = [];
    this.currentQuestion = 0;
    this.visualTimer = null;
    this.teamScores = { team1: 0, team2: 0 };
    this.maxPoints = 10;
    this.maxLives = 5;
    this.teamLives = { team1: this.maxLives, team2: this.maxLives };
    this.isGameOver = false;
    this.gameOverHandler = new GameOverHandler(this);
    this.pauseSystem = new PauseSystem(this);

  }

  async initialize() {
    const { general, jobSpecific } = await QuestionLoader.loadQuestions(this.job);

    if (!jobSpecific || jobSpecific.length === 0) {
      throw new Error('Job inválido ou sem perguntas específicas');
    }

    this.selectedQuestions = QuestionSelector.selectQuestions(general, jobSpecific);

    this.gameOverHandler.startMonitoring();

    return this;
  }
  
  createVisualTimer() {
    this.visualTimer = new VisualTimer('visual-timer', global.options.think);
  }

  updateScoreboard() {
    const team1points = document.getElementById('team1points');
    const team2points = document.getElementById('team2points');
    const team1bar = document.getElementById('team1bar');
    const team2bar = document.getElementById('team2bar');

    if (team1points) team1points.textContent = this.teamScores.team1;
    if (team2points) team2points.textContent = this.teamScores.team2;

    const t1Percent = Math.min((this.teamScores.team1 / this.maxPoints) * 100, 100);
    const t2Percent = Math.min((this.teamScores.team2 / this.maxPoints) * 100, 100);

    if (team1bar) team1bar.style.width = `${t1Percent}%`;
    if (team2bar) team2bar.style.width = `${t2Percent}%`;
  }

  updateLifeBars() {
    const l1 = document.getElementById('life-team1');
    const l2 = document.getElementById('life-team2');
    if (l1) l1.style.width = `${(this.teamLives.team1 / this.maxLives) * 100}%`;
    if (l2) l2.style.width = `${(this.teamLives.team2 / this.maxLives) * 100}%`;
  }

  async showFightPrelude(team) {
    return new Promise(res => {
      const container = document.getElementById('questions-container');
      container.innerHTML = `
        <div class="fight-screen">
          <div class="fight-banner">
            <img src="../assets/images/game/fight.png" alt="FIGHT!" class="fight-img" />
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
    if (this.isGameOver) return;

    // Só chama showCurrentQuestion se ainda houver perguntas
    if (this.currentQuestion < this.selectedQuestions.length) {
      await this.showCurrentQuestion();
    }
    // Se acabou, pode exibir tela de fim de jogo aqui se quiser
  }

}


// Overlay dinâmico unificado para antecipação e contagem
class GameOverlay {
  constructor() {
    this.overlay = document.getElementById('game-overlay');
    this.content = document.getElementById('overlay-content');
  }

  showBackground() {
    if (!this.overlay) return;
    this.overlay.classList.remove('hidden');
  }

  hide() {
    if (!this.overlay) return;
    this.overlay.classList.add('hidden');
    if (this.content) this.content.innerHTML = '';
  }

  async showAnticipation(duration = 1800) {
    if (!this.overlay || !this.content) return;
    this.content.innerHTML = '';
    const img = document.createElement('img');
  img.src = 'assets/images/game/antecipation.png';
    img.alt = 'Antecipação';
    img.className = 'anticipation-img';
    this.content.appendChild(img);
    this.showBackground();
    void img.offsetWidth;
    img.classList.add('show');
  // Faz a animação durar o tempo total do overlay
  img.style.animationDuration = (duration / 1000) + 's';
  img.style.setProperty('--anticipation-in', (duration / 1000) + 's');
  img.style.setProperty('--anticipation-exit', (duration / 1000) + 's');
    // Remove a imagem só após o tempo total
    await new Promise(res => setTimeout(res, duration));
    this.hide();
  }

  async showCountdown(images, interval = 1100) {
    if (!this.overlay || !this.content) return;
    this.content.innerHTML = '';
    const numberDiv = document.createElement('div');
    numberDiv.className = 'countdown-number';
    this.content.appendChild(numberDiv);
    this.showBackground();
    for (let i = 0; i < images.length; i++) {
      numberDiv.innerHTML = '';
      const img = document.createElement('img');
      img.src = images[i];
      img.alt = `Contagem ${images.length - i}`;
      numberDiv.appendChild(img);
      void img.offsetWidth;
      img.classList.add('show');
      await new Promise(res => setTimeout(res, interval));
    }
    this.hide();
  }
}

class Countdown {
  constructor(images, interval = 1100) {
    this.overlay = document.getElementById('countdown-overlay');
    this.numberContainer = this.overlay.querySelector('.countdown-number');
    this.images = images;
    this.currentIndex = 0;
    this.interval = interval;
  }

  showNext() {
    // Remove imagem anterior
    this.numberContainer.innerHTML = '';
    if (this.currentIndex >= this.images.length) {
      this.overlay.classList.add('hidden');
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const img = document.createElement('img');
      img.src = this.images[this.currentIndex];
      img.alt = `Contagem ${this.images.length - this.currentIndex}`;
      img.className = '';
      this.numberContainer.appendChild(img);

      // Força reflow para garantir animação
      void img.offsetWidth;
      img.classList.add('show');

      this.currentIndex++;
      setTimeout(() => resolve(this.showNext()), this.interval);
    });
  }

  async start() {
    this.currentIndex = 0;
    this.overlay.classList.remove('hidden');
    await this.showNext();
    this.numberContainer.innerHTML = '';
  }
}

// ============= MUSIC SYSTEM ==============

export class MusicManager {
  constructor() {
    this.currentLoop = null;
  }

  async play(menu = false) {
    await Tone.start();
    Tone.Transport.stop();
    Tone.Transport.cancel();

    if (this.currentLoop) {
      this.currentLoop.stop();
    }

    if (menu) {
      this.playMenuMusic();
    } else {
      this.playGameMusic();
    }

    Tone.Transport.start();
  }

  playMenuMusic() {
    const synth = new Tone.Synth().toDestination();
    const notes = ["C4", "E4", "G4", "B4"];
    let index = 0;

    this.currentLoop = new Tone.Loop((time) => {
      synth.triggerAttackRelease(notes[index % notes.length], "8n", time);
      index++;
    }, "0.5s");

    this.currentLoop.start(0);
  }

  playGameMusic() {
    const bass = new Tone.MonoSynth({
      oscillator: { type: "square" },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1 }
    }).toDestination();

    const synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.8 }
    }).toDestination();

    const scale = ["C4", "D4", "E4", "G4", "A4"];

    this.currentLoop = new Tone.Loop((time) => {
      const note = scale[Math.floor(Math.random() * scale.length)];
      synth.triggerAttackRelease(note, "8n", time);

      if (Math.random() > 0.7) {
        bass.triggerAttackRelease("C2", "2n", time);
      }
    }, "4n");

    this.currentLoop.start(0);
  }

  stop() {
    if (this.currentLoop) {
      this.currentLoop.stop();
      this.currentLoop = null;
    }
    Tone.Transport.stop();
  }
}


// ============== MAIN GAME FLOW ==============
class GameFlow {
  static async start() {
    const job = URLHelper.getJobFromURL();
    console.log(`Iniciando jogo para o trabalho: ${job}`);

    try {
      const music = new MusicManager();

      const loadingScreen = new LoadingScreen('loading-screen', '.loading-block');
      const overlay = new GameOverlay();
      const countdownImgs = [
  'assets/images/game/c3.png',
  'assets/images/game/c2.png',
  'assets/images/game/c1.png',
  'assets/images/game/ready.png'
      ];

      loadingScreen.start();
      await overlay.showAnticipation(4000);

      // 🎵 Música do jogo só começa se o som estiver ativado no menu, ou sempre se não houver radio (ex: navegação direta)
      let playMusic = true;
      const soundOnRadio = document.getElementById('sound-on');
      if (soundOnRadio) {
        playMusic = soundOnRadio.checked;
      }
      if (playMusic) {
        music.play(false);
      }

      await overlay.showCountdown(countdownImgs);

      const game = await new Game(job).initialize();
      if (!game.selectedQuestions || game.selectedQuestions.length === 0) {
        document.getElementById('job-title').textContent = 'Nenhuma pergunta disponível para este tema!';
        return;
      }
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
  const jobTitle = document.getElementById('job-title');
  if (jobTitle) jobTitle.textContent = `THEME: ${job.toUpperCase()}`;
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) gameContainer.style.display = 'block';
  const questionsContainer = document.getElementById('questions-container');
  if (questionsContainer) questionsContainer.innerHTML = '';

    // Você pode mostrar a lista das perguntas aqui se quiser (opcional)
  }
}

// ============== INIT ==============
window.addEventListener('DOMContentLoaded', () => {
  GameFlow.start();
});

// ============== GAME OVER ==============
class GameOverHandler {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.maxLives = gameInstance.maxLives || 5;
    this.checkInterval = null;
    this.victoryScreen = null;
    this.preludeScreen = null;
    this.currentPreludeIndex = 0;
  }

  startMonitoring() {
    // Verifica a cada 1 milesimo se algum time perdeu todas as vidas ou o numero de rounds ultrapassou o definido
    this.checkInterval = setInterval(() => this.checkGameOver(), 100);
  }

  checkGameOver() {
    const currentRound = this.game.currentQuestion;
    const maxRounds = global.options.rounds; // Obtém o máximo de rounds das opções

    if (this.game.teamLives.team2 <= 0) {
      this.handleGameOver('team1');
    } else if (this.game.teamLives.team1 <= 0) {
      this.handleGameOver('team2');
    }
    // Verifica se o número máximo de rounds foi atingido
    else if (currentRound >= maxRounds) {
      // Determina o vencedor com base nas vidas restantes
      if (this.game.teamLives.team1 > this.game.teamLives.team2) {
        this.handleGameOver('team1');
      } else if (this.game.teamLives.team2 > this.game.teamLives.team1) {
        this.handleGameOver('team2');
      } else {
        // Empate - ambos têm a mesma quantidade de vidas
        this.handleGameOver('draw');
      }
    }
    // Verifica se é o último round e as vidas estão empatadas
    else if (currentRound === maxRounds && this.game.teamLives.team1 === this.game.teamLives.team2) {
      this.handleGameOver('draw');
    }
  }

  async handleGameOver(winningTeam) {
    // Para todas as animações e timers
    clearInterval(this.checkInterval);
    if (this.game.visualTimer) {
      this.game.visualTimer.reset();
    }
    
    // Cria um overlay preto para garantir que não haja cortes
    this.createBlackOverlay();
    
    // Mostra as telas prelude primeiro com fade-in
    await this.showPreludeScreens();
    
    // Depois mostra a tela de vitória com fade-in
    await this.showVictoryScreen(winningTeam);
    
    //this.pauseSystem.pause();

    // Redireciona após um delay
   // window.location.href = `victory.html?winner=${winningTeam}`;
  }

  createBlackOverlay() {
    // Cria uma camada preta que permanecerá durante todas as transições
    this.blackOverlay = document.createElement('div');
    this.blackOverlay.className = 'black-transition-overlay';
    this.blackOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: black;
      z-index: 99999990;
      opacity: 1;
      pointer-events: none;
    `;
    document.body.appendChild(this.blackOverlay);
  }

  removeBlackOverlay() {
    if (this.blackOverlay && this.blackOverlay.parentNode) {
      this.blackOverlay.parentNode.removeChild(this.blackOverlay);
      this.blackOverlay = null;
    }
  }

  async showPreludeScreens() {
    return new Promise(async (resolve) => {
      const preludes = [
        '../assets/images/winner/prelude-1.png',
        '../assets/images/winner/prelude-2.png'
      ];
      
      for (let i = 0; i < preludes.length; i++) {
        await this.showPreludeScreen(preludes[i], 6000);
      }
      
      resolve();
    });
  }

  async showPreludeScreen(imageSrc, duration) {
    return new Promise((resolve) => {
      // Cria a tela prelude
      this.preludeScreen = document.createElement('div');
      this.preludeScreen.className = 'prelude-screen';
      this.preludeScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: black;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999999;
        opacity: 0;
        transition: opacity 1.5s ease-in-out;
      `;
      
      // Cria a imagem prelude
      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = 'Prelude';
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      `;
      
      this.preludeScreen.appendChild(img);
      document.body.appendChild(this.preludeScreen);
      
      // Fade-in
      setTimeout(() => {
        this.preludeScreen.style.opacity = '1';
      }, 10);
      
      // Aguarda o tempo especificado, faz fade-out e remove a tela
      setTimeout(() => {
        this.preludeScreen.style.opacity = '0';
        
        // Aguarda a transição de fade-out terminar antes de remover
        setTimeout(() => {
          if (this.preludeScreen && this.preludeScreen.parentNode) {
            this.preludeScreen.parentNode.removeChild(this.preludeScreen);
            this.preludeScreen = null;
          }
          resolve();
        }, 1500);
      }, duration - 1500); // Subtrai o tempo do fade-out
    });
  }

  async showVictoryScreen(winningTeam) {
    return new Promise(resolve => {
      // Remove o overlay preto antes de mostrar a vitória
      
      // Cria a tela de vitória
      this.victoryScreen = document.createElement('div');
      this.victoryScreen.className = 'victory';
      this.victoryScreen.style.opacity = '0';
      this.victoryScreen.style.transition = 'opacity 2s ease-in';
      
      this.victoryScreen.innerHTML = `
        <div class="bgs-victory">
            <div class="bg-default"></div>
            <div class="bg-golden"></div>
        </div>
        <div class="bg-pixel"></div>
        <div class="bgs-elements">
            <div class="naipes">
                <div class="copasGolden"></div>
                <div class="pausGolden"></div>
                <div class="ourosGolden"></div>
                <div class="espadasGolden"></div>
            </div>
            <div class="logo-opaca"></div>
            <div class="triangulosVermelhos">
                <div class="triangulo-direita"></div>
                <div class="triangulo-esquerda"></div>
            </div>
        </div>
        
        <div class="faixa">
            <div class="winTeam">
                <img src="../assets/images/winner/${winningTeam}_winner.png" 
                     alt="${winningTeam.toUpperCase()} WINS!" 
                     class="win-team-img" />
            </div>
        </div>
            <div class="flying-text"></div>

        <div class="elements">
            <div class="coroa"></div>
            <div class="estrelas">
                <div class="estrela-esquerda"></div>
                <div class="estrela-direita"></div>
            </div>
            <div class="brilho"></div>
            <div class="restart-btn"></div>

            <div class="figures">
                <div class="coracao"></div>
                <div class="diamante"></div>
            </div>
        </div>
      `;

      document.body.appendChild(this.victoryScreen);
      
      // Carrega os estilos da vitória
      this.loadVictoryStyles();
      
      const restartBtn = this.victoryScreen.querySelector('.restart-btn');
      if (restartBtn) {
        // Inicialmente desabilita o botão
        restartBtn.style.pointerEvents = 'none';
        restartBtn.style.cursor = 'default';
        
        restartBtn.addEventListener('click', () => {
          window.location.href = '../index.html';
        });
      }
      
      // Mostra a tela com animação de fade-in
      setTimeout(() => {
        this.victoryScreen.style.opacity = '1';
        
        // Habilita o botão após a transição de opacidade
        this.victoryScreen.addEventListener('transitionend', () => {
          if (this.victoryScreen.style.opacity === '1' && restartBtn) {
            restartBtn.style.pointerEvents = 'auto';
            restartBtn.style.cursor = 'pointer';
          }
          resolve();
        }, { once: true });
        
      }, 0);
    });
  }

  loadVictoryStyles() {
    // Verificar se os estilos já foram carregados
    if (document.getElementById('victory-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'victory-styles';
    link.rel = 'stylesheet';
    link.href = '../styles/victory.css';
    document.head.appendChild(link);
  }

  stopMonitoring() {
    clearInterval(this.checkInterval);
  }
}
// ============== PAUSE SYSTEM ==============
class PauseSystem {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseButton = null;
    this.activeIntervals = [];
    this.activeTimeouts = [];
    this.createPauseButton();
  }

  createPauseButton() {
    this.pauseButton = document.createElement('div');
    this.pauseButton.id = 'pause-button';
    this.pauseButton.innerHTML = '⏸️';
    this.pauseButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      z-index: 1000;
      font-size: 20px;
      color: white;
    `;
    
    this.pauseButton.addEventListener('click', () => this.togglePause());
    document.body.appendChild(this.pauseButton);
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  pause() {
    if (this.isPaused || this.game.isGameOver) return;
    
    this.isPaused = true;
    this.pauseTime = Date.now();
    
    // Pausar o timer visual
    if (this.game.visualTimer) {
      this.game.visualTimer.pause();
    }
    
    // Encontrar e armazenar todos os intervalos ativos
    this.activeIntervals = [];
    for (let i = 1; i < 10000; i++) {
      if (window[`${i}`] !== undefined) {
        this.activeIntervals.push(i);
        window.clearInterval(i);
      }
    }
    
    // Criar overlay de pause
    this.createPauseOverlay();
    
    // Adicionar evento de tecla para despausar com ESC
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') this.resume();
    };
    document.addEventListener('keydown', this.escapeHandler);
    
    // Disparar evento de pause
    document.dispatchEvent(new CustomEvent('gamePaused'));
  }

  resume() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    const pauseDuration = Date.now() - this.pauseTime;
    
    // Remover overlay de pause
    if (this.pauseOverlay) {
      document.body.removeChild(this.pauseOverlay);
      this.pauseOverlay = null;
    }
    
    // Retomar o timer visual
    if (this.game.visualTimer) {
      this.game.visualTimer.resume();
    }
    
    // Reativar intervalos (não precisamos restaurar os intervalos exatos,
    // pois o timer visual já cuida da parte visual)
    
    // Remover evento de tecla
    document.removeEventListener('keydown', this.escapeHandler);
    
    // Disparar evento de resume
    document.dispatchEvent(new CustomEvent('gameResumed'));
  }

  createPauseOverlay() {
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.id = 'pause-overlay';
    this.pauseOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999;
      flex-direction: column;
      color: white;
      font-family: Arial, sans-serif;
    `;
    
    this.pauseOverlay.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">PAUSED</div>
      <div style="font-size: 18px; margin-bottom: 30px;">Press ESC or click Resume to continue</div>
      <button id="resume-button" style="
        padding: 10px 20px;
        font-size: 16px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">Resume</button>
    `;
    
    document.body.appendChild(this.pauseOverlay);
    
    // Adicionar evento ao botão de resume
    document.getElementById('resume-button').addEventListener('click', () => this.resume());
  }
}
// Eventos personalizados para controle de pause
const originalPause = PauseSystem.prototype.pause;
const originalResume = PauseSystem.prototype.resume;

PauseSystem.prototype.pause = function() {
  const result = originalPause.apply(this, arguments);
  document.dispatchEvent(new CustomEvent('pauseStateChanged', { 
    detail: { paused: true } 
  }));
  return result;
};

PauseSystem.prototype.resume = function() {
  const result = originalResume.apply(this, arguments);
  document.dispatchEvent(new CustomEvent('pauseStateChanged', { 
    detail: { paused: false } 
  }));
  return result;
};

// Evento global de tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.gameInstance && window.gameInstance.pauseSystem) {
    window.gameInstance.pauseSystem.togglePause();
  }
});