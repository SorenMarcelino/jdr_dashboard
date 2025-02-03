import express from "express";
// Help to connect to the database
import db from "../db/connection.mjs";
// Help to convert the id from string to ObjectId for the _id
import { ObjectId } from "mongodb";

const router = express.Router();

// Get the list of all Users
router.get("/users", async (req, res) => {
    let collection = await db.collection("users");
    let results = await collection.find({}).toArray();

    res.status(200).send(results);
});

export default router;