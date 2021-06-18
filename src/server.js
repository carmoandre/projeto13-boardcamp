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

const rentalsSchema = joi.object({
    customerId: joi.number(),
    gameId: joi.number(),
    daysRented: joi.number().greater(0),
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

/* Rentals Routes*/
server.get("/rentals", async (req, res) => {
    const { customerId, gameId } = req.query;
    let selectionAttachment = "";
    const selectParams = [];
    if (customerId) {
        selectParams.push(customerId);
        selectionAttachment = `WHERE rentals."customerId"=$1`;
    }
    if (gameId) {
        selectParams.push(gameId);
        selectionAttachment = `WHERE rentals."gameId"=$1`;
    }
    if (selectParams.length === 2) {
        selectionAttachment = `WHERE rentals."customerId"=$1 AND rentals."gameId"=$2`;
    }

    try {
        const rentals = await connection.query(
            `SELECT rentals.*, 
            jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
            jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game            
            FROM rentals 
            JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON categories.id = games."categoryId"
            ${selectionAttachment}
            ORDER BY id`,
            selectParams
        );
        res.send(rentals.rows);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

server.post("/rentals", async (req, res) => {
    const validation = rentalsSchema.validate(req.body);
    const { customerId, gameId, daysRented } = req.body;
    const existentCustomer = await connection.query(
        `SELECT * FROM customers WHERE id=$1`,
        [customerId]
    );

    const existentGame = await connection.query(
        `SELECT * FROM games WHERE id=$1`,
        [gameId]
    );

    const existentRentals = await connection.query(
        `SELECT * FROM rentals WHERE "gameId"=$1 AND "returnDate" IS NULL`,
        [gameId]
    );

    if (
        validation.error ||
        !existentCustomer.rows.length ||
        !existentGame.rows.length ||
        existentRentals.rows.length >= existentGame.rows[0].stockTotal
    ) {
        res.sendStatus(400);
        return;
    }

    try {
        await connection.query(
            `INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                customerId,
                gameId,
                "NOW()",
                daysRented,
                null,
                daysRented * existentGame.rows[0].pricePerDay,
                null,
            ]
        );
        res.sendStatus(201);
    } catch (err) {
        console.log(err);
        res.status(400).send("Erro ao tentar criar o registro de aluguel");
    }
});

server.post("/rentals/:id/return", async (req, res) => {
    const { id } = req.params;
    const existentRental = await connection.query(
        `SELECT * FROM rentals WHERE id=$1`,
        [id]
    );

    if (!existentRental.rows.length) {
        res.status(404).send("Não foi encontrado um aluguel com esse ID");
        return;
    }

    if (existentRental.rows[0].returnDate !== null) {
        res.status(400).send("Aluguel já finalizado");
        return;
    }
    const game = await connection.query(`SELECT * FROM games WHERE id=$1`, [
        existentRental.rows[0].gameId,
    ]);

    const delayDaysTimestamp =
        (Date.now() - Date.parse(existentRental.rows[0].rentDate)) /
        (1000 * 3600 * 24);
    const delayFee = Math.floor(delayDaysTimestamp) * game.rows[0].pricePerDay;

    try {
        await connection.query(
            `UPDATE rentals SET "returnDate"=$1, "delayFee"=$2 WHERE id=$3`,
            ["NOW()", delayFee, id]
        );
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
});

server.delete("/rentals/:id", async (req, res) => {
    const { id } = req.params;
    const existentRental = await connection.query(
        `SELECT * FROM rentals WHERE id=$1`,
        [id]
    );
    if (!existentRental.rows.length) {
        res.sendStatus(404);
        return;
    }
    if (existentRental.rows.returnDate) {
        res.status(400).send(
            "O registro de aluguel não pode ser excluído pois já foi finalizado"
        );
        return;
    }
    try {
        connection.query(`DELETE FROM rentals WHERE id=$1`, [id]);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(400).send("Erro ao tentar excluir o registro de aluguel");
    }
});

server.listen(4000, () => {
    console.log("Server listening on port 4000.");
});
