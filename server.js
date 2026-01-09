const express = require('express');
const { Pool } = require('pg');  // Changed from mysql2
const bcrypt = require('bcrypt');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const os = require('os');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL Connection Pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'bmw_db_user',
    password: process.env.DB_PASSWORD || '8pgCkc3EU46plq9DQVS9NyVMiWedDiYK',
    database: process.env.DB_NAME || 'bmw_db',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const raWellness = [
    {id:1, activity: 'Physical activity (e.g., walking or exercise)', source: 'NHS exercise guidelines', priority: '["high","moderate"]'},
    {id:2, activity: 'Mindfulness or meditation', source: 'NHS mindfulness guide', priority: '["high","mild"]'},
    {id:3, activity: 'Connect with others socially', source: 'APA social connections', priority: '["low","mild"]'},
    {id:4, activity: 'Get restorative sleep', source: 'APA lifestyle page', priority: '["all"]'},
    {id:5, activity: 'Practice gratitude or journaling', source: 'Greater Good Health routines', priority: '["moderate","low"]'},
    {id:6, activity: 'Healthy eating', source: 'APA nutrition info', priority: '["high"]'}
];

// Initialize Database Tables
async function initDb() {
    try {
        const client = await pool.connect();
        
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                scores JSONB DEFAULT '[]'::jsonb,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create ra_wellness table
        await client.query(`
            CREATE TABLE IF NOT EXISTS ra_wellness (
                id INTEGER PRIMARY KEY,
                activity TEXT NOT NULL,
                source TEXT NOT NULL,
                priority JSONB NOT NULL
            )
        `);

        // Seed ra_wellness data
        for (let activity of raWellness) {
            await client.query(
                `INSERT INTO ra_wellness (id, activity, source, priority) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (id) DO NOTHING`,
                [activity.id, activity.activity, activity.source, activity.priority]
            );
        }

        client.release();
        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ DB Init failed:', error);
    }
}

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashed = await bcrypt.hash(password, 12);
        
        const result = await pool.query(
            'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, name, email',
            [email.toLowerCase(), hashed, name]
        );
        
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        const user = result.rows[0];
        
        if (user && await bcrypt.compare(password, user.password)) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    scores: user.scores || []
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/profile/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, scores FROM users WHERE id = $1',
            [req.params.id]
        );
        res.json(result.rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/score/:id', async (req, res) => {
    try {
        const { score } = req.body;
        const userResult = await pool.query('SELECT scores FROM users WHERE id = $1', [req.params.id]);
        const scores = userResult.rows[0]?.scores || [];
        scores.push(score);
        
        await pool.query(
            'UPDATE users SET scores = $1 WHERE id = $2',
            [JSON.stringify(scores), req.params.id]
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/plan/:score', async (req, res) => {
    try {
        const score = parseInt(req.params.score);
        const level = score >= 10 ? 'high' : score >= 5 ? 'moderate' : 'low';
        
        const result = await pool.query(
            `SELECT * FROM ra_wellness 
             WHERE priority @> $1 OR priority @> $2`,
            [JSON.stringify([level]), JSON.stringify(['all'])]
        );
        
        const recs = result.rows.slice(0, 3);
        res.json({
            recommendations: recs,
            fullTable: raWellness,
            level: level,
            score: score
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`🌟 BMW live on http://localhost:${port}`);
    console.log(`Platform: ${os.platform()}`);
    if (process.env.INIT_DB === 'true') await initDb();
});

module.exports = app;
