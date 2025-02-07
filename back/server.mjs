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

mongoose
    .connect(MONGODB_URI, {
        dbName: 'jdr_dashboard',
    })
    .then(() => console.log("MongoDB is connected successfully"))
    .catch((err) => console.error(err));

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})

app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

app.use(cookieParser());

app.use(express.json());

app.use("/", authRoute);

app.get("/", (req, res) => {
    res.send("API is running");
});
app.use("/api", api);

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
