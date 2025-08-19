export const global = {
  sound: true,
  options: {
    think: 2 * 60,   // default: 2 min
    judge: 2 * 60,   // default: 2 min
    round: 2 * 60,   // default: 2 min
    rounds: 9        // default: 9 rounds
  }
};

// Função para carregar os valores salvos no localStorage
export function loadOptions() {
  global.options.think = parseInt(localStorage.getItem("timeToThink") || "2", 10) * 60;
  global.options.judge = parseInt(localStorage.getItem("timeToJudge") || "2", 10) * 60;
  global.options.round = parseInt(localStorage.getItem("roundDuration") || "2", 10) * 60;
  global.options.rounds = parseInt(localStorage.getItem("roundsCount") || "9", 10);
}

// Carrega imediatamente ao importar
loadOptions();
