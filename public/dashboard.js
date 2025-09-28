// /public/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Gatekeeper ---
    // If the user is not logged in, redirect them to the homepage.
    if (!isLoggedIn()) {
        window.location.href = '/';
        return; 
    }

    const userInfoContainer = document.getElementById('user-info');
    const toolGrid = document.getElementById('tool-access-grid');
    const adminLinkContainer = document.getElementById('admin-link-container');

    /**
     * Fetches data from the dashboard API and renders the page content.
     */
    const renderDashboard = async () => {
        try {
            // Call the protected API endpoint. The apiRequest function from auth.js
            // will automatically include the Authorization header.
            const data = await apiRequest('user/dashboard');
            
            // --- Render User Information ---
            userInfoContainer.innerHTML = `
                <h1 class="text-4xl font-bold text-gray-900">Welcome, ${data.user.first_name}!</h1>
                <p class="mt-2 text-lg text-gray-600">Your account is ready. Select a tool below to get started.</p>
            `;

            // If the user is an admin, show a link to the admin panel.
            if (data.user.role === 'admin') {
                adminLinkContainer.innerHTML = `<a href="/admin.html" class="text-red-600 hover:text-red-800 font-bold">Admin Panel</a>`;
            }

            // --- Render Tool Grid ---
            toolGrid.innerHTML = ''; // Clear the loading message
            if (data.tools && data.tools.length > 0) {
                // Group tools by their category name for better organization
                const categories = {};
                data.tools.forEach(tool => {
                    const category = tool.category_name || 'General Tools';
                    if (!categories[category]) {
                        categories[category] = [];
                    }
                    categories[category].push(tool);
                });

                // Render each category section
                Object.keys(categories).sort().forEach(categoryName => {
                    // Add a title for the category
                    const categoryHtml = `
                        <div class="col-span-full">
                            <h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-3 mb-6">${categoryName}</h2>
                        </div>
                    `;
                    toolGrid.insertAdjacentHTML('beforeend', categoryHtml);
                    
                    // Add the tool cards for that category
                    categories[categoryName].forEach(tool => {
                         const toolCard = createToolCard(tool);
                         toolGrid.insertAdjacentHTML('beforeend', toolCard);
                    });
                });

            } else {
                toolGrid.innerHTML = '<p class="text-gray-600 col-span-full">No tools are currently available. Please check back later.</p>';
            }

        } catch (error) {
            userInfoContainer.innerHTML = `
                <h1 class="text-4xl font-bold text-red-600">Error Loading Dashboard</h1>
                <p class="mt-2 text-lg text-gray-600">Your session may have expired. Please try logging out and logging back in.</p>
            `;
            console.error("Dashboard load error:", error);
        }
    };

    /**
     * Creates the HTML for a single tool card.
     * @param {object} tool - The tool object from the API.
     * @returns {string} - The HTML string for the tool card.
     */
    function createToolCard(tool) {
        // Since all tools are free for logged-in users, the card is always a clickable link.
        const description = tool.description || 'A powerful tool to enhance your workflow.';
        
        return `
            <a href="${tool.url}" class="tool-card bg-white rounded-xl shadow-md p-6 flex flex-col no-underline hover:no-underline">
                <div class="flex-grow">
                    <h3 class="text-2xl font-bold text-gray-900">${tool.name}</h3>
                    <p class="mt-4 text-gray-600">${description}</p>
                </div>
                <div class="mt-6">
                    <div class="block text-center w-full bg-indigo-600 text-white font-semibold rounded-lg py-3 px-6 hover:bg-indigo-700">
                        Launch Tool
                    </div>
                </div>
            </a>
        `;
    }

    // Initial call to render the dashboard when the page loads
    renderDashboard();
});
