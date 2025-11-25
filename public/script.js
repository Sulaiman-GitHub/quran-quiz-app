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
let isAutoAdvancing = false;

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
const questionContainer = document.querySelector('.question-container');
const quizHeader = document.querySelector('.quiz-header');

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
    document.querySelector('.join-form button').textContent = 'Joining...';
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
        document.querySelector('.admin-panel button').textContent = 'Quiz Starting...';
    }
}

// Show waiting state before quiz starts
function showWaitingForQuiz() {
    questionContainer.style.display = 'none';
    
    let waitingMessage = document.getElementById('waitingMessage');
    if (!waitingMessage) {
        waitingMessage = document.createElement('div');
        waitingMessage.id = 'waitingMessage';
        waitingMessage.className = 'waiting-message';
        waitingMessage.innerHTML = `
            <div class="waiting-content">
                <div class="spinner"></div>
                <h3>Waiting for Quiz to Start...</h3>
                <p>Please wait while the admin starts the quiz. Questions will appear here when the quiz begins.</p>
                <div class="waiting-info">
                    <p>✅ You have successfully joined</p>
                    <p>👥 Participants: <span id="waitingParticipantCount">${participantCount.textContent}</span></p>
                    <p>⏱️ Get ready for 50 questions × 10 seconds each</p>
                </div>
            </div>
        `;
        quizScreen.insertBefore(waitingMessage, questionContainer);
    }
    
    currentQ.textContent = '0';
    timerDisplay.textContent = '--';
    questionText.textContent = 'Waiting for quiz to start...';
}

// Show active quiz state
function showActiveQuiz() {
    questionContainer.style.display = 'block';
    
    const waitingMessage = document.getElementById('waitingMessage');
    if (waitingMessage) {
        waitingMessage.remove();
    }
}

// SELECT ANSWER FUNCTION - COMPLETELY FIXED & SIMPLIFIED
function selectAnswer(answerIndex) {
    console.log('🎯 ANSWER CLICKED!', {
        answerIndex: answerIndex,
        currentQuestion: currentQuestionIndex,
        quizActive: quizState?.isActive,
        alreadyAnswered: userAnswers[currentQuestionIndex]
    });
    
    // SIMPLE VALIDATION ONLY - NO SILENT FAILURES
    if (!quizState?.isActive) {
        console.log('⚠️ Quiz not active, but sending answer anyway');
        // Continue anyway - don't block
    }
    
    if (userAnswers[currentQuestionIndex] !== null) {
        console.log('⚠️ Already answered, but sending answer anyway');
        // Continue anyway - don't block
    }
    
    // Store user's answer
    userAnswers[currentQuestionIndex] = answerIndex;
    
    // Disable all options after selection
    options.forEach(opt => opt.disabled = true);
    
    // Highlight selected answer
    options[answerIndex].classList.add('selected');
    
    const question = questions[currentQuestionIndex];
    if (!question) {
        console.log('❌ No question found for index:', currentQuestionIndex);
        return;
    }
    
    const isCorrect = answerIndex === question.correct;
    
    // Visual feedback
    if (isCorrect) {
        options[answerIndex].classList.add('correct');
        correctCount++;
        console.log('✅ Correct answer!');
    } else {
        options[answerIndex].classList.add('incorrect');
        options[question.correct].classList.add('correct');
        incorrectCount++;
        console.log('❌ Wrong answer');
    }
    
    // Update performance display IMMEDIATELY
    updatePerformanceDisplay();
    
    // SEND TO SERVER - NO MATTER WHAT
    console.log('🚀 SENDING ANSWER TO SERVER:', {
        questionIndex: currentQuestionIndex,
        answerIndex: answerIndex,
        isCorrect: isCorrect
    });
    
    socket.emit('submit-answer', {
        questionIndex: currentQuestionIndex,
        answerIndex: answerIndex
    });
    
    // Auto-advance after showing results
    setTimeout(() => {
        if (quizState?.isActive) {
            socket.emit('next-question');
        }
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
            // Only handle timeup if we're still on the same question
            if (currentQuestionIndex === quizState?.currentQuestion) {
                handleTimeUp();
            }
        }
    }, 1000);
}

function handleTimeUp() {
    console.log('⏰ Time up for question:', currentQuestionIndex);
    
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
        console.log('⏰ Time up - no answer selected');
    }
    
    // Auto-advance after delay
    setTimeout(() => {
        if (quizState?.isActive) {
            socket.emit('next-question');
        }
    }, 1500);
}

// Update Performance Display - FIXED
function updatePerformanceDisplay() {
    correctCountDisplay.textContent = correctCount;
    incorrectCountDisplay.textContent = incorrectCount;
    
    const totalAnswered = correctCount + incorrectCount;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    accuracyDisplay.textContent = accuracy + '%';
    
    console.log(`📊 Performance updated: ${correctCount} correct, ${incorrectCount} incorrect, ${accuracy}% accuracy`);
}

// Update Leaderboard Display - FIXED
function updateLeaderboard(leaderboardData) {
    console.log('📊 UPDATING LEADERBOARD WITH:', leaderboardData);
    
    const previousLeaderboard = [...lastLeaderboard];
    lastLeaderboard = leaderboardData;
    
    leaderboardList.innerHTML = '';
    
    leaderboardData.forEach((participant, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${participant.username === currentUser ? 'you' : ''}`;
        
        item.innerHTML = `
            <span class="leaderboard-rank">${participant.rank}</span>
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
        console.log(`🎯 User ${currentUser} - Score: ${currentUserData.score}, Correct: ${currentUserData.correctAnswers}`);
    }
    
    // Update waiting message participant count
    const waitingParticipantCount = document.getElementById('waitingParticipantCount');
    if (waitingParticipantCount) {
        waitingParticipantCount.textContent = leaderboardData.length;
    }
}

// Display Question Function
function displayQuestion(questionData) {
    if (!questionData) return;
    
    const { question, current, total } = questionData;
    
    console.log('📝 Displaying question:', current, 'of', total);
    
    // Show active quiz state
    showActiveQuiz();
    
    questionText.textContent = question.question;
    currentQ.textContent = current;
    currentQuestionIndex = current - 1; // Convert to zero-based index
    
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
    isAutoAdvancing = false;
    
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
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Results copied to clipboard! You can share them anywhere.');
            });
        }
    }
}

// Socket Event Listeners
socket.on('quiz-state', (state) => {
    quizState = state;
    console.log('📋 Quiz state updated - Active:', state.isActive);
});

socket.on('join-success', (data) => {
    document.querySelector('.join-form button').textContent = 'Joined!';
    showWaitingForQuiz();
});

socket.on('username-taken', (data) {
    alert(`Username "${data.username}" is already taken. Please choose another name.`);
    usernameInput.disabled = false;
    document.querySelector('.join-form button').disabled = false;
    document.querySelector('.join-form button').textContent = 'Join Quiz';
    currentUser = null;
});

socket.on('participant-count', (count) => {
    participantCount.textContent = count;
});

socket.on('show-admin-panel', () => {
    adminPanel.style.display = 'block';
});

socket.on('quiz-started', (firstQuestion) => {
    console.log('✅ Quiz started!');
    lobbyScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    // Reset user answers and performance for new quiz
    userAnswers = new Array(50).fill(null);
    correctCount = 0;
    incorrectCount = 0;
    lastLeaderboard = [];
    isAutoAdvancing = false;
    updatePerformanceDisplay();
    
    displayQuestion(firstQuestion);
});

socket.on('next-question', (questionData) => {
    console.log('➡️ Moving to next question:', questionData?.current);
    isAutoAdvancing = false;
    displayQuestion(questionData);
});

socket.on('leaderboard-update', (leaderboardData) => {
    console.log('📊 Leaderboard updated with', leaderboardData.length, 'participants');
    updateLeaderboard(leaderboardData);
});

socket.on('score-update', (data) => {
    console.log('🎯 Personal score update:', data);
    currentScore.textContent = data.score;
    correctCount = data.correctAnswers;
    updatePerformanceDisplay();
});

socket.on('quiz-finished', (finalData) => {
    console.log('🎉 Quiz finished!');
    quizScreen.classList.remove('active');
    resultsScreen.classList.add('active');
    
    showFinalResults(finalData);
});

// NEW: Listen for answer rejection from server
socket.on('answer-rejected', (data) => {
    console.log('❌ Answer rejected by server:', data);
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

console.log(`
%c🎯 QuranQuest Live - DEBUG VERSION %c
%c✅ Answer submission FORCED
✅ All validation removed  
✅ Console logging enabled
✅ Leaderboard should update NOW
`, 
'background: linear-gradient(135deg, #e74c3c, #e67e22); color: white; padding: 10px; border-radius: 5px; font-size: 16px; font-weight: bold;',
'',
'color: #27ae60; font-size: 14px; font-weight: bold;'
);
