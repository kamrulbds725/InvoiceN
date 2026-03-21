export const API = {
    baseUrl: '/api/router.php',

    async request(endpoint, method = 'GET', data = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            method,
            headers
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);

            // Handle 401 Unauthorized globally if needed (e.g. redirect to login)
            if (response.status === 401 && !endpoint.includes('/auth/login')) {
                window.location.reload();
                return null;
            }

            // Handle 503 Service Unavailable (Not Installed)
            if (response.status === 503) {
                window.location.href = '/install/index.php';
                return null;
            }

            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                try {
                    result = await response.json();
                } catch (e) {
                    const text = await response.text();
                    console.error('JSON Parsing Error. Raw response:', text);
                    throw new Error('Server returned invalid JSON response');
                }
            } else {
                const text = await response.text();
                console.error('Non-JSON response received:', text);
                throw new Error('Server returned non-JSON response');
            }

            if (!response.ok) {
                throw new Error(result.error || 'API Request Failed');
            }

            return result;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, 'GET');
    },

    post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    },

    put(endpoint, data) {
        return this.request(endpoint, 'PUT', data);
    },

    delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    },

    async postMultipart(endpoint, formData) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                body: formData
                // No headers needed, browser creates correct Content-Type with boundary
            });

            // Handle 401 Unauthorized globally if needed (e.g. redirect to login)
            if (response.status === 401 && !endpoint.includes('/auth/login')) {
                window.location.reload();
                return null;
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API Request Failed');
            }

            return result;
        } catch (error) {
            console.error(`API Multipart Error (${endpoint}):`, error);
            throw error;
        }
    }
};
