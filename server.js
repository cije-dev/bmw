const express = require('express');
const mysql = require('mysql2/promise');
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

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bmw_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : null
};

const raWellness = [
    {id:1, activity: 'Physical activity (e.g., walking or exercise)', source: 'NHS exercise guidelines', priority: '["high","moderate"]'},
    {id:2, activity: 'Mindfulness or meditation', source: 'NHS mindfulness guide', priority: '["high","mild"]'},
    {id:3, activity: 'Connect with others socially', source: 'APA social connections', priority: '["low","mild"]'},
    {id:4, activity: 'Get restorative sleep', source: 'APA lifestyle page', priority: '["all"]'},
    {id:5, activity: 'Practice gratitude or journaling', source: 'Greater Good Health routines', priority: '["moderate","low"]'},
    {id:6, activity: 'Healthy eating', source: 'APA nutrition info', priority: '["high"]'}
];

async function getDb() {
    return await mysql.createConnection(dbConfig);
}

async function initDb() {
    try {
        const db = await getDb();
        await db.execute('CREATE DATABASE IF NOT EXISTS bmw_db');
        await db.execute('USE bmw_db');

        await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            scores JSON DEFAULT '[]',
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS ra_wellness (
            id INT PRIMARY KEY,
            activity TEXT NOT NULL,
            source TEXT NOT NULL,
            priority JSON NOT NULL
        )`);

        for (let activity of raWellness) {
            await db.execute(
                'INSERT IGNORE INTO ra_wellness (id, activity, source, priority) VALUES (?, ?, ?, ?)',
                [activity.id, activity.activity, activity.source, activity.priority]
            );
        }
        db.end();
        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ DB Init failed:', error);
    }
}

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const db = await getDb();
        const hashed = await bcrypt.hash(password, 12);
        await db.execute(
            'INSERT INTO users (email, password, name) VALUES (LOWER(?), ?, ?)',
            [email, hashed, name]
        );
        db.end();
        res.json({ success: true, message: 'Account created' });
    } catch (err) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await getDb();
        const [rows] = await db.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        const user = rows[0];
        db.end();

        if (user && await bcrypt.compare(password, user.password)) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    scores: JSON.parse(user.scores || '[]')
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
        const db = await getDb();
        const [rows] = await db.execute('SELECT id, name, email, scores FROM users WHERE id = ?', [req.params.id]);
        res.json(rows[0] || {});
        db.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/score/:id', async (req, res) => {
    try {
        const { score } = req.body;
        const db = await getDb();
        const [userRows] = await db.execute('SELECT scores FROM users WHERE id = ?', [req.params.id]);
        const scores = JSON.parse(userRows[0]?.scores || '[]');
        scores.push(score);
        await db.execute('UPDATE users SET scores = ? WHERE id = ?', [JSON.stringify(scores), req.params.id]);
        db.end();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/plan/:score', async (req, res) => {
    try {
        const score = parseInt(req.params.score);
        const level = score >= 10 ? 'high' : score >= 5 ? 'moderate' : 'low';
        const db = await getDb();
        const [rows] = await db.execute(
            'SELECT * FROM ra_wellness WHERE JSON_OVERLAPS(priority, ?) OR JSON_CONTAINS(priority, ?)',
            [JSON.stringify([level]), JSON.stringify('all')]
        );
        db.end();
        const recs = rows.slice(0, 3);
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
