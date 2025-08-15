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
  static show(teamLives = {team1: 5, team2: 5}) {
    return new Promise(resolve => {
      // Remove overlay antigo se existir
      const old = document.getElementById('judging-time-overlay');
      if (old) old.remove();

      // Cria overlay
      const overlay = document.createElement('div');
      overlay.id = 'judging-time-overlay';
      overlay.className = 'judging-time-overlay';
      overlay.style.opacity = '0';

      // Estrutura do conteúdo central
      overlay.innerHTML = `
        <div class="judging-content diagonal-layout">
          <div class="judging-team judging-team1 diagonal-team1">
            <div class="judging-banner team1">
              <span class="judging-banner-label team1">TEAM 1</span>
            </div>
            <div class="judging-life-bar-wrapper team1">
              <img src="/assets/images/game/life_bar_rosa.png" alt="Coração Rosa" class="judging-life-heart" />
              <div class="judging-life-bar team1"><div class="judging-life-bar-fill team1" style="width:${(teamLives.team1/5)*100}%"></div></div>
            </div>
          </div>
          <div class="judging-vs diagonal-vs">VS</div>
          <div class="judging-team judging-team2 diagonal-team2">
            <div class="judging-banner team2">
              <span class="judging-banner-label team2">TEAM 2</span>
            </div>
            <div class="judging-life-bar-wrapper team2">
              <div class="judging-life-bar team2"><div class="judging-life-bar-fill team2" style="width:${(teamLives.team2/5)*100}%"></div></div>
              <img src="/assets/images/game/life_bar_azul.png" alt="Coração Azul" class="judging-life-heart" />
            </div>
          </div>
          <div class="judging-strike-row diagonal-strike-row">
            <button class="judging-strike-btn team1" id="voteTeam1">STRIKE!</button>
            <img src="/assets/images/game/joystick.png" alt="Joystick" class="judging-joystick" />
            <button class="judging-strike-btn team2" id="voteTeam2">STRIKE!</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Fade-in
      setTimeout(() => { overlay.style.opacity = '1'; }, 10);

      // Lógica de voto
      let votedTeam = null;
      const voteTeam1Btn = overlay.querySelector('#voteTeam1');
      const voteTeam2Btn = overlay.querySelector('#voteTeam2');

      function onVote(team) {
        votedTeam = team;
        voteTeam1Btn.disabled = true;
        voteTeam2Btn.disabled = true;
        // Visual feedback: botão perdedor fica "apagado"
        if (team === 'team1') {
          voteTeam2Btn.classList.add('inactive');
        } else {
          voteTeam1Btn.classList.add('inactive');
        }
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
    });
  }
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

        // Estrutura do conteúdo central
        overlay.innerHTML = `
          <div class="choose-job-bg">
            <div class="choose-job-bg-triangle-left"></div>
            <div class="choose-job-bg-triangle-right"></div>
            <div class="choose-job-bg-copas"></div>
            <div class="choose-job-bg-espadas"></div>
            <div class="choose-job-bg-ouros"></div>
            <div class="choose-job-bg-paus"></div>
          </div>
          <div class="judging-content diagonal-layout">
            <div class="judging-team judging-team1 diagonal-team1">
              <div class="judging-banner team1">
                <img src="/assets/images/game/team1.png" alt="Team 1" class="judging-banner-img team1" />
              </div>
              <div class="judging-life-bar-wrapper team1">
                <img src="/assets/images/game/life_bar_rosa.png" alt="Coração Rosa" class="judging-life-heart" />
                <div class="judging-life-bar team1"><div id="judging-life-team1" class="judging-life-bar-fill team1"></div></div>
              </div>
            </div>
            <div class="judging-vs diagonal-vs">VS</div>
            <div class="judging-team judging-team2 diagonal-team2">
              <div class="judging-banner team2">
                <img src="/assets/images/game/team2.png" alt="Team 2" class="judging-banner-img team2" />
              </div>
              <div class="judging-life-bar-wrapper team2">
                <div class="judging-life-bar team2"><div id="judging-life-team2" class="judging-life-bar-fill team2"></div></div>
                <img src="/assets/images/game/life_bar_azul.png" alt="Coração Azul" class="judging-life-heart" />
              </div>
            </div>
            <div class="judging-strike-row diagonal-strike-row">
              <button class="judging-strike-btn team1" id="voteTeam1">STRIKE!</button>
              <img src="/assets/images/game/joystick.png" alt="Joystick" class="judging-joystick" />
              <button class="judging-strike-btn team2" id="voteTeam2">STRIKE!</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        // Fade-in
        setTimeout(() => { overlay.style.opacity = '1'; }, 10);

        // Atualização em tempo real das barras de vida da tela de julgamento
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

        // Lógica de voto
        let votedTeam = null;
        const voteTeam1Btn = overlay.querySelector('#voteTeam1');
        const voteTeam2Btn = overlay.querySelector('#voteTeam2');

        function animateLifeBar(team, from, to, duration = 500) {
          const bar = document.getElementById(`judging-life-${team}`);
          if (!bar) return;
          const start = performance.now();
          function animate(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const value = from + (to - from) * progress;
            bar.style.width = `${value * 100}%`;
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }
          requestAnimationFrame(animate);
        }

        function onVote(team) {
          votedTeam = team;
          voteTeam1Btn.disabled = true;
          voteTeam2Btn.disabled = true;
          // Visual feedback: botão perdedor fica "apagado"
          if (team === 'team1') {
            voteTeam2Btn.classList.add('inactive');
          } else {
            voteTeam1Btn.classList.add('inactive');
          }
          if (rafId) cancelAnimationFrame(rafId);

          // Anima a barra de vida do time que tomou dano
          if (gameInstance && gameInstance.teamLives) {
            const max = gameInstance.maxLives || 5;
            const current = gameInstance.teamLives[team] / max;
            const after = Math.max((gameInstance.teamLives[team] - 1) / max, 0);
            animateLifeBar(team, current, after);
          }

          setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
              overlay.remove();
              resolve(votedTeam);
            }, 500);
          }, 1300);
        }
        voteTeam1Btn.onclick = () => onVote('team1');
        voteTeam2Btn.onclick = () => onVote('team2');
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
      img.src = '/assets/images/game/judges_will_decide.png';
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

    // Agora sim, inicia os turnos
    await this.showFightAndTurns();
    await this.runTeamTurn('team1', 5);
    await this.runTeamTurn('team2', 5);

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
            <img src="/assets/images/game/life_bar_rosa.png" alt="Coração Rosa" class="life-heart" />
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
            <img src="/assets/images/game/life_bar_azul.png" alt="Coração Azul" class="life-heart" />
          </div>
        </div>
      </div>
      <div id="fight-overlay" class="fight-overlay">
        <div class="fight-banner">
          <img src="/assets/images/game/fight.png" alt="FIGHT!" class="fight-img" />
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
        // Ativa barra/heart do time 1, desativa do time 2
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
        // Ativa barra/heart do time 2, desativa do time 1
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
  this.maxLives = 5;
  this.teamLives = { team1: this.maxLives, team2: this.maxLives };
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
    // Só chama showCurrentQuestion se ainda houver perguntas
    if (this.currentQuestion < this.selectedQuestions.length) {
      await this.showCurrentQuestion();
    }
    // Se acabou, pode exibir tela de fim de jogo aqui se quiser
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
