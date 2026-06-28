// Generic API fetch wrapper to simplify backend communication
const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // Ensure credentials (cookies) are sent with every request
    options.credentials = 'include';
    
    // Add default headers for JSON if not uploading files (FormData)
    if (!(options.body instanceof FormData)) {
        options.headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
    }

    try {
        const response = await fetch(url, options);
        
        // Handle unauthorized session
        if (response.status === 401) {
            const currentPath = window.location.pathname;
            if (!currentPath.includes('signin.html') && !currentPath.includes('signup.html') && currentPath !== '/' && !currentPath.includes('index.html')) {
                window.location.href = '/signin.html';
                return null;
            }
        }
        
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
