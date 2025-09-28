// /netlify/functions/signup.js

const pool = require('./_lib/database'); // The shared database connection
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
    // We only want to handle POST requests for signups
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        const { email, password, firstName, lastName, company } = JSON.parse(event.body);

        // Basic validation for required fields
        if (!email || !password || !firstName || !lastName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields: email, password, firstName, lastName.' })
            };
        }

        // Hash the password for security. The '10' is the salt round count.
        const password_hash = await bcrypt.hash(password, 10);

        // Prepare the SQL query to insert the new user.
        // We set the role to 'user' by default for everyone who signs up.
        // The RETURNING clause is useful to get back the created user's data.
        const query = `
            INSERT INTO users (email, password_hash, first_name, last_name, company, role)
            VALUES ($1, $2, $3, $4, $5, 'user')
            RETURNING email, first_name, last_name, created_at;
        `;
        
        // Execute the query using the shared pool
        const result = await pool.query(query, [email, password_hash, firstName, lastName, company || null]);
        
        // If successful, return a 201 Created status
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'User created successfully.',
                user: result.rows[0]
            })
        };

    } catch (error) {
        // Handle the specific error for a duplicate email (unique constraint violation)
        if (error.code === '23505') { 
            return {
                statusCode: 409, // 409 Conflict is the correct code for a duplicate resource
                body: JSON.stringify({ message: 'A user with this email already exists.' })
            };
        }
        
        // For any other errors, log them and return a generic server error
        console.error('Signup Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
