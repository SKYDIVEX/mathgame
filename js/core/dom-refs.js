/* ══ MathGame · js/core/dom-refs.js ══ (index.html'de sırayla yüklenir) */
const bgLayer = document.getElementById('bgLayer');
const entryCard = document.getElementById('entryCard');
const playerNameInput = document.getElementById('playerName');
const enterBtn = document.getElementById('enterBtn');
const guestBtn = document.getElementById('guestBtn');
const menuCard = document.getElementById('menuCard');
const playerLabel = document.getElementById('playerLabel');
const startGameBtn = document.getElementById('startGameBtn');
const startAbsurdBtn = document.getElementById('startAbsurdBtn');
if (!startAbsurdBtn) { console.warn('startAbsurdBtn bulunamadı'); }
const logoutBtn = document.getElementById('logoutBtn');
const openSettings = document.getElementById('openSettings');
const openAbout = document.getElementById('openAbout');
const resetScores = document.getElementById('resetScores');
const leaderboardEl = document.getElementById('leaderboard');
const boardDiv = document.getElementById('board');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const btnColorInput = document.getElementById('btnColor');
const bgColorInput = document.getElementById('bgColor');
const bgImageBtn = document.getElementById('bgImageBtn');
const bgImageInput = document.getElementById('bgImageInput') || document.getElementById('bgImageInput2');
const clearBgBtn = document.getElementById('clearBgBtn');
const gameArea = document.getElementById('gameArea');
const playerDisplay = document.getElementById('playerDisplay');
const levelUI = document.getElementById('levelUI');
const scoreUI = document.getElementById('scoreUI');
const multiplierUI = document.getElementById('multiplierUI');
const rewardUI = document.getElementById('rewardUI');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const resultMsg = document.getElementById('resultMsg');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const pauseSettingsBtn = document.getElementById('pauseSettingsBtn');
const pauseMenuBtn = document.getElementById('pauseMenuBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingSound = document.getElementById('settingSound');
const settingBtnColor = document.getElementById('settingBtnColor');
const settingBgColor = document.getElementById('settingBgColor');
const aboutModal = document.getElementById('aboutModal');
const quickSoundToggle = document.getElementById('soundToggle');
const opCheckboxes = document.querySelectorAll('.opType');

/* Audio (WebAudio) */
