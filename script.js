const questions = [
  "Tell me about yourself.",
  "What are your strengths?",
  "Describe a challenge you faced at work.",
  "Why do you want to work with us?",
  "Where do you see yourself in five years?"
];

let currentQuestionIndex = 0;
let answers = {};

function nextQuestion() {
  const question = questions[currentQuestionIndex];
  document.querySelectorAll('.question').forEach(p => p.textContent = question);
  currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
  answers = {}; // Reset answers

  document.querySelectorAll('textarea').forEach(t => t.value = "");
  document.querySelectorAll('input[type=radio]').forEach(input => input.checked = false);
  document.getElementById("scores").innerHTML = "";
}

function submitAnswer(candidateNumber) {
  const div = document.getElementById(`candidate${candidateNumber}`);
  const text = div.querySelector("textarea").value;
  if (!text.trim()) return alert("Please provide an answer.");
  answers[candidateNumber] = text;
  logEvent(`Candidate ${candidateNumber} answered: "${text}"`);
}

function evaluateRound() {
  if (!answers[1] || !answers[2]) {
    alert("Both candidates must submit answers.");
    return;
  }

  const votes = [
    document.querySelector('input[name="judge1"]:checked'),
    document.querySelector('input[name="judge2"]:checked'),
    document.querySelector('input[name="judge3"]:checked')
  ];

  if (votes.includes(null)) {
    alert("All judges must vote.");
    return;
  }

  let score = {1: 0, 2: 0};
  votes.forEach(v => score[v.value]++);

  const winner = score[1] > score[2] ? 1 : 2;
  document.getElementById("scores").innerHTML = `🏆 Candidate ${winner} wins with ${score[winner]} votes!`;
  logEvent(`🏆 Candidate ${winner} wins this round (${score[1]} - ${score[2]})`);
  nextQuestion();
}

function logEvent(text) {
  const logList = document.getElementById("logList");
  const li = document.createElement("li");
  li.textContent = text;
  logList.appendChild(li);
}

document.addEventListener('DOMContentLoaded', () => {
  nextQuestion();
});
