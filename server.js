const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Fix for Render deployment - allow all origins
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sample Quran questions
const questions = [
    {
        id: 1,
        question: "How many Surahs are there in the Quran?",
        options: ["114", "110", "120", "130"],
        correct: 0,
        timeLimit: 20
    },
    {
        id: 2,
        question: "Which Surah is called the 'Heart of the Quran'?",
        options: ["Surah Yasin", "Surah Al-Fatiha", "Surah Al-Baqarah", "Surah Al-Ikhlas"],
        correct: 0,
        timeLimit: 20
    },
    {
        id: 3, 
        question: "How many Juz (parts) are in the Quran?",
        options: ["20", "30", "40", "50"],
        correct: 1,
        timeLimit: 20
    }
];

let quizState = {
    isActive: false,
    currentQuestion: 0,
    startTime: null,
    participants: {}
};

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join-quiz', (username) => {
        quizState.participants[socket.id] = {
            username: username,
            score: 0,
            answers: []
        };
        
        socket.emit('quiz-state', quizState);
        io.emit('participant-count', Object.keys(quizState.participants).length);
        
        // Show admin panel for first participant
        if (Object.keys(quizState.participants).length === 1) {
            socket.emit('show-admin-panel');
        }
    });

    socket.on('start-quiz', () => {
        quizState.isActive = true;
        quizState.startTime = Date.now();
        quizState.currentQuestion = 0;
        io.emit('quiz-started', questions[0]);
    });

    socket.on('submit-answer', (data) => {
        if (!quizState.isActive) return;

        const participant = quizState.participants[socket.id];
        const question = questions[data.questionIndex];
        const isCorrect = data.answerIndex === question.correct;
        
        if (isCorrect) {
            const timeTaken = Date.now() - quizState.startTime;
            const points = Math.max(10, 50 - Math.floor(timeTaken / 1000));
            participant.score += points;
        }

        participant.answers.push({
            questionId: question.id,
            answer: data.answerIndex,
            correct: isCorrect
        });

        io.emit('leaderboard-update', getLeaderboard());
    });

    socket.on('next-question', () => {
        quizState.currentQuestion++;
        if (quizState.currentQuestion < questions.length) {
            quizState.startTime = Date.now();
            io.emit('next-question', questions[quizState.currentQuestion]);
        } else {
            quizState.isActive = false;
            io.emit('quiz-finished', getLeaderboard());
        }
    });

    socket.on('disconnect', () => {
        delete quizState.participants[socket.id];
        io.emit('participant-count', Object.keys(quizState.participants).length);
    });
});

function getLeaderboard() {
    return Object.values(quizState.participants)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
