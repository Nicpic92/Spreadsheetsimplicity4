// /public/app.js

document.addEventListener('DOMContentLoaded', () => {
    /**
     * Finds placeholder elements on the page (like #header-placeholder) and
     * loads HTML content into them from a specified URL. This allows for
     * reusable headers, footers, etc.
     * @param {string} selector - The CSS selector for the placeholder element.
     * @param {string} url - The URL of the HTML partial to load.
     */
    const loadHTML = async (selector, url) => {
        const element = document.querySelector(selector);
        if (!element) {
            // Don't run if the placeholder doesn't exist on the current page.
            return;
        }
        try {
            const response = await fetch(url);
            if (response.ok) {
                element.innerHTML = await response.text();
                
                // --- CRITICAL STEP ---
                // After the header's HTML is injected, we MUST re-initialize 
                // its interactive elements (like login buttons and the mobile menu).
                // This function is defined in auth.js.
                if (selector === '#header-placeholder') {
                    if (typeof initializeAuthUI === 'function') {
                        initializeAuthUI();
                    }
                }
            } else {
                element.innerHTML = `<p class="text-red-500 text-center">Error: Could not load component from ${url}.</p>`;
            }
        } catch (error) {
            console.error(`Failed to load HTML from ${url}:`, error);
            element.innerHTML = `<p class="text-red-500 text-center">Error loading component.</p>`;
        }
    };

    // On every page that includes this script, it will attempt to load
    // the header and footer into their respective placeholders.
    loadHTML('#header-placeholder', '/_partials/header.html');
    loadHTML('#footer-placeholder', '/_partials/footer.html');
});
