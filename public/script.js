const socket = io();
let currentUser = null;
let currentQuestionIndex = 0;
let timerInterval = null;
let timeLeft = 20;

// DOM Elements
const lobbyScreen = document.getElementById('lobby');
const quizScreen = document.getElementById('quiz');
const resultsScreen = document.getElementById('results');
const usernameInput = document.getElementById('username');
const participantCount = document.getElementById('participantCount');
const adminPanel = document.getElementById('adminPanel');
const questionText = document.getElementById('questionText');
const currentQ = document.getElementById('currentQ');
const totalQ = document.getElementById('totalQ');
const timerDisplay = document.getElementById('timer');
const currentScore = document.getElementById('currentScore');
const options = document.querySelectorAll('.option');
const leaderboardList = document.getElementById('leaderboardList');
const finalScore = document.getElementById('finalScore');
const finalLeaderboard = document.getElementById('finalLeaderboard');

// Join Quiz Function
function joinQuiz() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter your name');
        return;
    }
    
    currentUser = username;
    socket.emit('join-quiz', username);
    
    // Show admin panel for first participant (simple admin system)
    if (Object.keys(quizState?.participants || {}).length === 0) {
        adminPanel.style.display = 'block';
    }
}

// Start Quiz Function (Admin only)
function startQuiz() {
    socket.emit('start-quiz');
}

// Select Answer Function
function selectAnswer(answerIndex) {
    if (!quizState?.isActive) return;
    
    // Disable all options after selection
    options.forEach(opt => opt.disabled = true);
    
    // Highlight selected answer
    options[answerIndex].classList.add('selected');
    
    // Check if correct (we'll show visual feedback)
    const question = questions[currentQuestionIndex];
    if (answerIndex === question.correct) {
        options[answerIndex].classList.add('correct');
    } else {
        options[answerIndex].classList.add('incorrect');
        options[question.correct].classList.add('correct');
    }
    
    // Send answer to server
    socket.emit('submit-answer', {
        questionIndex: currentQuestionIndex,
        answerIndex: answerIndex
    });
    
    // Move to next question after delay
    setTimeout(() => {
        socket.emit('next-question');
    }, 2000);
}

// Timer Function
function startTimer(duration) {
    timeLeft = duration;
    timerDisplay.textContent = timeLeft;
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        
        // Visual warning when time is running out
        if (timeLeft <= 5) {
            timerDisplay.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Auto-submit empty answer (wrong)
            options.forEach(opt => opt.disabled = true);
            setTimeout(() => {
                socket.emit('next-question');
            }, 1000);
        }
    }, 1000);
}

// Update Leaderboard Display
function updateLeaderboard(leaderboardData) {
    leaderboardList.innerHTML = '';
    
    leaderboardData.forEach((participant, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${participant.username === currentUser ? 'you' : ''}`;
        item.innerHTML = `
            <span class="leaderboard-rank">${index + 1}. ${participant.username}</span>
            <span class="leaderboard-score">${Math.round(participant.score)} pts</span>
        `;
        leaderboardList.appendChild(item);
    });
}

// Return to Lobby
function returnToLobby() {
    resultsScreen.classList.remove('active');
    lobbyScreen.classList.add('active');
    usernameInput.value = '';
    currentUser = null;
}

// Socket Event Listeners
socket.on('quiz-state', (state) => {
    quizState = state;
});

socket.on('participant-count', (count) => {
    participantCount.textContent = count;
});

socket.on('quiz-started', (firstQuestion) => {
    lobbyScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    currentQuestionIndex = 0;
    displayQuestion(firstQuestion);
});

socket.on('next-question', (question) => {
    currentQuestionIndex++;
    displayQuestion(question);
});

socket.on('leaderboard-update', (leaderboardData) => {
    updateLeaderboard(leaderboardData);
    
    // Update current user's score
    const currentUserData = leaderboardData.find(p => p.username === currentUser);
    if (currentUserData) {
        currentScore.textContent = Math.round(currentUserData.score);
    }
});

socket.on('quiz-finished', (finalLeaderboardData) => {
    quizScreen.classList.remove('active');
    resultsScreen.classList.add('active');
    
    // Find current user's final score
    const userFinalData = finalLeaderboardData.find(p => p.username === currentUser);
    if (userFinalData) {
        finalScore.textContent = Math.round(userFinalData.score);
    }
    
    // Display final leaderboard
    finalLeaderboard.innerHTML = '';
    finalLeaderboardData.forEach((participant, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${participant.username === currentUser ? 'you' : ''}`;
        item.innerHTML = `
            <span class="leaderboard-rank">${index + 1}. ${participant.username}</span>
            <span class="leaderboard-score">${Math.round(participant.score)} pts</span>
        `;
        finalLeaderboard.appendChild(item);
    });
});

// Display Question Function
function displayQuestion(question) {
    if (!question) return;
    
    questionText.textContent = question.question;
    currentQ.textContent = currentQuestionIndex + 1;
    
    // Reset and enable options
    options.forEach((opt, index) => {
        opt.textContent = question.options[index];
        opt.disabled = false;
        opt.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Start timer for this question
    startTimer(question.timeLimit);
}

// Initialize total questions display
totalQ.textContent = '50';

// Handle page refresh
window.addEventListener('beforeunload', () => {
    socket.disconnect();
});
