// /public/auth.js

// ==================================================================
//  1. GLOBAL HELPER FUNCTIONS
// ==================================================================

/**
 * Makes a request to a backend API endpoint.
 * It automatically includes the user's auth token if they are logged in.
 * @param {string} endpoint - The API endpoint (e.g., 'user/dashboard', 'admin/users').
 * @param {object|null} data - The JSON payload for POST/PUT requests.
 * @param {string} method - The HTTP method ('GET', 'POST', 'PUT', 'DELETE').
 * @returns {Promise<any>} - The JSON response from the server.
 */
async function apiRequest(endpoint, data = null, method = 'GET') {
    const options = {
        method,
        headers: { 
            'Content-Type': 'application/json'
        },
    };
    
    // If a user token exists in localStorage, add it to the Authorization header.
    const token = localStorage.getItem('user_token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && method.toUpperCase() !== 'GET') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`/api/${endpoint}`, options);

        if (response.status === 204) { // Handle "No Content" responses
            return null;
        }

        const responseData = await response.json();

        if (!response.ok) {
            // If the token is invalid, log the user out automatically
            if (response.status === 401) {
                logout();
            }
            throw new Error(responseData.message || `API request failed for endpoint: ${endpoint}`);
        }
        return responseData;
    } catch (error) {
        console.error(`API Request Error to ${endpoint}:`, error.message);
        throw error; // Re-throw to be handled by the calling function
    }
}

/**
 * Checks if a user token exists in local storage.
 * NOTE: This is a basic check and doesn't validate the token's expiration.
 * The backend is the source of truth for token validity.
 * @returns {boolean}
 */
function isLoggedIn() {
    return !!localStorage.getItem('user_token');
}

/**
 * Retrieves the user's role from local storage.
 * @returns {string|null} - 'user', 'admin', or null if not logged in.
 */
function getUserRole() {
    return localStorage.getItem('userRole');
}

/**
 * Logs the user out by clearing local storage and redirecting to the homepage.
 */
function logout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('userRole');
    window.location.href = '/'; // Redirect to homepage
}


// ==================================================================
//  2. AUTH MODAL & UI INITIALIZATION
// ==================================================================

/**
 * Opens the authentication modal.
 * @param {string} defaultView - 'login' or 'signup' to control which tab is shown first.
 */
function openAuthModal(defaultView = 'login') {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        // Reset any previous error messages
        const authMessage = document.getElementById('auth-message');
        if (authMessage) authMessage.textContent = '';
        
        // Show the correct tab
        showAuthTab(defaultView);
        
        authModal.style.display = 'block';
    }
}

/**
 * A helper function to switch between the login and signup tabs in the modal.
 * @param {string} viewToShow - 'login' or 'signup'.
 */
function showAuthTab(viewToShow) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab-button');
    const signupTab = document.getElementById('signup-tab-button');

    if (viewToShow === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginTab.classList.remove('border-indigo-500', 'text-indigo-600');
        loginTab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        signupTab.classList.add('border-indigo-500', 'text-indigo-600');
        signupTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    } else { // Default to login
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        signupTab.classList.remove('border-indigo-500', 'text-indigo-600');
        signupTab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        loginTab.classList.add('border-indigo-500', 'text-indigo-600');
        loginTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    }
}


/**
 * Initializes all authentication-related UI elements on the page, like header buttons.
 * This should be called after the header is loaded onto the page.
 */
function initializeAuthUI() {
    const navAuthSection = document.getElementById('nav-auth-section');
    const mobileNavAuthSection = document.getElementById('mobile-nav-auth-section');
    
    if (isLoggedIn()) {
        // If logged in, show Dashboard/Logout buttons
        const loggedInLinks = `<a href="/dashboard.html" class="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">Dashboard</a>`;
        if (navAuthSection) navAuthSection.innerHTML = loggedInLinks;
        
        const mobileLoggedInLinks = `<a href="/dashboard.html" class="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100">Dashboard</a>`;
        if (mobileNavAuthSection) mobileNavAuthSection.innerHTML = mobileLoggedInLinks;

    } else {
        // If logged out, show the "Log In / Sign Up" button
        const loggedOutButton = `<button id="login-modal-button" class="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-300">Log In / Sign Up</button>`;
        if (navAuthSection) navAuthSection.innerHTML = loggedOutButton;
        
        const mobileLoggedOutButton = `<button id="mobile-login-modal-button" class="w-full text-left py-2 px-4 text-sm text-gray-700 hover:bg-gray-100">Log In / Sign Up</button>`;
        if (mobileNavAuthSection) mobileNavAuthSection.innerHTML = mobileLoggedOutButton;
    }
    
    // --- Add Event Listeners ---
    // These listeners might be re-attached multiple times, which is safe.
    document.getElementById('login-modal-button')?.addEventListener('click', () => openAuthModal('login'));
    document.getElementById('mobile-login-modal-button')?.addEventListener('click', () => openAuthModal('login'));
    
    // Mobile menu toggle logic
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileMenuButton && mobileNav) {
        mobileMenuButton.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });
    }
}


// ==================================================================
//  3. DOM-SPECIFIC LOGIC (Runs once when the script loads)
// ==================================================================
document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('auth-modal');
    if (!authModal) return; // Don't run this code if the modal isn't on the page

    // --- Modal Controls ---
    const closeModalButton = document.getElementById('close-auth-modal-button');
    const loginTab = document.getElementById('login-tab-button');
    const signupTab = document.getElementById('signup-tab-button');
    
    closeModalButton.addEventListener('click', () => authModal.style.display = 'none');
    loginTab.addEventListener('click', () => showAuthTab('login'));
    signupTab.addEventListener('click', () => showAuthTab('signup'));

    // --- Form Handlers ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const authMessage = document.getElementById('auth-message');

    // Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authMessage.textContent = 'Logging in...';
        authMessage.className = 'mt-4 text-sm min-h-[20px] text-blue-600';
        
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const data = await apiRequest('login', { email, password }, 'POST');
            
            // On successful login, store the token and user's role
            localStorage.setItem('user_token', data.token);
            const decodedToken = JSON.parse(atob(data.token.split('.')[1]));
            localStorage.setItem('userRole', decodedToken.user.role);
            
            // Redirect to the dashboard
            window.location.href = '/dashboard.html';

        } catch (error) {
            authMessage.textContent = error.message;
            authMessage.className = 'mt-4 text-sm min-h-[20px] text-red-600';
        }
    });

    // Signup Form Submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authMessage.textContent = 'Creating account...';
        authMessage.className = 'mt-4 text-sm min-h-[20px] text-blue-600';

        try {
            const signupData = {
                email: document.getElementById('signup-email').value,
                password: document.getElementById('signup-password').value,
                firstName: document.getElementById('signup-first-name').value,
                lastName: document.getElementById('signup-last-name').value,
            };
            
            await apiRequest('signup', signupData, 'POST');
            
            authMessage.textContent = 'Account created! Please log in.';
            authMessage.className = 'mt-4 text-sm min-h-[20px] text-green-600';
            showAuthTab('login'); // Switch to login tab after successful signup
            signupForm.reset();

        } catch (error) {
            authMessage.textContent = error.message;
            authMessage.className = 'mt-4 text-sm min-h-[20px] text-red-600';
        }
    });
});
