const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ================= STATIC FILES =================
// Serve everything normally from public
app.use(express.static(path.join(__dirname, "public")));

// ================= DATABASE =================
const db = new sqlite3.Database("attendance.db");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_code TEXT,
            name TEXT NOT NULL,
            section_id INTEGER
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            date TEXT,
            status TEXT,
            timestamp TEXT,
            UNIQUE(student_id, date)
        )
    `);
    
    db.run(`
    ALTER TABLE students ADD COLUMN reset_date TEXT
`, () => {});

});

// ================= SECTIONS =================
app.get("/sections", (req, res) => {
    db.all("SELECT * FROM sections", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.post("/sections", (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO sections (name) VALUES (?)", [name], function (err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID });
    });
});

// ================= STUDENTS =================
app.get("/students", (req, res) => {
    const { date, sectionId } = req.query;
    let sql = `
        SELECT s.id, s.name, a.status
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
    `;
    const params = [date];

    if (sectionId) {
        sql += " WHERE s.section_id = ?";
        params.push(sectionId);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.post("/students", (req, res) => {
    const { name, section_id } = req.body;
    db.run(
        "INSERT INTO students (name, section_id) VALUES (?, ?)",
        [name, section_id],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ id: this.lastID });
        }
    );
});

app.delete("/students/:id", (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM attendance WHERE student_id = ?", [id], () => {
        db.run("DELETE FROM students WHERE id = ?", [id], () => {
            res.sendStatus(200);
        });
    });
});

// ================= ATTENDANCE =================
app.post("/attendance", (req, res) => {
    const { student_id, date, status } = req.body;
    db.run(
        `
        INSERT INTO attendance (student_id, date, status, timestamp)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(student_id, date)
        DO UPDATE SET status = excluded.status, timestamp = excluded.timestamp
        `,
        [student_id, date, status, new Date().toISOString()],
        () => res.sendStatus(200)
    );
});

// ================= REPORT =================
app.get("/report", (req, res) => {
    const { startDate, sectionId } = req.query;

    let sql = `
        SELECT 
            s.id, 
            s.name,
            COUNT(CASE 
                WHEN a.status='Absent' 
                AND a.date >= COALESCE(s.reset_date, ?) 
                THEN 1 
            END) as absent_count,
            COUNT(CASE WHEN a.status='Absent' THEN 1 END) as total_absent
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
    `;

    const params = [startDate];

    if (sectionId) {
        sql += " WHERE s.section_id = ?";
        params.push(sectionId);
    }

    sql += " GROUP BY s.id";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});


// ================= RESET =================
app.post("/students/:id/reset", (req, res) => {
    const studentId = req.params.id;

    // Create tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const resetDate = tomorrow.toISOString().split("T")[0];

    db.run(
        `
        UPDATE students
        SET reset_date = ?
        WHERE id = ?
        `,
        [resetDate, studentId],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "7-day counter reset (report only)" });
        }
    );
});



// ================= START SERVER =================
app.listen(3000, () =>
    console.log("Server running on http://localhost:3000")
);
