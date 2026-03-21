// Data Store - PHP API Management
import { API } from '../lib/api.js';

// Invoice Management
export const InvoiceStore = {
    async getAll() {
        try {
            return await API.get('/invoices');
        } catch (error) {
            console.error('Error fetching invoices:', error);
            return [];
        }
    },

    async getById(id) {
        try {
            return await API.get(`/invoices/${id}`);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            return null;
        }
    },

    async create(invoice) {
        return await API.post('/invoices', invoice);
    },

    async update(id, updates) {
        return await API.put(`/invoices/${id}`, updates);
    },

    async delete(id) {
        return await API.delete(`/invoices/${id}`);
    },

    async getByClient(clientId) {
        // We could add a filter parameter to the API, but for now filtering clientside or creating a specific endpoint
        // Let's filter client-side for simplicity as the API just returns all invoices for now or we update API
        // Updating API to support filtering would be better, but let's stick to what we have in Controller (getById/getAll)
        // Actually, we can just fetch all and filter.
        const invoices = await this.getAll();
        return invoices.filter(inv => inv.client_id == clientId);
    }
};

// Client Management
export const ClientStore = {
    async getAll() {
        try {
            return await API.get('/clients');
        } catch (error) {
            console.error('Error fetching clients:', error);
            return [];
        }
    },

    async getById(id) {
        try {
            return await API.get(`/clients/${id}`);
        } catch (error) {
            // console.error('Error fetching client:', error);
            return null;
        }
    },

    async create(client) {
        return await API.post('/clients', client);
    },

    async update(id, updates) {
        return await API.put(`/clients/${id}`, updates);
    },

    async delete(id) {
        return await API.delete(`/clients/${id}`);
    }
};

// Product Management
export const ProductStore = {
    async getAll() {
        try {
            return await API.get('/products');
        } catch (error) {
            return [];
        }
    },

    async getById(id) {
        try {
            return await API.get(`/products/${id}`);
        } catch (error) {
            return null;
        }
    },

    async create(product) {
        return await API.post('/products', product);
    },

    async update(id, updates) {
        return await API.put(`/products/${id}`, updates);
    },

    async delete(id) {
        return await API.delete(`/products/${id}`);
    }
};

// Settings Management
// We implemented SettingsController, so we can use it now.
// Cache settings for synchronous access (needed by formatters)
const DEFAULT_SETTINGS = {
    companyName: 'Your Company Name',
    companyEmail: 'contact@yourcompany.com',
    companyPhone: '+1 (555) 123-4567',
    companyAddress: '123 Business St, Suite 100\nCity, State 12345',
    logo: null,
    taxRate: 0,
    currency: 'USD',
    invoicePrefix: 'INV',
    invoiceNumberFormat: 'sequential'
};

let cachedSettings = { ...DEFAULT_SETTINGS };

export const SettingsStore = {
    async get() {
        try {
            const settings = await API.get('/settings');
            // Merge with defaults to ensure all fields exist
            cachedSettings = { ...DEFAULT_SETTINGS, ...settings };

            // Map snake_case from DB to camelCase if API returns snake_case
            // Our PHP controller returns keys as stored in DB (snake_case) or we mapped it?
            // Let's check SettingsController.php... it does SELECT *.
            // So we need to map here.

            cachedSettings = {
                companyName: settings.company_name || DEFAULT_SETTINGS.companyName,
                companyEmail: settings.company_email || DEFAULT_SETTINGS.companyEmail,
                companyPhone: settings.company_phone || DEFAULT_SETTINGS.companyPhone,
                companyAddress: settings.company_address || DEFAULT_SETTINGS.companyAddress,
                logo: settings.logo || DEFAULT_SETTINGS.logo,
                taxRate: settings.tax_rate ?? DEFAULT_SETTINGS.taxRate,
                currency: settings.currency || DEFAULT_SETTINGS.currency,
                smtpHost: settings.smtp_host,
                smtpPort: settings.smtp_port,
                smtpUsername: settings.smtp_username,
                smtpPassword: settings.smtp_password,
                smtpEncryption: settings.smtp_encryption,
                smtpFromName: settings.smtp_from_name,
                smtpFromEmail: settings.smtp_from_email,

                emailDriver: settings.email_driver || 'mail',

                invoicePrefix: settings.invoice_prefix || DEFAULT_SETTINGS.invoicePrefix,
                invoiceNumberFormat: DEFAULT_SETTINGS.invoiceNumberFormat // Not in DB yet
            };

            return cachedSettings;
        } catch (error) {
            console.error('Error fetching settings:', error);
            return cachedSettings;
        }
    },

    // Synchronous getter for helpers
    getSync() {
        return cachedSettings;
    },

    async update(updates) {
        try {
            await API.post('/settings', updates); // Using POST/PUT handled by controller same way

            // Update cache locally
            cachedSettings = { ...cachedSettings, ...updates };
            return cachedSettings;
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    },

    async reset() {
        try {
            await API.delete('/settings');
            cachedSettings = { ...DEFAULT_SETTINGS };
            return cachedSettings;
        } catch (error) {
            throw error;
        }
    }
};

export async function initializeData() {
    // Initialization for Self-Hosted PHP API
}

export function clearAllData() {
    console.warn('Clear data not implemented for API');
}
