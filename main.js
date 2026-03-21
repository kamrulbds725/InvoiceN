// Main Application Entry Point

import router from './src/router.js';
import { initializeData, ClientStore, SettingsStore } from './src/data/store.js';
import { initializeModal, initializeConfirm } from './src/components/Modal.js';
import { initializeQuickCreate } from './src/components/QuickCreateModal.js';
import { renderDashboard } from './src/views/Dashboard.js';
import { renderInvoices } from './src/views/Invoices.js';
import { renderProducts } from './src/views/Products.js';
import { renderClients } from './src/views/Clients.js';
import { renderSettings } from './src/views/Settings.js';
import { renderLogin } from './src/views/Login.js';
import { Auth } from './src/utils/auth.js';
import { initializeMobileMenu } from './src/utils/mobile.js';

// Initialize application
async function initApp() {
    try {
        console.log('🚀 Invoice Dashboard initializing...');

        // Check Authentication First
        if (!await Auth.isAuthenticated()) {
            console.log('🔒 User not authenticated. Showing Login.');
            // Make container visible for login view
            const container = document.querySelector('.app-container');
            if (container) container.style.display = 'flex';
            renderLogin();
            return;
        }

        // Make container visible for authenticated view
        const container = document.querySelector('.app-container');
        if (container) container.style.display = 'flex';

        // Remove login-mode class
        document.body.classList.remove('login-mode');

        // Initialize data from localStorage or mock data
        initializeData();

        // Warm up settings cache so synchronous helpers work immediately
        await SettingsStore.get();

        // Initialize modal handlers
        initializeModal();
        initializeConfirm();
        initializeQuickCreate();
        initializeMobileMenu();

        // Create client cache for quick lookups
        window.clientCache = {};
        try {
            const clients = await ClientStore.getAll();
            if (clients && Array.isArray(clients)) {
                clients.forEach(client => {
                    window.clientCache[client.id] = client;
                });
            }
        } catch (err) {
            console.error('Failed to load clients for cache:', err);
        }

        // Register routes
        router.register('dashboard', renderDashboard);
        router.register('invoices', renderInvoices);
        router.register('products', renderProducts);
        router.register('clients', renderClients);
        router.register('settings', renderSettings);

        // Manually trigger initial route to ensure it renders
        // This fixes race conditions where load event fires before listeners
        router.handleRoute();

        // Make Auth available globally for logout button
        window.Auth = Auth;

        console.log('✅ Invoice Dashboard ready!');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #EF4444;">
                    <h2>Something went wrong</h2>
                    <p>${error.message}</p>
                    <p style="margin-top: 1rem; font-size: 0.875rem; color: #9CA3AF;">Check the console (F12) for more details.</p>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
