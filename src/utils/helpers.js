// Helper Functions for the Invoice Dashboard
import { SettingsStore } from '../data/store.js';

// Date Formatting
export function formatDate(date) {
    if (!date) return '';

    // If YYYY-MM-DD string, parse manually to avoid UTC conversion shift
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [y, m, d] = date.split('-').map(Number);
        const localDate = new Date(y, m - 1, d);
        return localDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function formatDateInput(date) {
    if (!date) return '';

    // If it's already YYYY-MM-DD, return it to avoid timezone shifting
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Currency Formatting
export function formatCurrency(amount, currency = null) {
    if (!currency) {
        try {
            const settings = SettingsStore.getSync();
            currency = settings.currency || 'USD';
        } catch (e) {
            console.warn('SettingsStore not available, defaulting to USD');
            currency = 'USD';
        }
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Get Currency Symbol
export function getCurrencySymbol() {
    try {
        const settings = SettingsStore.getSync();
        const currency = settings.currency || 'USD';

        // Manual overrides for specific symbols if Intl doesn't give exactly what we want,
        // or just to rely on Intl but extract the symbol.
        // However, user specifically asked for '৳' for BDT.
        if (currency === 'BDT') return '৳';
        if (currency === 'USD') return '$';

        // Fallback using Intl
        const parts = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).formatToParts(0);

        const symbol = parts.find(part => part.type === 'currency');
        return symbol ? symbol.value : '$';
    } catch (e) {
        return '$';
    }
}

// Invoice Number Generation
export function generateInvoiceNumber(prefix = 'INV') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
}

// Status Color Mapping
export function getStatusColor(status) {
    const colors = {
        draft: 'draft',
        sent: 'sent',
        paid: 'paid',
        overdue: 'overdue'
    };
    return colors[status.toLowerCase()] || 'draft';
}

// Calculate Invoice Total
export function calculateInvoiceTotal(items, taxRate = 0, discount = 0) {
    const subtotal = items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
    }, 0);

    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax - discount;

    return {
        subtotal,
        tax,
        discount,
        total
    };
}

// Validate Email
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate Phone
export function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Check if Invoice is Overdue
export function isOverdue(dueDate, status) {
    if (status.toLowerCase() === 'paid') return false;

    let due;
    // If YYYY-MM-DD string, parse manually as local date
    if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        const [y, m, d] = dueDate.split('-').map(Number);
        due = new Date(y, m - 1, d);
    } else {
        due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today > due;
}

// Get Days Until Due
export function getDaysUntilDue(dueDate) {
    let due;
    if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        const [y, m, d] = dueDate.split('-').map(Number);
        due = new Date(y, m - 1, d);
    } else {
        due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = due - today;
    // Round to avoid float issues
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Debounce Function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Generate Unique ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format File Size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Sanitize HTML
export function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Get Month Name
export function getMonthName(monthIndex) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
}

// Calculate Monthly Revenue
export function calculateMonthlyRevenue(invoices) {
    const monthlyData = {};
    const currentYear = new Date().getFullYear();

    // Initialize all months with 0
    for (let i = 0; i < 12; i++) {
        monthlyData[i] = 0;
    }

    // Sum up paid invoices by month
    invoices.forEach(invoice => {
        if (!invoice) return;
        const status = (invoice.status || '').toLowerCase();

        if (status === 'paid') {
            let date;
            const docDate = invoice.date || new Date().toISOString().split('T')[0]; // Fallback

            // Parse local date if string to ensure correct month attribution
            if (typeof docDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(docDate)) {
                const [y, m, d] = docDate.split('-').map(Number);
                date = new Date(y, m - 1, d);
            } else {
                date = new Date(docDate);
            }

            if (date.getFullYear() === currentYear) {
                const month = date.getMonth();
                monthlyData[month] += (parseFloat(invoice.total) || 0);
            }
        }
    });

    return monthlyData;
}

// Get Invoice Stats
export function getInvoiceStats(invoices) {
    const stats = {
        total: invoices.length,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        totalRevenue: 0,
        paidRevenue: 0,
        unpaidRevenue: 0
    };

    invoices.forEach(invoice => {
        if (!invoice) return;
        const status = (invoice.status || 'draft').toLowerCase();

        if (status === 'draft') stats.draft++;
        else if (status === 'sent') stats.sent++;
        else if (status === 'paid') {
            stats.paid++;
            stats.paidRevenue += (parseFloat(invoice.total) || 0);
        }

        // Handle both snake_case (server) and camelCase (client)
        const dueDate = invoice.due_date || invoice.dueDate;

        if (isOverdue(dueDate, status)) {
            stats.overdue++;
        }

        const total = parseFloat(invoice.total) || 0;
        stats.totalRevenue += total;

        if (status !== 'paid') {
            stats.unpaidRevenue += total;
        }
    });

    return stats;
}

// Fetch Exchange Rate
// Fetch Exchange Rate (using USD as base for better reliability)
export async function fetchExchangeRate(fromCurrency, toCurrency) {
    try {
        // Always fetch USD base as it's most reliable
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();

        if (data && data.rates) {
            const fromRate = data.rates[fromCurrency];
            const toRate = data.rates[toCurrency];

            if (fromRate && toRate) {
                // Calculate cross rate
                return toRate / fromRate;
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return null;
    }
}
