import { API } from '../lib/api.js';

export const Auth = {
    async isAuthenticated() {
        try {
            const result = await API.get('/auth/user');
            return !!result.user;
        } catch (e) {
            return false;
        }
    },

    async login(email, password) {
        try {
            const result = await API.post('/auth/login', { email, password });
            if (result.success) {
                // Determine redirect based on result or just return success
                return { success: true, user: result.user };
            }
            return { success: false, error: result.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async logout() {
        try {
            await API.post('/auth/logout');
            window.location.hash = '';
            window.location.reload();
        } catch (e) {
            console.error('Logout failed', e);
            window.location.hash = '';
            window.location.reload();
        }
    },

    async currentUser() {
        try {
            const result = await API.get('/auth/user');
            return result.user;
        } catch (e) {
            return null;
        }
    }
};
