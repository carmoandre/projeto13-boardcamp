import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const connection = new Pool({
    user: "bootcamp_role",
    password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
    host: "localhost",
    port: 5432,
    database: "boardcamp",
});

const server = express();
server.use(cors());
server.use(express.json());

/* Categories Routes*/
server.get("/categories", async (req, res) => {
    try {
        const categories = await connection.query(`SELECT * FROM categories`);
        res.send(categories.rows);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

server.post("/categories", async (req, res) => {
    const { name } = req.body;
    if (!name) {
        res.sendStatus(400);
        return;
    }
    const exists = await connection.query(
        `SELECT * FROM categories WHERE name=$1`,
        [name]
    );

    if (exists.rows.length) {
        res.sendStatus(409);
        return;
    }
    try {
        await connection.query(`INSERT INTO categories (name) VALUES ($1)`, [
            name,
        ]);
        res.sendStatus(201);
    } catch {
        console.log(err);
        res.sendStatus(400);
    }
});

server.delete("/categories/:id", async (req, res) => {
    const { id } = req.params;
    try {
        connection.query(`DELETE FROM categories WHERE id=$1`, [id]);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

/* Games Routes*/
server.get("/games", async (req, res) => {
    const { name } = req.query;
    const where = name ? `${name}%` : "%";
    try {
        const games = await connection.query(
            `SELECT * FROM games WHERE name ILIKE $1`,
            [where]
        );
        res.send(games.rows);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

server.post("/games", async (req, res) => {
    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
    const existentCategory = await connection.query(
        `SELECT * FROM games WHERE id=$1`,
        [categoryId]
    );
    console.log(existentCategory);
    if (
        !name ||
        stockTotal <= 0 ||
        pricePerDay <= 0 ||
        !existentCategory.rows.length
    ) {
        res.sendStatus(400);
        return;
    }
    const existentGame = await connection.query(
        `SELECT * FROM games WHERE name=$1`,
        [name]
    );

    if (existentGame.rows.length) {
        res.sendStatus(409);
        return;
    }
    try {
        await connection.query(
            `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)`,
            [name, image, stockTotal, categoryId, pricePerDay]
        );
        res.sendStatus(201);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

server.listen(4000, () => {
    console.log("Server listening on port 4000.");
});
