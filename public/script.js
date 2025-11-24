// Socket.io connection
const socket = io({
    transports: ['websocket', 'polling']
});

// Connection status monitoring
socket.on('connect', () => {
    console.log('✅ Connected to server');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
    console.log('❌ Connection error:', error);
});

// Application state
let currentUser = null;
let currentQuestionIndex = 0;
let timerInterval = null;
let timeLeft = 10;
let quizState = null;
let questions = [];
let userAnswers = new Array(50).fill(null);
let correctCount = 0;
let incorrectCount = 0;
let lastLeaderboard = [];

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
const questionsReview = document.getElementById('questionsReview');
const correctCountDisplay = document.getElementById('correctCount');
const incorrectCountDisplay = document.getElementById('incorrectCount');
const accuracyDisplay = document.getElementById('accuracy');

// Join Quiz Function
function joinQuiz() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter your name');
        return;
    }
    
    if (username.length < 2) {
        alert('Please enter a name with at least 2 characters');
        return;
    }
    
    currentUser = username;
    socket.emit('join-quiz', username);
    
    // Disable join button to prevent multiple joins
    usernameInput.disabled = true;
    document.querySelector('.join-form button').disabled = true;
    document.querySelector('.join-form button').textContent = 'Joined!';
}

// Start Quiz Function (Admin only)
function startQuiz() {
    if (Object.keys(quizState?.participants || {}).length === 0) {
        alert('No participants have joined yet!');
        return;
    }
    
    if (confirm('Start the quiz for all participants? This cannot be undone.')) {
        socket.emit('start-quiz');
        document.querySelector('.admin-panel button').disabled = true;
        document.querySelector('.admin-panel button').textContent = 'Quiz Started!';
    }
}

// Select Answer Function - FIXED: Better state validation
function selectAnswer(answerIndex) {
    console.log('Answer selected:', answerIndex, 'Question:', currentQuestionIndex);
    
    // FIX 1: Validate quiz state more thoroughly
    if (!quizState?.isActive) {
        console.log('Quiz not active - cannot answer');
        alert('Quiz is not active yet. Please wait for the quiz to start.');
        return;
    }
    
    // FIX 2: Prevent multiple answers for same question
    if (userAnswers[currentQuestionIndex] !== null) {
        console.log('Already answered this question');
        return;
    }
    
    // Store user's answer immediately
    userAnswers[currentQuestionIndex] = answerIndex;
    
    // Disable all options after selection
    options.forEach(opt => opt.disabled = true);
    
    // Highlight selected answer
    options[answerIndex].classList.add('selected');
    
    const question = questions[currentQuestionIndex];
    const isCorrect = answerIndex === question.correct;
    
    // Visual feedback
    if (isCorrect) {
        options[answerIndex].classList.add('correct');
        correctCount++;
    } else {
        options[answerIndex].classList.add('incorrect');
        options[question.correct].classList.add('correct');
        incorrectCount++;
    }
    
    // Update performance display
    updatePerformanceDisplay();
    
    // Send answer to server with validation
    console.log('Sending answer to server...');
    socket.emit('submit-answer', {
        questionIndex: currentQuestionIndex,
        answerIndex: answerIndex
    });
    
    // Auto-advance after showing results
    setTimeout(() => {
        socket.emit('next-question');
    }, 2000);
}

// Timer Function
function startTimer(duration) {
    timeLeft = duration;
    timerDisplay.textContent = timeLeft;
    timerDisplay.classList.remove('warning');
    
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
            handleTimeUp();
        }
    }, 1000);
}

function handleTimeUp() {
    console.log('Time up for question:', currentQuestionIndex);
    
    // Disable all options
    options.forEach(opt => opt.disabled = true);
    
    // Mark as not answered if no answer was selected
    if (userAnswers[currentQuestionIndex] === null) {
        userAnswers[currentQuestionIndex] = -1; // -1 means no answer
        incorrectCount++;
        updatePerformanceDisplay();
        
        // Show correct answer
        const question = questions[currentQuestionIndex];
        if (question) {
            options[question.correct].classList.add('correct');
        }
    }
    
    // Auto-advance after delay
    setTimeout(() => {
        socket.emit('next-question');
    }, 1500);
}

// Update Performance Display
function updatePerformanceDisplay() {
    correctCountDisplay.textContent = correctCount;
    incorrectCountDisplay.textContent = incorrectCount;
    
    const totalAnswered = correctCount + incorrectCount;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    accuracyDisplay.textContent = accuracy + '%';
}

// Update Leaderboard Display - FIXED: Dynamic ordering with visual feedback
function updateLeaderboard(leaderboardData) {
    // Store for comparison
    const previousLeaderboard = [...lastLeaderboard];
    lastLeaderboard = leaderboardData;
    
    leaderboardList.innerHTML = '';
    
    leaderboardData.forEach((participant, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${participant.username === currentUser ? 'you' : ''}`;
        
        // FIX 3: Add ranking change indicators
        const previousRank = previousLeaderboard.findIndex(p => p.username === participant.username);
        let rankChange = '';
        if (previousRank !== -1 && previousRank !== index) {
            const change = previousRank - index; // Positive = moved up, Negative = moved down
            if (change > 0) {
                rankChange = `<span class="rank-up">↑${change}</span>`;
            } else if (change < 0) {
                rankChange = `<span class="rank-down">↓${Math.abs(change)}</span>`;
            }
        }
        
        item.innerHTML = `
            <span class="leaderboard-rank">${participant.rank} ${rankChange}</span>
            <span class="leaderboard-name">${participant.username}</span>
            <span class="leaderboard-score">${participant.score}</span>
            <span class="leaderboard-correct">${participant.correctAnswers}/${participant.totalQuestions}</span>
        `;
        leaderboardList.appendChild(item);
    });
    
    // Update current user's score if they're in the leaderboard
    const currentUserData = leaderboardData.find(p => p.username === currentUser);
    if (currentUserData) {
        currentScore.textContent = currentUserData.score;
        
        // FIX 4: Update performance counts from server data
        correctCount = currentUserData.correctAnswers;
        incorrectCount = (currentQuestionIndex + 1) - correctCount;
        updatePerformanceDisplay();
    }
}

// Display Question Function - FIXED: Reset state properly
function displayQuestion(questionData) {
    if (!questionData) return;
    
    const { question, current, total } = questionData;
    
    console.log('Displaying question:', current, 'of', total);
    
    questionText.textContent = question.question;
    currentQ.textContent = current;
    currentQuestionIndex = current - 1;
    
    // Store the question
    questions[currentQuestionIndex] = question;
    
    // Reset options state
    options.forEach((opt, index) => {
        opt.textContent = question.options[index];
        opt.disabled = false;
        opt.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Start timer for this question
    startTimer(question.timeLimit);
}

// Show Final Results
function showFinalResults(finalData) {
    const { leaderboard, questions: questionResults, totalQuestions } = finalData;
    
    // Display final leaderboard
    finalLeaderboard.innerHTML = '';
    leaderboard.forEach((participant, index) => {
        const accuracy = Math.round((participant.correctAnswers / totalQuestions) * 100);
        const item = document.createElement('div');
        item.className = `leaderboard-item ${participant.username === currentUser ? 'you' : ''}`;
        item.innerHTML = `
            <span class="leaderboard-rank">${participant.rank}</span>
            <span class="leaderboard-name">${participant.username}</span>
            <span class="leaderboard-score">${participant.score}</span>
            <span class="leaderboard-correct">${participant.correctAnswers}/${totalQuestions}</span>
            <span class="leaderboard-accuracy">${accuracy}%</span>
        `;
        finalLeaderboard.appendChild(item);
    });
    
    // Display questions review
    questionsReview.innerHTML = '';
    questionResults.forEach((qResult, index) => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        
        const userAnswer = userAnswers[index];
        const userAnswerText = userAnswer !== null && userAnswer !== -1 ? qResult.options[userAnswer] : 'Not answered';
        const isCorrect = userAnswer === qResult.correctAnswer;
        
        reviewItem.innerHTML = `
            <div class="review-question">${index + 1}. ${qResult.question}</div>
            <div class="review-answer ${isCorrect ? 'correct' : 'incorrect'}">
                <div>
                    <strong>Your answer:</strong> ${userAnswerText}<br>
                    <strong>Correct answer:</strong> ${qResult.correctText}
                </div>
                <span class="answer-status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
            </div>
        `;
        questionsReview.appendChild(reviewItem);
    });
    
    // Show final user score
    const currentUserResult = leaderboard.find(p => p.username === currentUser);
    if (currentUserResult) {
        finalScore.textContent = currentUserResult.score;
    }
}

// Return to Lobby
function returnToLobby() {
    resultsScreen.classList.remove('active');
    lobbyScreen.classList.add('active');
    
    // Reset everything
    usernameInput.value = '';
    usernameInput.disabled = false;
    document.querySelector('.join-form button').disabled = false;
    document.querySelector('.join-form button').textContent = 'Join Quiz';
    adminPanel.style.display = 'none';
    
    currentUser = null;
    currentQuestionIndex = 0;
    userAnswers = new Array(50).fill(null);
    correctCount = 0;
    incorrectCount = 0;
    questions = [];
    lastLeaderboard = [];
    
    if (timerInterval) clearInterval(timerInterval);
}

// Share Results Function
function shareResults() {
    const currentUserResult = Array.from(finalLeaderboard.children).find(item => 
        item.classList.contains('you')
    );
    
    if (currentUserResult) {
        const rank = currentUserResult.querySelector('.leaderboard-rank').textContent;
        const score = currentUserResult.querySelector('.leaderboard-score').textContent;
        const correct = currentUserResult.querySelector('.leaderboard-correct').textContent;
        
        const shareText = `I scored ${score} points and ranked ${rank} in the QuranQuest Live Quiz! Correct answers: ${correct}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My QuranQuest Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Results copied to clipboard! You can share them anywhere.');
            });
        }
    }
}

// Socket Event Listeners
socket.on('quiz-state', (state) => {
    quizState = state;
    console.log('Quiz state updated:', state);
});

socket.on('participant-count', (count) => {
    participantCount.textContent = count;
});

socket.on('show-admin-panel', () => {
    adminPanel.style.display = 'block';
});

socket.on('quiz-started', (firstQuestion) => {
    console.log('Quiz started!');
    lobbyScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    // Reset user answers and performance for new quiz
    userAnswers = new Array(50).fill(null);
    correctCount = 0;
    incorrectCount = 0;
    lastLeaderboard = [];
    updatePerformanceDisplay();
    
    displayQuestion(firstQuestion);
});

socket.on('next-question', (questionData) => {
    console.log('Moving to next question:', questionData?.current);
    displayQuestion(questionData);
});

socket.on('leaderboard-update', (leaderboardData) => {
    console.log('Leaderboard updated with', leaderboardData.length, 'participants');
    updateLeaderboard(leaderboardData);
});

socket.on('quiz-finished', (finalData) => {
    console.log('Quiz finished!');
    quizScreen.classList.remove('active');
    resultsScreen.classList.add('active');
    
    showFinalResults(finalData);
});

// Initialize total questions display
totalQ.textContent = '50';

// Handle page refresh
window.addEventListener('beforeunload', () => {
    socket.disconnect();
});

// Enable Enter key to join quiz
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinQuiz();
    }
});

// Prevent form submission on Enter
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.type !== 'text') {
        e.preventDefault();
    }
});

// Add some console styling for fun
console.log(`
%c🎯 QuranQuest Live - Enhanced Version %c
%c✅ All fixes applied:
   - Answer validation and state checking
   - Duplicate answer prevention  
   - Real-time leaderboard sorting
   - Proper ranking system
   - Dynamic performance tracking
`, 
'background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px; border-radius: 5px; font-size: 16px; font-weight: bold;',
'',
'color: #27ae60; font-size: 14px; font-weight: bold;'
);
