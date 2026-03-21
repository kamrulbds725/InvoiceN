// Dashboard View

import { InvoiceStore, ClientStore, SettingsStore } from '../data/store.js';
import { formatCurrency, getInvoiceStats, calculateMonthlyRevenue, getMonthName, formatDate, sanitizeHTML } from '../utils/helpers.js';

export async function renderDashboard() {
    const app = document.getElementById('app');

    // Show loading skeleton or spinner if needed, but for now just wait
    // app.innerHTML = '<div class="loading">Loading dashboard...</div>';

    const [invoices, clients, settings] = await Promise.all([
        InvoiceStore.getAll(),
        ClientStore.getAll(),
        SettingsStore.get()
    ]);

    // Create client lookup map
    const clientMap = clients.reduce((acc, client) => {
        acc[client.id] = client;
        return acc;
    }, {});

    const stats = getInvoiceStats(invoices);
    const monthlyRevenue = calculateMonthlyRevenue(invoices);

    app.innerHTML = `
        <div class="fade-in">
            <div class="flex-between mb-2">
                <div>
                    <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--spacing-sm);">
                        Dashboard
                    </h1>
                    <p style="color: var(--color-text-tertiary);">
                        Welcome back! Here's your business overview.
                    </p>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="stats-grid">
                ${renderStatCard('Total Invoices', stats.total, 'primary', `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                `, '', 'all')}
                
                ${renderStatCard('Paid', stats.paid, 'success', `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                `, formatCurrency(stats.paidRevenue), 'paid')}
                
                ${renderStatCard('Unpaid', stats.sent, 'info', `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                `, formatCurrency(stats.unpaidRevenue), 'sent')}
                
                ${renderStatCard('Overdue', stats.overdue, 'danger', `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                `, '', 'overdue')}
            </div>
            
            <!-- Revenue Chart -->
            <div class="card" style="margin-bottom: var(--spacing-2xl);">
                <div class="card-header">
                    <h2 class="card-title">Monthly Revenue</h2>
                </div>
                <div class="card-body">
                    <canvas id="revenueChart" style="max-height: 300px;"></canvas>
                </div>
            </div>
            
            <!-- Recent Invoices -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Recent Invoices</h2>
                    <a href="#invoices" class="btn btn-primary btn-sm">View All</a>
                </div>
                <div class="card-body">
                    ${renderRecentInvoices(invoices.slice(0, 5), clientMap)}
                </div>
            </div>
        </div>
    `;

    // Initialize chart
    initializeRevenueChart(monthlyRevenue);

    // Global function for dashboard invoice navigation
    window.goToDashboardInvoices = (filter) => {
        if (filter !== 'all') {
            sessionStorage.setItem('invoiceFilter', filter);
        }
        window.location.hash = '#invoices';
    };
}

function renderStatCard(label, value, variant = 'primary', icon = '', subtitle = '', linkFilter = '') {
    const gradients = {
        primary: 'var(--gradient-primary)',
        success: 'var(--gradient-success)',
        info: 'var(--gradient-secondary)',
        danger: 'var(--gradient-danger)',
        warning: 'var(--gradient-warning)'
    };

    const actionMarkup = linkFilter ? `onclick="window.goToDashboardInvoices('${linkFilter}')" style="cursor: pointer;"` : '';
    const hoverClass = linkFilter ? 'hover-scale' : '';

    return `
        <div class="stat-card ${hoverClass}" ${actionMarkup}>
            <div class="stat-card-content">
                <div class="stat-card-header">
                    <div class="stat-card-label">${label}</div>
                    <div class="stat-card-icon" style="background: ${gradients[variant]};">
                        ${icon}
                    </div>
                </div>
                <div class="stat-card-value">${value}</div>
                ${subtitle ? `<div class="stat-card-trend">${subtitle}</div>` : ''}
            </div>
        </div>
    `;
}

function renderRecentInvoices(invoices, clientMap) {
    if (invoices.length === 0) {
        return '<p style="color: var(--color-text-tertiary); text-align: center; padding: var(--spacing-2xl);">No invoices yet. Create your first invoice!</p>';
    }

    return `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoices.map(invoice => {
        // Use client_id for Supabase
        const client = clientMap[invoice.client_id] || { name: 'Unknown Client' };

        return `
                            <tr>
                                <td data-label="Invoice #" style="font-weight: 600; color: var(--color-text-primary);">${invoice.invoice_number}</td>
                                <td data-label="Client">${sanitizeHTML(client.name)}</td>
                                <td data-label="Date">${formatDate(invoice.date)}</td>
                                <td data-label="Amount" style="font-weight: 600;">${formatCurrency(invoice.total)}</td>
                                <td data-label="Status">
                                    <span class="badge badge-${invoice.status.toLowerCase()}">
                                        ${invoice.status}
                                    </span>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function initializeRevenueChart(monthlyData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const labels = Object.keys(monthlyData).map(month => getMonthName(parseInt(month)));
    const data = Object.values(monthlyData);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: data,
                borderColor: '#c2410c',
                backgroundColor: 'rgba(194, 65, 12, 0.12)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#c2410c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(14, 14, 13, 0.95)',
                    titleColor: '#eeeeec',
                    bodyColor: '#b5b3ad',
                    borderColor: 'rgba(194, 65, 12, 0.4)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                }
            }
        }
    });
}
