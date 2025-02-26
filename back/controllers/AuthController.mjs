import  { User } from '../models/UserModel.mjs';
import { createSecretToken } from '../utils/SecretToken.mjs';

import bcrypt from 'bcryptjs';

export const Signup = async (req, res, next) => {
    try {
        console.log(req.body);
        const { email, password, username, createdAt } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({ message: "User already exist" });
        }

        const user = await User.create({ email, password, username, createdAt });
        console.log(user);
        console.log(user._id);
        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false
        });
        res.status(201)
            .json({ message: "User signed in successfully", success: true });
        next();
    } catch (error) {
        console.error(error);
    }
}

export const Login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if(!user) {
            return res.status(404).json({ message: "Incorrect password or email" });
        }

        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
            return res.json({ message: "Incorrect password or email" });
        }

        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });
        res.status(201).json({ message: "User logged in successfully", success: true, user: user.username });
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", success: false });
    }
}
