// Clients View

import { ClientStore, InvoiceStore } from '../data/store.js';
import { formatCurrency, sanitizeHTML } from '../utils/helpers.js';
import { showModal, hideModal, showConfirm } from '../components/Modal.js';
import { Toast } from '../components/Toast.js';
import { renderClientForm } from '../components/ClientForm.js';

export async function renderClients() {
    const app = document.getElementById('app');

    // Show loading skeleton
    app.innerHTML = `
        <div class="fade-in">
            <div class="mb-2">
                <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--spacing-sm);">Clients</h1>
            </div>
            <div class="card" style="display: flex; justify-content: center; padding: 4rem;">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    const [clients, invoices] = await Promise.all([
        ClientStore.getAll(),
        InvoiceStore.getAll()
    ]);

    app.innerHTML = `
        <div class="fade-in">
            <div class="flex-between mb-2">
                <div>
                    <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--spacing-sm);">
                        Clients
                    </h1>
                    <p style="color: var(--color-text-tertiary);">
                        Manage your client relationships
                    </p>
                </div>
                <button class="btn btn-primary" onclick="window.createNewClient()">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>Add Client</span>
                </button>
            </div>
            
            <!-- Clients Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: var(--spacing-lg);">
                ${clients.map(client => renderClientCard(client, invoices)).join('')}
            </div>
            
            ${clients.length === 0 ? `
                <div class="card" style="text-align: center; padding: var(--spacing-3xl);">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto var(--spacing-lg); opacity: 0.3;">
                        <path d="M32 32C38.6274 32 44 26.6274 44 20C44 13.3726 38.6274 8 32 8C25.3726 8 20 13.3726 20 20C20 26.6274 25.3726 32 32 32Z" stroke="currentColor" stroke-width="3"/>
                        <path d="M8 56C8 45.5066 16.5066 37 27 37H37C47.4934 37 56 45.5066 56 56V60H8V56Z" stroke="currentColor" stroke-width="3"/>
                    </svg>
                    <h3 style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">No clients yet</h3>
                    <p style="color: var(--color-text-tertiary); margin-bottom: var(--spacing-md);">Add your first client to start invoicing</p>
                    <button class="btn btn-primary" onclick="window.createNewClient()">Create Client</button>
                </div>
            ` : ''}
        </div>
    `;

    // Attach global functions
    window.createNewClient = createNewClient;
    window.editClient = editClient;
    window.deleteClient = deleteClient;
    window.viewClientInvoices = viewClientInvoices;
}

function renderClientCard(client, allInvoices) {
    // Filter invoices in memory to allow async "getByClient" behavior without N+1 queries
    const clientInvoices = allInvoices.filter(inv => (inv.client_id || inv.clientId) === client.id);
    const totalRevenue = clientInvoices.filter(inv => inv.status.toLowerCase() === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    const paidInvoices = clientInvoices.filter(inv => inv.status.toLowerCase() === 'paid').length;

    return `
        <div class="card">
            <div style="margin-bottom: var(--spacing-lg);">
                <div class="flex-between" style="margin-bottom: var(--spacing-md);">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xl); font-weight: 700; color: white;">
                        ${sanitizeHTML(client.name.charAt(0).toUpperCase())}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="window.viewClientInvoices('${client.id}')">
                        ${clientInvoices.length} Invoice${clientInvoices.length !== 1 ? 's' : ''}
                    </button>
                </div>
                
                <h3 style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text-primary); margin-bottom: var(--spacing-sm);">
                    ${sanitizeHTML(client.name)}
                </h3>
                
                <div style="display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-md);">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); color: var(--color-text-tertiary); font-size: var(--font-size-sm);">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.66699 2.66666H13.3337C14.0703 2.66666 14.667 3.26332 14.667 3.99999V12C14.667 12.7367 14.0703 13.3333 13.3337 13.3333H2.66699C1.93033 13.3333 1.33366 12.7367 1.33366 12V3.99999C1.33366 3.26332 1.93033 2.66666 2.66699 2.66666Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14.667 4L8.00033 8.66667L1.33366 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>${sanitizeHTML(client.email || '')}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); color: var(--color-text-tertiary); font-size: var(--font-size-sm);">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.6663 11.28V13.28C14.667 13.4657 14.6293 13.6494 14.555 13.8195C14.4808 13.9897 14.3716 14.1424 14.2343 14.2679C14.097 14.3934 13.9346 14.489 13.7575 14.5485C13.5803 14.608 13.3922 14.63 13.2063 14.6133C11.1676 14.3904 9.21311 13.6894 7.49301 12.5667C5.8891 11.5431 4.52491 10.1789 3.50134 8.57499C2.37301 6.84721 1.67169 4.88407 1.45301 2.83666C1.43635 2.65142 1.45823 2.46402 1.51726 2.28746C1.57628 2.1109 1.67116 1.94898 1.79586 1.81175C1.92056 1.67452 2.07231 1.56515 2.24166 1.49028C2.41102 1.41541 2.59397 1.37668 2.77967 1.37666H4.77967C5.10343 1.37341 5.41704 1.48716 5.66283 1.69762C5.90862 1.90808 6.06989 2.20125 6.11967 2.52199C6.21301 3.16235 6.37382 3.79173 6.59967 4.39999C6.68924 4.62973 6.71137 4.87943 6.66357 5.12076C6.61578 5.36209 6.49992 5.58546 6.32967 5.76332L5.49301 6.59999C6.44535 8.27662 7.83638 9.66765 9.51301 10.62L10.3497 9.78332C10.5275 9.61307 10.7509 9.49722 10.9922 9.44942C11.2336 9.40162 11.4833 9.42376 11.713 9.51332C12.3213 9.73917 12.9506 9.89998 13.591 9.99332C13.9157 10.0437 14.2122 10.2082 14.4238 10.4588C14.6355 10.7094 14.7467 11.0289 14.7397 11.3567L14.6663 11.28Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>${sanitizeHTML(client.phone || '')}</span>
                    </div>
                </div>
                
                <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md); display: flex; justify-content: space-between;">
                    <div>
                        <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Total Revenue</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text-primary);">
                            ${formatCurrency(totalRevenue)}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Paid</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 700; color: var(--color-success);">
                            ${paidInvoices}/${clientInvoices.length}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: var(--spacing-sm);">
                <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.editClient('${client.id}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.33301 14.6667L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="window.deleteClient('${client.id}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4H3.33333H14M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function createNewClient() {
    showModal('Add New Client', renderClientForm());
}

async function editClient(id) {
    const client = await ClientStore.getById(id);
    if (client) {
        showModal('Edit Client', renderClientForm(client));
    }
}

async function deleteClient(id) {
    // Check if client has invoices
    const allInvoices = await InvoiceStore.getAll();
    const invoices = allInvoices.filter(i => (i.client_id || i.clientId) == id);

    if (invoices.length > 0) {
        Toast.show(`Cannot delete client with ${invoices.length} existing invoices.`, 'error');
        return;
    }

    if (await showConfirm('Are you sure you want to delete this client?')) {
        await ClientStore.delete(id);
        renderClients();
        Toast.show('Client deleted');
    }
}

function viewClientInvoices(clientId) {
    sessionStorage.setItem('invoiceFilter', `client:${clientId}`);
    window.location.hash = '#invoices';
}
