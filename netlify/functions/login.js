// /netlify/functions/login.js

const pool = require('./_lib/database'); // The shared database connection
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// The JWT secret should be stored as an environment variable in Netlify for security.
// It's a key used to sign the tokens.
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
    // Only allow POST requests for logging in
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ message: 'Method Not Allowed' }) 
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        // Ensure both email and password are provided
        if (!email || !password) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ message: 'Email and password are required.' }) 
            };
        }

        // Find the user in the database by their email address
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const userResult = await pool.query(userQuery, [email.toLowerCase()]);

        // If no user is found with that email, return a generic "Invalid credentials" error.
        // We don't want to reveal whether the email exists or not.
        if (userResult.rows.length === 0) {
            return { 
                statusCode: 401, 
                body: JSON.stringify({ message: 'Invalid credentials.' }) 
            };
        }

        const user = userResult.rows[0];

        // Securely compare the provided password with the stored hash from the database
        const isMatch = await bcrypt.compare(password, user.password_hash);

        // If the passwords don't match, return the same generic error
        if (!isMatch) {
            return { 
                statusCode: 401, 
                body: JSON.stringify({ message: 'Invalid credentials.' }) 
            };
        }

        // --- If credentials are correct, create a JWT ---
        // The payload contains the data we want to store in the token.
        // This is public information (base64 encoded), so don't put secrets here.
        const tokenPayload = {
            user: {
                email: user.email,
                role: user.role, // The user's role (e.g., 'user' or 'admin')
                name: user.first_name // User's first name for a personalized greeting
            }
        };

        // Sign the token with our secret key and set it to expire in 1 day.
        const token = jwt.sign(
            tokenPayload,
            JWT_SECRET,
            { expiresIn: '1d' } // '1d' = 1 day, '7d' = 7 days, '1h' = 1 hour
        );
        
        // Return a success message and the token to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Login successful.',
                token: token
            })
        };

    } catch (error) {
        console.error('Login Error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ message: 'Internal Server Error' }) 
        };
    }
};
