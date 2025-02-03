import './loadEnvironment.mjs'
import express from "express";
import cors from "cors";
import api from "./routes/api.mjs";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running");
});

app.use("/api", api);

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

/*const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const authMiddleware = require('./middlewares/auth');

// Load environment variables
const loadEnvironment = require('./loadEnvironment.mjs');

app.prepare().then(() => {
    const server = express();
    const router = express.Router();

    // Routes Express custom
    server.get('/api/hello', (req, res) => {
        res.json({message: 'Hello World!'});
    });

    router.post('/login', authMiddleware, async (req, res) => {
        try {
            const user = await User.findOne({ email: req.body.mail });
            if (!user) {
                return res.status(401).json({ message: 'Authentification Failed' });
            }

            const isValidPassword = await bcrypt.compare(req.body.password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid Password' });
            }

            const token = jwt.sign({ userId: user._id }, 'CLE_SECRETE', { expiresIn: '1h' });

            res.status(200).json({ token, userId: user._id });
        } catch (error) {
            res.status(500).json({ error });
        }
    });

    module.exports = app;

    // Gestion des routes Next.js
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(3000, (err) => {
        if (err) throw err;
        console.log('> Ready on http://localhost:3000');
    })
})*/