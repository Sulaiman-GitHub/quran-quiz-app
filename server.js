const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Sample Quran questions (you can expand to 50)
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
    // Add 47 more questions here
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
            // Calculate points based on speed (faster = more points)
            const timeTaken = Date.now() - quizState.startTime;
            const points = Math.max(10, 50 - Math.floor(timeTaken / 1000));
            participant.score += points;
        }

        participant.answers.push({
            questionId: question.id,
            answer: data.answerIndex,
            correct: isCorrect
        });

        // Update leaderboard
        io.emit('leaderboard-update', getLeaderboard());
    });

    socket.on('next-question', () => {
        quizState.currentQuestion++;
        if (quizState.currentQuestion < questions.length) {
            quizState.startTime = Date.now();
            io.emit('next-question', questions[quizState.currentQuestion]);
        } else {
            // Quiz finished
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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
