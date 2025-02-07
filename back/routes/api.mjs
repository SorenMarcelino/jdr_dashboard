import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { User } from "../models/UserModel.mjs";
import bcrypt from "bcryptjs";

const router = express.Router();
router.use(express.json());
router.use(cors());

// Get the list of all Users
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({});
        console.log("users:", users);
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No record existed" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            return res.status(200).json({ message: "Successfully logged in" });
        } else {
            return res.status(401).json({ message: "The password is incorrect" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


export default router;