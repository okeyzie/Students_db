const express = require("express");
const PORT = 6000;
const uuid = require("uuid").v4;
const mysql = require("mysql2");

const app = express();
app.use(express.json());

// DATABASE CONNECTION
const database = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "codeblock_camp"
});

database.connect((error) => {
  if (error) {
    console.log("Error connecting to database", error.message);
  } else {
    console.log("Database connected successfully");
  }
});

// CREATE STUDENTS TABLE
database.query(
  `CREATE TABLE IF NOT EXISTS students(
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    stack ENUM('frontend','backend','fullstack') NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
  )`,
  (error) => {
    if (error) {
      console.log("Error creating students table", error.message);
    } else {
      console.log("Students table ready");
    }
  }
);

// CREATE SCORES TABLE
database.query(
  `CREATE TABLE IF NOT EXISTS scores(
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    student_id VARCHAR(255),
    punctuality_score INT NOT NULL,
    assignment_score INT NOT NULL,
    total_score INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  )`,
  (error) => {
    if (error) {
      console.log("Error creating scores table", error.message);
    } else {
      console.log("Scores table ready");
    }
  }
);

// Add a student
app.post("/student", (req, res) => {
  const { full_name, stack, email } = req.body;

  database.query(`INSERT INTO students(id, full_name, stack, email) VALUES (?,?,?,?)`, 
  [uuid(), full_name, stack, email], (error, data) => {
    if (error) {
      res.status(500).json({ message: "Error creating student", error: err.message });
    } else {
      res.status(200).json({
        message: "Student created successfully",
        data: data,
      });
    }
  });
});

// Get all students
app.get("/students", (req, res) => {
  database.query(`SELECT * FROM students`, (error, data) => {
    if (err) {
      res.status(500).json({ message: "Error getting all students", error: err.message });
    } else {
      res.status(200).json({
        message: "All students",
        data: data,
      });
    }
  });
});

// Get a single student by ID
app.get("/student/:id", (req, res) => {
  const { id } = req.params;

  database.query('SELECT * FROM students WHERE id = ?', [id], (error, row) => {
    if (error) {
      res.status(500).json({ message: "Error fetching student", error: err.message });
    } else if (row.length === 0) {
      res.status(404).json({ message: `Student with ID: ${id} not found `});
    } else {
      res.status(200).json({ message: "Student found", data: row[0] });
    }
  });
});

// Update a student's stack
app.put("/student/:id", (req, res) => {
  const { id } = req.params;
  const { stack, email, full_name } = req.body;

  database.query(`UPDATE students SET stack = ?, email = ?, full_name = ? WHERE id = ?`, 
  [stack, email, full_name, id], (error, row) => {
    if (error) {
      res.status(500).json({ message: "Error updating student", error: err.message });
    } else if (row.affectedRows === 0) {
      res.status(404).json({ message: `Student with ID: ${id} not found `});
    } else {
      res.status(200).json({ message: "Student updated successfully" });
    }
  });
});

// Delete a student
app.delete("/student/:id", (req, res) => {
  const { id } = req.params;

  database.query('DELETE FROM students WHERE id = ?', [id], (error, result) => {
    if (error) {
      res.status(500).json({ message: "Error deleting student", error: err.message });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: `Student with ID: ${id} not found` });
    } else {
      res.status(200).json({ message: "Student deleted successfully" });
    }
  });
});

database.query(
  "ALTER TABLE scores DROP FOREIGN KEY scores_ibfk_1",
  (error, result) => {
    if (error) {
      console.error("Error dropping foreign key:", error.message);
    } else {
      console.log("Foreign key dropped successfully:", result);
    }
  }
);


// Add a score
app.post("/score", (req, res) => {
  const { student_id, punctuality_score, assignment_score } = req.body;
  const total_score = punctuality_score + assignment_score;

  database.query(
    `INSERT INTO scores(id, student_id, punctuality_score, assignment_score, total_score) VALUES (?,?,?,?,?)`,
    [uuid(), student_id, punctuality_score, assignment_score, total_score],
    (err, data) => {
      if (err) {
        res.status(500).json({ message: "Error inserting score", error: err.message });
      } else {
        res.status(200).json({ message: "Score inserted successfully", data });
      }
    }
  );
});

// Get all scores
app.get("/scores", (req, res) => {
  database.query('SELECT * FROM scores', (error, data) => {
    if (error) {
      res.status(500).json({ message: "Error fetching scores", error: err.message });
    } else {
      res.status(200).json({ message: "All scores", data });
    }
  });
});

// LEFT JOIN
app.get("/students-scores", (req, res) => {
  database.query(
    `SELECT students.full_name, students.stack, students.email, scores.punctuality_score, scores.assignment_score, scores.total_score 
     FROM students 
     LEFT JOIN scores ON students.id = scores.student_id`,
    (error, data) => {
      if (error) {
        res.status(500).json({ message: "Error performing LEFT JOIN", error: error.message });
      } else {
        res.status(200).json({ message: "Students with scores (LEFT JOIN)", data });
      }
    }
  );
});

// RIGHT JOIN
app.get("/scores-students", (req, res) => {
  database.query(
    `SELECT students.full_name, students.stack, students.email, scores.punctuality_score, scores.assignment_score, scores.total_score 
     FROM students 
     RIGHT JOIN scores ON students.id = scores.student_id`,
    (error, data) => {
      if (error) {
        res.status(500).json({ message: "Error performing RIGHT JOIN", error: error.message });
      } else {
        res.status(200).json({ message: "Scores with students (RIGHT JOIN)", data });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT}`);
});