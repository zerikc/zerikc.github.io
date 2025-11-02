// ================================
// Configuration File
// ================================

const CONFIG = {
    // Firebase Configuration
    // Note: Firebase API keys are safe to expose in client-side code
    // They are restricted by domain in Firebase Console
    FIREBASE: {
        API_KEY: "AIzaSyChXxCJysVl3RCgbu1B0wxAa7gQQkkAkXk" // Public API key (domain-restricted)
    },
    
    // Google OAuth Configuration
    OAUTH: {
        CLIENT_ID: "974852900993-neldo0t6ldgo1qfpo51tfdkla9a0pvps.apps.googleusercontent.com"
    }
};

// Export for use in modules
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

// For ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

