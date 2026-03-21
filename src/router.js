// Simple Hash-based Router

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    // Register a route
    register(path, handler) {
        this.routes[path] = handler;
    }

    // Handle route changes
    async handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const route = hash.split('/')[0];

        // Update active nav item
        this.updateActiveNav(route);

        // Execute route handler
        if (this.routes[route]) {
            this.currentRoute = route;
            await this.routes[route]();
        } else {
            // Default to dashboard
            window.location.hash = '#dashboard';
        }
    }

    // Update active navigation item
    updateActiveNav(route) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.route === route) {
                item.classList.add('active');
            }
        });
    }

    // Navigate to a route
    navigate(path) {
        window.location.hash = `#${path}`;
    }
}

export default new Router();
