const mysql = require("mysql2");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: process.env.DB_SSL_CA,
        rejectUnauthorized: true,
    },
});

const app = express();

app.use(cors());
app.use(express.json());

app.post("/setquestions", (req, res) => {
    const { subject, question, hint, answer, explanation } = req.body;
    console.log(explanation);

    const color = req.body.color || "#FF0000";

    const insertQuery = `
        INSERT INTO questions (subject, question, hint, answer, explanation, color)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(
        insertQuery,
        [subject, question, hint, answer, explanation, color],
        (err, results, fields) => {
            if (err) {
                console.error("Error inserting data:", err.stack);
                res.status(500).json({ error: "Failed to insert data" });
            } else {
                console.log(
                    "Data inserted successfully, ID:",
                    results.insertId
                );
                res.status(200).json({ message: "Data inserted successfully" });
            }
        }
    );
});

app.post("/getquestions", (req, res) => {
    const subject = req.body.subject;

    const selectQuery = `
        SELECT * FROM questions WHERE subject = ?
    `;

    connection.query(selectQuery, [subject], (err, results, fields) => {
        if (err) {
            console.error("Error retrieving data:", err.stack);
            res.status(500).json({ error: "Failed to retrieve data" });
        } else {
            console.log("Data retrieved successfully");
            res.status(200).json(results);
        }
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running on port " + process.env.PORT || 3000);
});
