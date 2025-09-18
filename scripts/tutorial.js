import { GameOverlay, Game, GameOverHandler, JudgingScreen } from "./game.js";

export class TutorialGame {
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
    return new Promise(resolve => {
      const start = Date.now();
      let checkInterval = null;

      const check = () => {
        // Verificar se o timer visual terminou (mais robusto)
        if (this.visualTimer.isFinished || this.visualTimer.remainingTime <= 0) {
          if (checkInterval) clearInterval(checkInterval);
          resolve();
          return;
        }

        if (this.pauseSystem.isPaused) {
          // Continua verificando a cada 100ms se estiver pausado
          return;
        }

        const elapsed = Date.now() - start - this.pauseSystem.totalPauseTime;
        if (elapsed >= ms) {
          if (checkInterval) clearInterval(checkInterval);
          resolve();
        }
      };

      // Verificar a cada 50ms para ser mais responsivo
      checkInterval = setInterval(check, 50);
      check(); // Chamar imediatamente
    });
  }
  startQuestionsDisplay() {
    // Inicia a exibição das perguntas
    this.currentQuestion = 0;
    if (typeof this.showCurrentQuestion === 'function') {
      this.showCurrentQuestion();
    }
  }
  async showCurrentQuestion() {
    // Esconde o placarimport { global } from "./global.js";

    const scoreboard = document.getElementById('scoreboard');
    if (scoreboard) scoreboard.style.display = 'none';

    // Mostra o cronômetro global (visual-timer) só na tela da pergunta
    const visualTimer = document.getElementById('visual-timer');
    if (visualTimer) {
      // Garantir que o timer volte a aparecer mesmo após skip anterior
      visualTimer.classList.remove('fade-out-up');
      visualTimer.style.visibility = '';
      visualTimer.style.opacity = '';
      visualTimer.style.transform = '';
      visualTimer.style.display = '';
    }


    const container = document.getElementById('questions-container');
    if (!container) return;
    container.innerHTML = '';

    // Mostra a pergunta
    const p = document.createElement('p');
    p.textContent = `${this.currentQuestion + 1}. ${this.selectedQuestions[this.currentQuestion]}`;
    container.appendChild(p);

    // Ações da pergunta (ex.: botão para pular tempo de pensar)
    const actions = document.createElement('div');
    actions.className = 'question-actions';
    const skipBtn = document.createElement('button');
    skipBtn.id = 'skip-thinking-btn';
    skipBtn.type = 'button';
    skipBtn.textContent = 'SKIP THE THINKING TIME';
    skipBtn.addEventListener('click', () => {
      // Evitar múltiplos cliques
      skipBtn.disabled = true;
      // Animação de saída suave da pergunta e do timer visual
      try {
        p.classList.add('fade-out-up');
        actions.classList.add('fade-out-up');
        const vt = document.getElementById('visual-timer');
        if (vt) vt.classList.add('fade-out-up');
      } catch (_) { }
      // Guardar pequena janela para a animação concluir
      this.skipTransitionMS = 350;
      // Finaliza imediatamente o timer de pensar
      if (this.visualTimer && !this.visualTimer.isFinished) {
        this.visualTimer.finishNow();
      }
    });
    actions.appendChild(skipBtn);
    container.appendChild(actions);

    this.visualTimer.reset();
    this.visualTimer.start();

    await this.delay(global.options.think * 1000);
    // Se veio de um skip, aguarda a animação de saída terminar
    if (this.skipTransitionMS && this.skipTransitionMS > 0) {
      await new Promise(res => setTimeout(res, this.skipTransitionMS));
      this.skipTransitionMS = 0;
    }

    // Verificação extra para garantir que o timer seja resetado apenas se não tiver terminado
    if (!this.visualTimer.isFinished && this.visualTimer.remainingTime > 0) {
      this.visualTimer.reset();
    }
    // Esconde o visual-timer antes dos turnos
    if (visualTimer) visualTimer.style.display = 'none';

    // Mostra o placar antes do fight
    if (scoreboard) scoreboard.style.display = '';

    // Agora sim, inicia os turnos
    await this.showFightAndTurns();

    this.pauseSystem.resetPauseTime();

    await this.runTeamTurn('team1', global.options.round);

    this.pauseSystem.resetPauseTime();

    await this.runTeamTurn('team2', global.options.round);

    // Esconde (sem reflow) o FIGHT, a linha dos turnos e as ações antes do julgamento
    const fightOverlay = document.getElementById('fight-overlay');
    const turnsRow = document.querySelector('.turns-top-row');
    const turnActions = document.querySelector('.turn-actions');
    if (turnsRow) turnsRow.style.visibility = 'hidden';
    if (turnActions) turnActions.style.visibility = 'hidden';
    if (fightOverlay) fightOverlay.style.visibility = 'hidden';

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
      <div class="turn-actions">
        <button id="end-turn-btn" type="button">END TURN</button>
      </div>
    `;
    this.updateLifeBars();

    // Transição de entrada suave
    const fightOverlay = document.getElementById('fight-overlay');
    const turnsRow = container.querySelector('.turns-top-row');
    const turnActions = container.querySelector('.turn-actions');
    if (turnsRow) {
      turnsRow.classList.add('fade-in-up');
    }
    if (turnActions) {
      turnActions.classList.add('fade-in-up');
    }
    if (fightOverlay) {
      // Garante um frame para aplicar a classe que revela
      requestAnimationFrame(() => {
        fightOverlay.classList.add('show');
      });
    }
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
    const endTurnBtn = document.getElementById('end-turn-btn');

    if (team1Label && team2Label) {
      if (team === 'team1') {
        if (endTurnBtn) {
          endTurnBtn.classList.add('end-turn-pink');
          endTurnBtn.classList.remove('end-turn-blue');
        }
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
        if (endTurnBtn) {
          endTurnBtn.classList.add('end-turn-blue');
          endTurnBtn.classList.remove('end-turn-pink');
        }
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
    //timer
    const timerElement = document.getElementById('team-timer');
    const timerSpan = timerElement.querySelector('span');
    let startTime = Date.now();
    let remaining = seconds;

    return new Promise(resolve => {
      const isTeam1 = team === 'team1';
      let intervalId = null;
      let endedEarly = false;

      const updateTimer = () => {
        if (this.pauseSystem.isPaused) {
          return;
        }

        // Usar o totalPauseTime global (já resetado para este turno)
        const elapsed = (Date.now() - startTime - this.pauseSystem.totalPauseTime) / 1000;
        remaining = Math.max(seconds - elapsed, 0);
        const percentage = (remaining / seconds) * 100;
        const deg = (percentage / 100) * 360;

        timerElement.style.background = `conic-gradient(${isTeam1 ? '#3a87ad' : '#e37ea3'} ${deg}deg, #eee 0deg)`;
        timerSpan.textContent = Math.ceil(remaining);

        if (remaining <= 0) {
          if (intervalId) clearInterval(intervalId);
          cleanup();
          resolve();
        }
      };

      // Listener simples - o PauseSystem já gerencia o acumulo
      const pauseHandler = (e) => {
        if (e.detail.paused) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        } else {
          if (!intervalId) {
            intervalId = setInterval(updateTimer, 100);
          }
        }
      };

      document.addEventListener('pauseStateChanged', pauseHandler);

      // Iniciar o timer
      intervalId = setInterval(updateTimer, 100);

      // Cleanup
      const cleanup = () => {
        if (intervalId) clearInterval(intervalId);
        document.removeEventListener('pauseStateChanged', pauseHandler);
        if (endTurnBtn && onEndClick) {
          endTurnBtn.removeEventListener('click', onEndClick);
        }
        if (endTurnBtn) endTurnBtn.disabled = true;
      };

      // Habilitar botão END TURN para encerrar este turno
      let onEndClick = null;
      if (endTurnBtn) {
        endTurnBtn.disabled = false;
        onEndClick = () => {
          if (endedEarly) return;
          endedEarly = true;
          endTurnBtn.disabled = true;
          cleanup();
          resolve();
        };
        endTurnBtn.addEventListener('click', onEndClick);
      }

      // Timeout de fallback
      setTimeout(() => {
        cleanup();
        resolve();
      }, seconds * 1000 + 2000);
    });
  }
  constructor(job) {
    this.job = job;
    this.selectedQuestions = [
      {
        
      }
    ];
    this.currentQuestion = 0;
    this.visualTimer = new VisualTimer('visual-timer', global.options.think); // Criar aqui
    this.teamScores = { team1: 0, team2: 0 };
    this.maxPoints = 10;
    this.maxLives = 5;
    this.teamLives = { team1: this.maxLives, team2: 0 };
    this.isGameOver = false;
    this.gameOverHandler = new GameOverHandler(this);
    this.pauseSystem = new PauseSystem(this);
    this.skipTransitionMS = 0;

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

class TutorialFlow {
  static async start() {
    const overlay = new GameOverlay();
    const countdownImgs = [
      "../assets/images/game/c3.png",
      "../assets/images/game/c2.png",
      "../assets/images/game/c1.png",
      "../assets/images/game/ready.png",
    ];

    await overlay.showAnticipation(4000);
    await overlay.showCountdown(countdownImgs);
    const game = new TutorialGame().initialize()
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Só inicializa o jogo quando estiver em pages/game.html
  const isGamePage = /\/pages\/tutorial\.html$/.test(window.location.pathname);
  if (isGamePage) {
    TutorialFlow.start();
  }
});