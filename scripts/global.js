export const global = {
  sound: true,
  options: {
    think: 2 * 60,   // default: 2 min
    judge: 2 * 60,   // default: 2 min
    round: 2 * 60,   // default: 2 min
    rounds: 9,      // default: 9 rounds
  },
  tutorial: {
    think: 15,   // default: 15 s
    judge: 999,   // default: 999 s
    round: 15,   // default: 15 s
    rounds: 3,    
  }
};

// Função para carregar os valores salvos no localStorage
export function loadOptions() {
  global.options.think = parseFloat(localStorage.getItem("timeToThink") || "2", 10) * 60;
  global.options.judge = parseFloat(localStorage.getItem("timeToJudge") || "2", 10) * 60;
  global.options.round = parseFloat(localStorage.getItem("roundDuration") || "2", 10) * 60;
  global.options.rounds = parseInt(localStorage.getItem("roundsCount") || "9", 10);
}

// Carrega imediatamente ao importar
loadOptions();
