// /netlify/functions/public-tools.js

const pool = require('./_lib/database'); // The shared database connection

exports.handler = async function(event) {
    // This is a public endpoint, so we only need to handle GET requests.
    // No authentication is required.
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        // This query fetches all non-custom tools and their categories,
        // just like the dashboard, so visitors can see the full offering.
        const query = `
            SELECT 
                t.name, t.description, t.url, t.type,
                COALESCE(tc.name, 'General Tools') as category_name,
                COALESCE(tc.id, 999) as category_id
            FROM tools t
            LEFT JOIN tool_categories tc ON t.category_id = tc.id
            WHERE t.type IN ('free', 'pro')
            ORDER BY category_id, t.name;
        `;
        
        const { rows } = await pool.query(query);

        // --- Group tools by category for a cleaner frontend display ---
        const categories = {};
        rows.forEach(tool => {
            // If we haven't seen this category ID before, create an entry for it.
            if (!categories[tool.category_id]) {
                categories[tool.category_id] = { 
                    category_name: tool.category_name, 
                    tools: [] 
                };
            }
            // Add the current tool to its corresponding category's tool list.
            categories[tool.category_id].tools.push({ 
                name: tool.name, 
                url: tool.url, 
                type: tool.type, 
                description: tool.description 
            });
        });
        
        // Convert the categories object into an array of its values for the final JSON response.
        return { 
            statusCode: 200, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(Object.values(categories)) 
        };

    } catch (err) {
        console.error('Public tools fetch error:', err);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ message: 'Server error fetching tools list.' }) 
        };
    }
};
