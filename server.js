// server.js - Node.js/Express Backend with SQLite

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

app.use(express.static(path.join(__dirname, 'public')));

app.use(cors()); 
app.use(express.json());

// --- Database Setup (SQLite) ---
const db = new sqlite3.Database('./student_registration.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idNo TEXT UNIQUE NOT NULL,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            course TEXT NOT NULL,
            level TEXT NOT NULL
        )`, (createErr) => {
            if (createErr) {
                console.error('Error creating table:', createErr.message);
            } else {
                console.log('Students table is ready.');
            }
        });
    }
});

// --- API Routes ---

app.get('/api/students', (req, res) => {

    const sql = 'SELECT idNo, firstName, lastName, course, level FROM students ORDER BY lastName, firstName'; 
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, error: 'Database error fetching students.' });
        }
        res.json({ success: true, students: rows }); 
    });
});

app.post('/api/students', (req, res) => {
    const { studentId, firstName, lastName, course, yearLevel } = req.body;

    if (!studentId || !firstName || !lastName || !course || !yearLevel) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const sql = `INSERT INTO students (idNo, firstName, lastName, course, level)
                 VALUES (?, ?, ?, ?, ?)`;
    
    const params = [studentId, firstName, lastName, course, yearLevel];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Database insertion error:', err.message);
            if (err.message.includes('UNIQUE constraint failed: students.idNo')) {
                return res.status(409).json({ success: false, error: 'Student ID No. already registered.' });
            }
            return res.status(500).json({ success: false, error: 'Failed to register student.' });
        }
        res.status(201).json({ 
            success: true, 
            message: 'Student registered successfully!',
            data: { id: this.lastID, studentId, lastName }
        });
    });
});

app.put('/api/students/:idNo', (req, res) => {
    const targetIdNo = req.params.idNo;
    const { firstName, lastName, course, yearLevel } = req.body;

    if (!firstName || !lastName || !course || !yearLevel) {
        return res.status(400).json({ success: false, error: 'All fields are required for update.' });
    }

    const sql = `UPDATE students 
                 SET firstName = ?, lastName = ?, course = ?, level = ?
                 WHERE idNo = ?`;
    
    const params = [firstName, lastName, course, yearLevel, targetIdNo];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Database update error:', err.message);
            return res.status(500).json({ success: false, error: 'Failed to update student.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'Student not found.' });
        }
        res.json({ success: true, message: 'Student updated successfully!' });
    });
});

app.delete('/api/students/:idNo', (req, res) => {
    const idNoToDelete = req.params.idNo;

    const sql = `DELETE FROM students WHERE idNo = ?`;

    db.run(sql, idNoToDelete, function (err) {
        if (err) {
            console.error('Database deletion error:', err.message);
            return res.status(500).json({ success: false, error: 'Failed to delete student.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'Student not found.' });
        }
        res.json({ success: true, message: 'Student deleted successfully!' });
    });
});


// --- Start Server ---
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running.`);
    console.log(`Access the application at: http://localhost:${port}/index.html`); 
});