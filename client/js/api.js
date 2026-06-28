// Generic API fetch wrapper to simplify backend communication
const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // Ensure credentials (cookies) are sent with every request
    options.credentials = 'include';
    
    // Add default headers for JSON if not uploading files (FormData)
    options.headers = {
        ...options.headers
    };

    if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(url, options);
        
        // Handle unauthorized session
        if (response.status === 401) {
            const currentPath = window.location.pathname;
            if (!currentPath.includes('signin.html') && 
                !currentPath.includes('signup.html') && 
                !currentPath.includes('courses.html') && 
                !currentPath.includes('course-detail.html') && 
                !currentPath.includes('help.html') && 
                !currentPath.includes('contact.html') && 
                currentPath !== '/' && 
                !currentPath.includes('index.html')) {
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
