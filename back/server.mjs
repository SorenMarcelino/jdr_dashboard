import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import cookieParser from 'cookie-parser';
import authRoute from './routes/AuthRoute.mjs';
import dotenv from 'dotenv';
dotenv.config();
import api from "./routes/api.mjs";

const app = express();
const { MONGODB_URI, PORT } = process.env;

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: ["http://localhost:3000", "http://192.168.1.154:3000", "http://192.168.1.112:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "x-Requested-With", "Accept"]
    })
);
app.use((req, res, next) => {
    console.log(`Requete recue: ${req.method} ${req.url}`);
    next();
});
app.use("/auth", authRoute);
app.use("/api", api);

mongoose
    .connect(MONGODB_URI, {
        dbName: 'jdr_dashboard',
    })
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is listening on port ${PORT}`);
            console.log("MongoDB is connected successfully");
        });
    })
    .catch((err) => console.error(err));

/*import './loadEnvironment.mjs'
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import api from "./routes/api.mjs";
import authRoute from "./routes/AuthRoute.mjs";

const PORT = process.env.PORT || 5050;
const app = express();

app.get("/", (req, res) => {
    res.send("API is running");
});

app.use("/api", api);

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

app.use(
    cors({
        origin: ["http://localhost:5050"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

app.use(cookieParser());

app.use(express.json());

app.use("/", authRoute);*/
