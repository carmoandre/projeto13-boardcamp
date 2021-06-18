import express from "express";
import cors from "cors";
import pg from "pg";
import joi from "joi";

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

const categoriesSchema = joi.object({
    name: joi.string().required(),
});

const gamesSchema = joi.object({
    name: joi.string().required(),
    image: joi.string(),
    stockTotal: joi.number().greater(0),
    categoryId: joi.number(),
    pricePerDay: joi.number().greater(0),
});

const customersSchema = joi.object({
    name: joi.string().required(),
    cpf: joi.string().required().length(11),
    phone: joi.string().required().min(10).max(11),
    birthday: joi.date().less("now"),
});

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
    const validation = categoriesSchema.validate(req.body);
    if (validation.error) {
        res.sendStatus(400);
        return;
    }
    const { name } = req.body;
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
/*
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
*/

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
    const validation = gamesSchema.validate(req.body);
    console.log(validation);
    const existentCategory = await connection.query(
        `SELECT * FROM games WHERE id=$1`,
        [req.body.categoryId]
    );
    if (validation.error || !existentCategory.rows.length) {
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
    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
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

/* Customers Routes*/
server.get("/customers", async (req, res) => {
    const { cpf } = req.query;
    const where = cpf ? `${cpf}%` : "%";
    try {
        const customers = await connection.query(
            `SELECT * FROM customers WHERE cpf ILIKE $1`,
            [where]
        );
        res.send(customers.rows);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

server.get("/customers/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const customers = await connection.query(
            `SELECT * FROM customers WHERE id=$1`,
            [id]
        );
        if (customers.rows.length) {
            res.send(customers.rows[0]);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

server.post("/customers", async (req, res) => {
    const validation = customersSchema.validate(req.body);
    console.log(validation);
    if (validation.error) {
        res.sendStatus(400);
        return;
    }
    const existentCustomer = await connection.query(
        `SELECT * FROM customers WHERE cpf=$1`,
        [req.body.cpf]
    );

    if (existentCustomer.rows.length) {
        res.sendStatus(409);
        return;
    }
    const { name, phone, cpf, birthday } = req.body;
    try {
        await connection.query(
            `INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)`,
            [name, phone, cpf, birthday]
        );
        res.sendStatus(201);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

server.put("/customers/:id", async (req, res) => {
    const { id } = req.params;
    const validation = customersSchema.validate(req.body);
    if (validation.error) {
        res.sendStatus(400);
        return;
    }
    const existentCustomer = await connection.query(
        `SELECT * FROM customers WHERE cpf=$1 AND NOT id=$2`,
        [req.body.cpf, id]
    );

    if (existentCustomer.rows.length) {
        res.sendStatus(409);
        return;
    }
    const { name, phone, cpf, birthday } = req.body;
    try {
        await connection.query(
            `UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5`,
            [name, phone, cpf, birthday, id]
        );
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});
/*
server.delete("/customers/:id", async (req, res) => {
    const { id } = req.params;
    try {
        connection.query(`DELETE FROM customers WHERE id=$1`, [id]);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});
*/

server.listen(4000, () => {
    console.log("Server listening on port 4000.");
});
