// /netlify/functions/user/dashboard.js

const pool = require('../../_lib/database'); // Navigate up to the shared DB connection
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async function(event) {
    // This is a protected endpoint, so we only accept GET requests.
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    // --- Authentication Block ---
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Authorization header is missing or invalid.' }) };
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Invalid or expired token.' }) };
    }
    // --- End Authentication Block ---

    try {
        // The user object is extracted directly from the verified token
        const user = {
            email: decoded.user.email,
            role: decoded.user.role,
            first_name: decoded.user.name
        };

        // --- Database Query ---
        // This query fetches all tools. `has_access` is always true because
        // in the new model, all logged-in users can access all non-custom tools.
        // We also fetch category information for better organization on the frontend.
        const toolsQuery = `
            SELECT 
                t.id, t.name, t.description, t.url, t.type,
                COALESCE(tc.name, 'General Tools') AS category_name,
                true AS has_access
            FROM tools t
            LEFT JOIN tool_categories tc ON t.category_id = tc.id
            WHERE t.type IN ('free', 'pro')
            ORDER BY COALESCE(tc.id, 999), t.name;
        `;
        
        const toolsResult = await pool.query(toolsQuery);
        
        // Return both the user information and the list of tools they can access.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: user, tools: toolsResult.rows })
        };

    } catch (err) {
        console.error('Dashboard data fetch error:', err);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ message: 'Server error fetching dashboard data.' }) 
        };
    }
};
