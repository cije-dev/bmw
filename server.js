const express = require('express');
const initSqlJs = require('sql.js');
const bcrypt = require('bcrypt');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// SQLite Database (using sql.js - pure JavaScript, no compilation needed)
let db = null;
const dbPath = path.join(__dirname, 'bmw.db');

const raWellness = [
    {id:1, activity: 'Physical activity (e.g., walking or exercise)', source: 'NHS exercise guidelines', priority: JSON.stringify(['high','moderate'])},
    {id:2, activity: 'Mindfulness or meditation', source: 'NHS mindfulness guide', priority: JSON.stringify(['high','mild'])},
    {id:3, activity: 'Connect with others socially', source: 'APA social connections', priority: JSON.stringify(['low','mild'])},
    {id:4, activity: 'Get restorative sleep', source: 'APA lifestyle page', priority: JSON.stringify(['all'])},
    {id:5, activity: 'Practice gratitude or journaling', source: 'Greater Good Health routines', priority: JSON.stringify(['moderate','low'])},
    {id:6, activity: 'Healthy eating', source: 'APA nutrition info', priority: JSON.stringify(['high'])}
];

// Initialize Database
async function initDb() {
    try {
        const SQL = await initSqlJs();
        
        // Load existing database or create new one
        let buffer;
        if (fs.existsSync(dbPath)) {
            buffer = fs.readFileSync(dbPath);
            db = new SQL.Database(buffer);
            console.log('📂 Loaded existing database');
        } else {
            db = new SQL.Database();
            console.log('✨ Created new database');
        }
        
        // Create users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                scores TEXT DEFAULT '[]',
                created DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create ra_wellness table
        db.run(`
            CREATE TABLE IF NOT EXISTS ra_wellness (
                id INTEGER PRIMARY KEY,
                activity TEXT NOT NULL,
                source TEXT NOT NULL,
                priority TEXT NOT NULL
            )
        `);

        // Seed ra_wellness data
        for (const activity of raWellness) {
            db.run(
                `INSERT OR IGNORE INTO ra_wellness (id, activity, source, priority) 
                 VALUES (?, ?, ?, ?)`,
                [activity.id, activity.activity, activity.source, activity.priority]
            );
        }

        // Create indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_email ON users(email)`);

        // Save database to file
        saveDb();
        
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ DB Init failed:', error);
        throw error;
    }
}

// Save database to file
function saveDb() {
    if (db) {
        try {
            const data = db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbPath, buffer);
        } catch (error) {
            console.error('Error saving database:', error);
        }
    }
}

// Helper function to parse JSON from database
function parseJsonSafely(str, defaultValue = []) {
    try {
        return JSON.parse(str || '[]');
    } catch {
        return defaultValue;
    }
}

// Helper to get query results as objects
function queryToObjects(stmt) {
    const columns = stmt.getColumnNames();
    const rows = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push(row);
    }
    return rows;
}

// Initialize database on startup
let dbReady = false;
initDb().then(() => {
    dbReady = true;
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// API Routes
app.post('/api/register', async (req, res) => {
    if (!dbReady) {
        return res.status(503).json({ error: 'Database not ready' });
    }
    
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        
        const hashed = await bcrypt.hash(password, 12);
        
        const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
        stmt.run([email.toLowerCase(), hashed, name]);
        stmt.free();
        
        const userId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
        const userStmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?');
        userStmt.bind([userId]);
        const user = userStmt.getAsObject();
        userStmt.free();
        
        saveDb();
        
        res.json({ success: true, user });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            console.error('Register error:', err);
            res.status(500).json({ error: err.message || 'Registration failed' });
        }
    }
});

app.post('/api/login', async (req, res) => {
    if (!dbReady) {
        return res.status(503).json({ error: 'Database not ready' });
    }
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
        stmt.bind([email]);
        const user = stmt.getAsObject();
        stmt.free();
        
        if (user && user.id && await bcrypt.compare(password, user.password)) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    scores: parseJsonSafely(user.scores)
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message || 'Login failed' });
    }
});

app.get('/api/profile/:id', (req, res) => {
    if (!dbReady) {
        return res.status(503).json({ error: 'Database not ready' });
    }
    
    try {
        const stmt = db.prepare('SELECT id, name, email, scores FROM users WHERE id = ?');
        stmt.bind([req.params.id]);
        const user = stmt.getAsObject();
        stmt.free();
        
        if (user && user.id) {
            res.json({
                ...user,
                scores: parseJsonSafely(user.scores)
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: err.message || 'Failed to get profile' });
    }
});

app.post('/api/score/:id', (req, res) => {
    if (!dbReady) {
        return res.status(503).json({ error: 'Database not ready' });
    }
    
    try {
        const { score } = req.body;
        
        if (score === undefined || score === null) {
            return res.status(400).json({ error: 'Score is required' });
        }
        
        const stmt = db.prepare('SELECT scores FROM users WHERE id = ?');
        stmt.bind([req.params.id]);
        const user = stmt.getAsObject();
        stmt.free();
        
        if (!user || !user.id) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const scores = parseJsonSafely(user.scores);
        scores.push(score);
        
        const updateStmt = db.prepare('UPDATE users SET scores = ? WHERE id = ?');
        updateStmt.run([JSON.stringify(scores), req.params.id]);
        updateStmt.free();
        
        saveDb();
        
        res.json({ success: true });
    } catch (err) {
        console.error('Score error:', err);
        res.status(500).json({ error: err.message || 'Failed to save score' });
    }
});

app.get('/api/plan/:score', (req, res) => {
    if (!dbReady) {
        return res.status(503).json({ error: 'Database not ready' });
    }
    
    try {
        const score = parseInt(req.params.score);
        
        if (isNaN(score)) {
            return res.status(400).json({ error: 'Invalid score' });
        }
        
        const level = score >= 10 ? 'high' : score >= 5 ? 'moderate' : 'low';
        
        // Get all wellness activities
        const stmt = db.prepare('SELECT * FROM ra_wellness');
        const allActivities = queryToObjects(stmt);
        stmt.free();
        
        // Filter activities that match the level or include 'all'
        const recommendations = allActivities.filter(activity => {
            const priorities = parseJsonSafely(activity.priority);
            return priorities.includes(level) || priorities.includes('all');
        }).slice(0, 3);
        
        res.json({
            recommendations: recommendations.map(a => ({
                ...a,
                priority: parseJsonSafely(a.priority)
            })),
            fullTable: raWellness.map(a => ({
                ...a,
                priority: parseJsonSafely(a.priority)
            })),
            level: level,
            score: score
        });
    } catch (err) {
        console.error('Plan error:', err);
        res.status(500).json({ error: err.message || 'Failed to get plan' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'BMW API is running',
        database: 'SQLite (sql.js)',
        platform: os.platform(),
        dbReady: dbReady
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🌟 BMW live on http://localhost:${port}`);
    console.log(`📊 Database: SQLite (${dbPath})`);
    console.log(`🖥️  Platform: ${os.platform()}`);
    console.log(`✅ Ready to use! No database setup required.`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (db) {
        saveDb();
        db.close();
    }
    console.log('\n👋 Database closed. Goodbye!');
    process.exit(0);
});

module.exports = app;
