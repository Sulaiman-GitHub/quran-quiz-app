const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, 'public')));

// HEALTH CHECK ENDPOINT - REQUIRED FOR RAILWAY
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'QuranQuiz server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// COMPLETE 50 QURAN QUESTIONS (10 seconds each)
const questions = [
    // ... KEEP ALL YOUR EXISTING 50 QUESTIONS EXACTLY AS IS ...
    // (I'm not including them here to save space, but keep them exactly as you have)
];

let quizState = {
    isActive: false,
    currentQuestion: 0,
    startTime: null,
    participants: {},
    questionStartTime: null,
    questionTimer: null
};

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join-quiz', (username) => {
        // Prevent duplicate usernames
        const existingUser = Object.values(quizState.participants).find(
            p => p.username.toLowerCase() === username.toLowerCase()
        );
        
        if (existingUser) {
            socket.emit('username-taken', { username: username });
            return;
        }

        quizState.participants[socket.id] = {
            username: username,
            score: 0,
            answers: new Array(questions.length).fill(null),
            correctAnswers: 0,
            totalTime: 0,
            socketId: socket.id,
            joinedAt: Date.now()
        };
        
        socket.emit('quiz-state', quizState);
        socket.emit('join-success', { username: username });
        io.emit('participant-count', Object.keys(quizState.participants).length);
        io.emit('leaderboard-update', getLeaderboard());
        
        // Show admin panel for first participant
        if (Object.keys(quizState.participants).length === 1) {
            socket.emit('show-admin-panel');
        }

        console.log(`User joined: ${username} - Total: ${Object.keys(quizState.participants).length}`);
    });

    socket.on('start-quiz', () => {
        if (Object.keys(quizState.participants).length === 0) {
            console.log('Cannot start quiz - no participants');
            return;
        }

        console.log('Starting quiz with', Object.keys(quizState.participants).length, 'participants');
        
        quizState.isActive = true;
        quizState.currentQuestion = 0;
        quizState.questionStartTime = Date.now();
        
        // Clear any existing timer
        if (quizState.questionTimer) {
            clearTimeout(quizState.questionTimer);
        }

        io.emit('quiz-started', {
            question: questions[0],
            current: 1,
            total: questions.length
        });

        // Auto-advance after time limit
        quizState.questionTimer = setTimeout(() => {
            if (quizState.isActive && quizState.currentQuestion === 0) {
                handleNextQuestion();
            }
        }, questions[0].timeLimit * 1000);
    });

    socket.on('submit-answer', (data) => {
        // SIMPLIFIED VALIDATION FOR RAILWAY
        if (!quizState.isActive) {
            console.log('Quiz not active - rejecting answer');
            return;
        }

        const participant = quizState.participants[socket.id];
        if (!participant) {
            console.log('Participant not found - rejecting answer');
            return;
        }

        const questionIndex = data.questionIndex;
        const question = questions[questionIndex];
        
        if (!question) {
            console.log('Question not found for index:', questionIndex);
            return;
        }

        // Prevent duplicate answers for same question
        if (participant.answers[questionIndex] !== null) {
            console.log('Duplicate answer - rejecting');
            return;
        }

        const isCorrect = data.answerIndex === question.correct;
        const answerTime = Date.now() - quizState.questionStartTime;
        
        // Store the answer
        participant.answers[questionIndex] = {
            answerIndex: data.answerIndex,
            isCorrect: isCorrect,
            timeTaken: answerTime,
            timestamp: Date.now()
        };

        // SIMPLIFIED SCORING - WORKS RELIABLY
        if (isCorrect) {
            const timeBonus = Math.max(50, 100 - Math.floor(answerTime / 100));
            participant.score += timeBonus;
            participant.correctAnswers++;
            console.log(`✅ ${participant.username} - Correct! +${timeBonus} points`);
        } else {
            console.log(`❌ ${participant.username} - Incorrect answer`);
        }

        participant.totalTime += answerTime;

        console.log(`📊 ${participant.username} - Score: ${participant.score}, Correct: ${participant.correctAnswers}`);

        // IMMEDIATE leaderboard update
        const updatedLeaderboard = getLeaderboard();
        io.emit('leaderboard-update', updatedLeaderboard);
        
        // Individual score update
        socket.emit('score-update', {
            score: participant.score,
            correctAnswers: participant.correctAnswers
        });
    });

    socket.on('next-question', () => {
        handleNextQuestion();
    });

    function handleNextQuestion() {
        // Clear existing timer
        if (quizState.questionTimer) {
            clearTimeout(quizState.questionTimer);
        }

        quizState.currentQuestion++;
        if (quizState.currentQuestion < questions.length) {
            quizState.questionStartTime = Date.now();
            
            io.emit('next-question', {
                question: questions[quizState.currentQuestion],
                current: quizState.currentQuestion + 1,
                total: questions.length
            });

            // Set timer for auto-advance
            quizState.questionTimer = setTimeout(() => {
                if (quizState.isActive && quizState.currentQuestion < questions.length) {
                    handleNextQuestion();
                }
            }, questions[quizState.currentQuestion].timeLimit * 1000);

            console.log(`Moving to question ${quizState.currentQuestion + 1}`);
        } else {
            // Quiz finished
            quizState.isActive = false;
            const finalResults = getFinalResults();
            io.emit('quiz-finished', finalResults);
            console.log('🎉 Quiz finished!');
        }
    }

    // NEW: Handle reconnection requests
    socket.on('rejoin-quiz', (data) => {
        const participant = quizState.participants[socket.id];
        if (participant && participant.username === data.username) {
            console.log(`🔄 ${data.username} reconnected`);
            // Send current state
            socket.emit('connection-restored', {
                leaderboard: getLeaderboard(),
                currentQuestion: quizState.currentQuestion,
                isActive: quizState.isActive
            });
        }
    });

    // NEW: Send current question
    socket.on('get-current-question', () => {
        if (quizState.isActive && quizState.currentQuestion < questions.length) {
            socket.emit('current-question', {
                question: questions[quizState.currentQuestion],
                current: quizState.currentQuestion + 1,
                total: questions.length
            });
        }
    });

    socket.on('disconnect', () => {
        const participant = quizState.participants[socket.id];
        if (participant) {
            console.log('User disconnected:', participant.username);
            delete quizState.participants[socket.id];
        }
        io.emit('participant-count', Object.keys(quizState.participants).length);
        io.emit('leaderboard-update', getLeaderboard());
    });
});

function getLeaderboard() {
    const participants = Object.values(quizState.participants);
    
    const sortedParticipants = participants.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
        return a.totalTime - b.totalTime;
    });
    
    return sortedParticipants.map((participant, index) => ({
        rank: index + 1,
        username: participant.username,
        score: Math.round(participant.score),
        correctAnswers: participant.correctAnswers,
        totalQuestions: questions.length,
        socketId: participant.socketId
    }));
}

function getFinalResults() {
    const leaderboard = getLeaderboard();
    const questionResults = questions.map((question, index) => {
        const participantAnswers = Object.values(quizState.participants).map(p => ({
            username: p.username,
            answer: p.answers[index]?.answerIndex,
            isCorrect: p.answers[index]?.isCorrect,
            timeTaken: p.answers[index]?.timeTaken
        }));

        return {
            question: question.question,
            options: question.options,
            correctAnswer: question.correct,
            correctText: question.options[question.correct],
            participantAnswers: participantAnswers
        };
    });

    return {
        leaderboard: leaderboard,
        questions: questionResults,
        totalQuestions: questions.length
    };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Total questions loaded: ${questions.length}`);
    console.log('✅ QuranQuest Live Quiz Server Started!');
});

// Add error handling
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});
