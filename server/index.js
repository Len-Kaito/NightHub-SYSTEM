require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api', require('./routes/movieRoutes'));
app.use('/api/watch-history', require('./routes/watchHistoryRoutes'));
app.use('/api/my-list', require('./routes/myListRoutes'));
app.use('/api/recommend', require('./routes/recommendRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/faq', require('./routes/faqRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
    res.send('NightHub API is running');
});

// Health check endpoint - test DB connection
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.execute('SELECT 1 FROM DUAL');
        if (result) {
            res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date() });
        } else {
            res.status(500).json({ status: 'error', db: 'disconnected' });
        }
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ status: 'error', db: 'disconnected', details: error.message });
    }
});

// Initialize DB and start server
async function startServer() {
    try {
        await db.initialize();
        console.log('Database initialized');
        
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

// Handle graceful shutdown
const shutdown = async () => {
    console.log('Shutting down server...');
    try {
        await db.close();
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
