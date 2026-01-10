import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Your email address is required"],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    username: {
        type: String,
        required: [true, "Your username is required"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "Your password is required"],
        minlength: [8, 'Password must be at least 8 characters']
    },
}, {
    timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Hash du mot de passe avant la sauvegarde
userSchema.pre("save", async function (next) {
    // Ne hasher que si le mot de passe a été modifié
    if (!this.isModified("password")) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Ne jamais retourner les mots de passe dans les requêtes JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export const User =  mongoose.model('User', userSchema);
