const mongoose= require('mongoose')

const userSchema = new mongoose.Schema({
    mail: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    passwword: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;