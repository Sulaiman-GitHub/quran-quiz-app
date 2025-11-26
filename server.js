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
    {
        id: 1,
        question: "How many Surahs are there in the Quran?",
        options: ["114", "110", "120", "130"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 2,
        question: "Which Surah is called the 'Heart of the Quran'?",
        options: ["Surah Yasin", "Surah Al-Fatiha", "Surah Al-Baqarah", "Surah Al-Ikhlas"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 3,
        question: "How many Juz (parts) are in the Quran?",
        options: ["20", "30", "40", "50"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 4,
        question: "Which Surah is known as 'The Opening'?",
        options: ["Surah Al-Baqarah", "Surah Al-Fatiha", "Surah Al-Ikhlas", "Surah An-Nas"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 5,
        question: "How many verses are in Surah Al-Fatiha?",
        options: ["5", "6", "7", "8"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 6,
        question: "Which prophet is mentioned the most in the Quran?",
        options: ["Prophet Ibrahim", "Prophet Musa", "Prophet Isa", "Prophet Muhammad"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 7,
        question: "How many times is the word 'Quran' mentioned in the Quran?",
        options: ["50", "58", "70", "75"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 8,
        question: "Which angel revealed the Quran to Prophet Muhammad?",
        options: ["Angel Mikail", "Angel Jibril", "Angel Israfil", "Angel Izrail"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 9,
        question: "In which month was the Quran first revealed?",
        options: ["Muharram", "Rajab", "Ramadan", "Shawwal"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 10,
        question: "How many Makki Surahs are in the Quran?",
        options: ["76", "82", "86", "90"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 11,
        question: "Which Surah is the longest in the Quran?",
        options: ["Surah Al-Imran", "Surah An-Nisa", "Surah Al-Baqarah", "Surah Al-Maidah"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 12,
        question: "How many times should Muslims pray in a day according to Quran?",
        options: ["3", "4", "5", "6"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 13,
        question: "Which animal is mentioned in the Quran that spoke to humans?",
        options: ["Lion", "Elephant", "Ant", "Dog"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 14,
        question: "What is the first word revealed of the Quran?",
        options: ["Qalam", "Iqra", "Bismillah", "Allah"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 15,
        question: "Which Surah is called 'The Beauty of the Quran'?",
        options: ["Surah Ar-Rahman", "Surah Al-Waqiah", "Surah Al-Mulk", "Surah Yaseen"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 16,
        question: "How many prophets are mentioned by name in the Quran?",
        options: ["20", "25", "30", "35"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 17,
        question: "Which Surah is known as 'The Bride of the Quran'?",
        options: ["Surah Ar-Rahman", "Surah Yaseen", "Surah Al-Waqiah", "Surah Al-Mulk"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 18,
        question: "In which language was the Quran revealed?",
        options: ["Hebrew", "Aramaic", "Arabic", "Persian"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 19,
        question: "Which Surah is recited in every rakat of Salah?",
        options: ["Surah Ikhlas", "Surah Fatiha", "Surah Yaseen", "Surah Mulk"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 20,
        question: "How many times is the name 'Muhammad' mentioned in the Quran?",
        options: ["2", "4", "6", "8"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 21,
        question: "Which Surah has no Bismillah?",
        options: ["Surah At-Taubah", "Surah Al-Anfal", "Surah Al-Ma'un", "Surah Al-Kawthar"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 22,
        question: "How many Madani Surahs are in the Quran?",
        options: ["24", "28", "32", "36"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 23,
        question: "Which prophet built the Kaaba?",
        options: ["Prophet Ibrahim and Ismail", "Prophet Adam", "Prophet Nuh", "Prophet Musa"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 24,
        question: "Which Surah is called 'The Mother of the Quran'?",
        options: ["Surah Al-Baqarah", "Surah Al-Fatiha", "Surah Al-Imran", "Surah An-Nisa"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 25,
        question: "How many times is the word 'Salah' mentioned in the Quran?",
        options: ["67", "77", "87", "97"],
        correct: 3,
        timeLimit: 10
    },
    {
        id: 26,
        question: "Which Surah is named after a woman?",
        options: ["Surah Maryam", "Surah Noor", "Surah Fatir", "Surah Rahman"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 27,
        question: "How many times is the word 'Ramadan' mentioned in the Quran?",
        options: ["1", "2", "3", "4"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 28,
        question: "Which Surah is called 'The Crowning'?",
        options: ["Surah Al-Fatiha", "Surah Al-Baqarah", "Surah Yaseen", "Surah Al-Mulk"],
        correct: 3,
        timeLimit: 10
    },
    {
        id: 29,
        question: "How many years did it take for the Quran to be revealed?",
        options: ["20 years", "23 years", "25 years", "30 years"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 30,
        question: "Which Surah is known as 'The Quran's Backbone'?",
        options: ["Surah Al-Baqarah", "Surah Al-Kahf", "Surah Al-Mulk", "Surah Yaseen"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 31,
        question: "Which Surah is called 'The Glory'?",
        options: ["Surah Al-Isra", "Surah Al-Fath", "Surah Al-Hadid", "Surah Al-Mulk"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 32,
        question: "How many times is the word 'Qadar' mentioned in the Quran?",
        options: ["5", "7", "9", "11"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 33,
        question: "Which Surah is named after an insect?",
        options: ["Surah An-Nahl", "Surah An-Naml", "Surah Al-Ankabut", "Surah Al-Fil"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 34,
        question: "How many times is the word 'Jannah' mentioned in the Quran?",
        options: ["66", "77", "88", "99"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 35,
        question: "Which Surah is called 'The Test'?",
        options: ["Surah Al-Mumtahanah", "Surah Al-Mujadilah", "Surah Al-Hashr", "Surah As-Saff"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 36,
        question: "How many times is the word 'Shaytan' mentioned in the Quran?",
        options: ["68", "73", "78", "83"],
        correct: 3,
        timeLimit: 10
    },
    {
        id: 37,
        question: "Which Surah is named after a battle?",
        options: ["Surah Al-Ahzab", "Surah Al-Anfal", "Surah Al-Hashr", "Surah As-Saff"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 38,
        question: "How many times is the word 'Rahman' mentioned in the Quran?",
        options: ["47", "57", "67", "77"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 39,
        question: "Which Surah is called 'The Iron'?",
        options: ["Surah Al-Hadid", "Surah Al-Qalam", "Surah Al-Muzzammil", "Surah Al-Muddathir"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 40,
        question: "How many times is the word 'Qiyamah' mentioned in the Quran?",
        options: ["60", "65", "70", "75"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 41,
        question: "Which Surah is named after a star?",
        options: ["Surah An-Najm", "Surah Ash-Shams", "Surah Al-Qamar", "Surah At-Tariq"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 42,
        question: "How many times is the word 'Hajj' mentioned in the Quran?",
        options: ["8", "10", "12", "14"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 43,
        question: "Which Surah is called 'The Dawn'?",
        options: ["Surah Al-Falaq", "Surah Al-Fajr", "Surah Ad-Duha", "Surah Al-Lail"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 44,
        question: "How many times is the word 'Sadaqah' mentioned in the Quran?",
        options: ["13", "15", "17", "19"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 45,
        question: "Which Surah is named after a city?",
        options: ["Surah Rome", "Surah Sheba", "Surah Antioch", "Surah Babylon"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 46,
        question: "How many times is the word 'Tawbah' mentioned in the Quran?",
        options: ["11", "13", "15", "17"],
        correct: 1,
        timeLimit: 10
    },
    {
        id: 47,
        question: "Which Surah is called 'The Sun'?",
        options: ["Surah Ash-Shams", "Surah Ad-Duha", "Surah Al-Lail", "Surah Al-Fajr"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 48,
        question: "How many times is the word 'Rizq' mentioned in the Quran?",
        options: ["102", "112", "122", "132"],
        correct: 2,
        timeLimit: 10
    },
    {
        id: 49,
        question: "Which Surah is named after a prophet's wife?",
        options: ["Surah Maryam", "Surah Nooh", "Surah Hud", "Surah Yusuf"],
        correct: 0,
        timeLimit: 10
    },
    {
        id: 50,
        question: "How many times is the word 'Ilm' mentioned in the Quran?",
        options: ["704", "754", "804", "854"],
        correct: 3,
        timeLimit: 10
    }
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
      // Handle reconnection requests
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

// Send current question
socket.on('get-current-question', () => {
    if (quizState.isActive && quizState.currentQuestion < questions.length) {
        socket.emit('current-question', {
            question: questions[quizState.currentQuestion],
            current: quizState.currentQuestion + 1,
            total: questions.length
        });
    }
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
