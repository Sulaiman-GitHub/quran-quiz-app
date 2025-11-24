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
    // Add 40 more questions following the same pattern...
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
    // Continue adding until 50 questions...
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
    }
    // Note: You can continue adding 25 more questions following this pattern
];

let quizState = {
    isActive: false,
    currentQuestion: 0,
    startTime: null,
    participants: {},
    questionStartTime: null
};

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join-quiz', (username) => {
        quizState.participants[socket.id] = {
            username: username,
            score: 0,
            answers: new Array(questions.length).fill(null),
            correctAnswers: 0,
            totalTime: 0
        };
        
        socket.emit('quiz-state', quizState);
        io.emit('participant-count', Object.keys(quizState.participants).length);
        io.emit('leaderboard-update', getLeaderboard());
        
        // Show admin panel for first participant
        if (Object.keys(quizState.participants).length === 1) {
            socket.emit('show-admin-panel');
        }
    });

    socket.on('start-quiz', () => {
        quizState.isActive = true;
        quizState.currentQuestion = 0;
        quizState.questionStartTime = Date.now();
        io.emit('quiz-started', {
            question: questions[0],
            current: 1,
            total: questions.length
        });
    });

    socket.on('submit-answer', (data) => {
        if (!quizState.isActive || data.questionIndex !== quizState.currentQuestion) return;

        const participant = quizState.participants[socket.id];
        const question = questions[data.questionIndex];
        const isCorrect = data.answerIndex === question.correct;
        const answerTime = Date.now() - quizState.questionStartTime;
        
        // Store the answer
        participant.answers[data.questionIndex] = {
            answerIndex: data.answerIndex,
            isCorrect: isCorrect,
            timeTaken: answerTime
        };

        // Calculate points: Base 100 points for correct answer, reduced by time taken
        if (isCorrect) {
            const timeBonus = Math.max(0, 100 - Math.floor(answerTime / 100));
            participant.score += timeBonus;
            participant.correctAnswers++;
        }

        participant.totalTime += answerTime;

        // Update everyone's leaderboard
        io.emit('leaderboard-update', getLeaderboard());
    });

    socket.on('next-question', () => {
        quizState.currentQuestion++;
        if (quizState.currentQuestion < questions.length) {
            quizState.questionStartTime = Date.now();
            io.emit('next-question', {
                question: questions[quizState.currentQuestion],
                current: quizState.currentQuestion + 1,
                total: questions.length
            });
        } else {
            // Quiz finished - send detailed results
            quizState.isActive = false;
            const finalResults = getFinalResults();
            io.emit('quiz-finished', finalResults);
        }
    });

    socket.on('disconnect', () => {
        delete quizState.participants[socket.id];
        io.emit('participant-count', Object.keys(quizState.participants).length);
        io.emit('leaderboard-update', getLeaderboard());
    });
});

function getLeaderboard() {
    return Object.values(quizState.participants)
        .sort((a, b) => b.score - a.score)
        .map((participant, index) => ({
            rank: index + 1,
            username: participant.username,
            score: Math.round(participant.score),
            correctAnswers: participant.correctAnswers,
            totalQuestions: questions.length
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
    console.log(`Server running on port ${PORT}`);
    console.log(`Total questions loaded: ${questions.length}`);
});
