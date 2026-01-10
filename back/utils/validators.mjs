import validator from 'validator';

export const validateEmail = (email) => {
    return validator.isEmail(email);
};

export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return {
            isValid: false,
            message: `Password must be at least ${minLength} characters long`
        };
    }

    if (!hasUpperCase) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter'
        };
    }

    if (!hasLowerCase) {
        return {
            isValid: false,
            message: 'Password must contain at least one lowercase letter'
        };
    }

    if (!hasNumbers) {
        return {
            isValid: false,
            message: 'Password must contain at least one number'
        };
    }

    if (!hasSpecialChar) {
        return {
            isValid: false,
            message: 'Password must contain at least one special character'
        };
    }

    return {
        isValid: true,
        message: 'Password is valid'
    };
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    // Supprime les balises HTML et les scripts
    return validator.escape(input.trim());
};