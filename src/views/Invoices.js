// Invoices View

import { InvoiceStore, ClientStore, ProductStore, SettingsStore } from '../data/store.js';
import { formatCurrency, formatDate, isOverdue, sanitizeHTML } from '../utils/helpers.js';
import { showModal, hideModal, showConfirm } from '../components/Modal.js';
import { Toast } from '../components/Toast.js';
import { renderInvoiceForm } from '../components/InvoiceForm.js';
import { generatePDF, viewPDF } from '../utils/pdfGenerator.js';
import { API } from '../lib/api.js';

let currentFilter = 'all';
let currentSearchQuery = '';
let viewState = { invoices: [], clients: [], clientMap: {} }; // Cache for search/filter

export async function renderInvoices() {
    window.renderInvoices = renderInvoices; // Expose for InvoiceForm callbacks
    // Check for filter passed from other views
    const storedFilter = sessionStorage.getItem('invoiceFilter');
    if (storedFilter) {
        currentFilter = storedFilter;
        sessionStorage.removeItem('invoiceFilter');
    }

    const app = document.getElementById('app');

    // app.innerHTML = '<div class="loading">Loading invoices...</div>';

    // Fetch fresh data
    const [invoices, clients, settings] = await Promise.all([
        InvoiceStore.getAll(),
        ClientStore.getAll(),
        SettingsStore.get()
    ]);

    // Update Cache
    viewState.invoices = invoices;
    viewState.clients = clients;
    viewState.clientMap = clients.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
    }, {});

    renderInvoiceList();
}

function renderInvoiceList() {
    const app = document.getElementById('app');
    const invoices = viewState.invoices; // Use cached invoices

    app.innerHTML = `
        <div class="fade-in">
            <div class="flex-between mb-2">
                <div>
                    <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--spacing-sm);">
                        Invoices
                    </h1>
                    <p style="color: var(--color-text-tertiary);">
                        Manage and track all your invoices
                    </p>
                </div>
                <button class="btn btn-primary" onclick="window.createNewInvoice()">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>New Invoice</span>
                </button>
            </div>
            
            ${invoices.length === 0 ? `
                <div class="card" style="text-align: center; padding: var(--spacing-3xl); margin-top: var(--spacing-lg);">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto var(--spacing-lg); opacity: 0.3;">
                        <path d="M20 16H44M20 24H44M20 32H36M16 48H48C50.2091 48 52 46.2091 52 44V12C52 9.79086 50.2091 8 48 8H16C13.7909 8 12 9.79086 12 12V44C12 46.2091 13.7909 48 16 48Z" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                    <h3 style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">No invoices yet</h3>
                    <p style="color: var(--color-text-tertiary); margin-bottom: var(--spacing-md);">Create your first invoice to get started</p>
                    <button class="btn btn-primary" onclick="window.createNewInvoice()">Create Invoice</button>
                </div>
            ` : `
            <!-- Search Bar and Filters -->
            <div class="card invoice-controls-card">
                <div class="invoice-filters">
                    <button class="btn btn-sm ${currentFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="window.filterInvoices('all')">
                        All (${invoices.length})
                    </button>
                    <button class="btn btn-sm ${currentFilter === 'draft' ? 'btn-primary' : 'btn-secondary'}" onclick="window.filterInvoices('draft')">
                        Draft (${invoices.filter(i => i.status.toLowerCase() === 'draft').length})
                    </button>
                    <button class="btn btn-sm ${currentFilter === 'sent' ? 'btn-primary' : 'btn-secondary'}" onclick="window.filterInvoices('sent')">
                        Sent (${invoices.filter(i => i.status.toLowerCase() === 'sent').length})
                    </button>
                    <button class="btn btn-sm ${currentFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}" onclick="window.filterInvoices('paid')">
                        Paid (${invoices.filter(i => i.status.toLowerCase() === 'paid').length})
                    </button>
                    <button class="btn btn-sm ${currentFilter === 'overdue' ? 'btn-primary' : 'btn-secondary'}" onclick="window.filterInvoices('overdue')">
                        Overdue (${invoices.filter(i => isOverdue(i.due_date || i.dueDate, i.status)).length})
                    </button>
                </div>
                
                <!-- Modern Search Input -->
                <div class="invoice-search-wrapper">
                    <input type="text" 
                           placeholder="Search" 
                           value="${currentSearchQuery}"
                           oninput="window.handleSearch(this.value)"
                           style="width: 100%; padding: 8px 12px 8px 36px; border-radius: 20px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 14px; outline: none; transition: all 0.2s;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); pointer-events: none;">
                        <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 14L11.1 11.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
            
            <!-- Invoices Table -->
            <div class="card">
                <div class="card-body" id="invoicesTableContainer">
                    ${renderInvoicesTable(getFilteredInvoices(invoices))}
                </div>
            </div>
            `}
        </div>
    `;

    // Attach global functions
    window.createNewInvoice = createNewInvoice;
    window.editInvoice = editInvoice;
    window.deleteInvoice = deleteInvoice;
    window.downloadInvoice = downloadInvoice;
    window.viewInvoice = viewInvoice;
    window.sendEmail = sendEmail;
    window.filterInvoices = filterInvoices;
    window.handleSearch = handleSearch;
    window.markAsPaid = markAsPaid;
}

// Add event listener for focus maintenance if needed (optional optimization)

function getFilteredInvoices(invoices) {
    let filtered = invoices;

    // Apply status/client filter
    if (currentFilter !== 'all') {
        if (currentFilter === 'overdue') {
            filtered = filtered.filter(i => isOverdue(i.due_date || i.dueDate, i.status));
        } else if (currentFilter.startsWith('client:')) {
            const clientId = currentFilter.split(':')[1];
            filtered = filtered.filter(i => (i.client_id || i.clientId) === clientId);
        } else {
            filtered = filtered.filter(i => i.status.toLowerCase() === currentFilter);
        }
    }

    // Apply search filter (using cached clientMap)
    if (currentSearchQuery) {
        const query = currentSearchQuery.toLowerCase();
        filtered = filtered.filter(invoice => {
            const client = viewState.clientMap[invoice.client_id || invoice.clientId];
            const clientName = client ? client.name.toLowerCase() : '';
            return (invoice.invoice_number || invoice.invoiceNumber || '').toLowerCase().includes(query) ||
                clientName.includes(query);
        });
    }

    return filtered;
}

function handleSearch(query) {
    currentSearchQuery = query;
    // Use cached data
    const filtered = getFilteredInvoices(viewState.invoices);
    document.getElementById('invoicesTableContainer').innerHTML = renderInvoicesTable(filtered);
}

function filterInvoices(filter) {
    currentFilter = filter;
    renderInvoices();
}

function renderInvoicesTable(invoices) {
    if (invoices.length === 0) {
        return `
            <div style="text-align: center; padding: var(--spacing-3xl);">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto var(--spacing-lg); opacity: 0.3;">
                    <path d="M20 16H44M20 24H44M20 32H36M16 48H48C50.2091 48 52 46.2091 52 44V12C52 9.79086 50.2091 8 48 8H16C13.7909 8 12 9.79086 12 12V44C12 46.2091 13.7909 48 16 48Z" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                </svg>
                <h3 style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">No invoices found</h3>
                <p style="color: var(--color-text-tertiary);">There are no invoices matching your filter</p>
                <button class="btn btn-secondary btn-sm mt-1" onclick="window.filterInvoices('all')">Clear Filter</button>
            </div>
        `;
    }

    let filterMessage = '';
    if (currentFilter.startsWith('client:')) {
        const clientId = currentFilter.split(':')[1];
        const client = viewState.clientMap[clientId];
        filterMessage = `
            <div style="margin-bottom: var(--spacing-md); display: flex; align-items: center; gap: var(--spacing-sm);">
                <span class="badge badge-sent">Filtered by Client: ${client ? sanitizeHTML(client.name) : 'Unknown'}</span>
                <button class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 10px;" onclick="window.filterInvoices('all')">Clear</button>
            </div>
        `;
    }

    return `
        ${filterMessage}
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoices.map(invoice => {
        // Use lookup map
        const client = viewState.clientMap[invoice.client_id || invoice.clientId] || { name: 'Unknown Client' };
        const dueDate = invoice.due_date || invoice.dueDate;
        const invoiceNum = invoice.invoice_number || invoice.invoiceNumber;
        const overdueClass = isOverdue(dueDate, invoice.status) ? 'overdue' : invoice.status.toLowerCase();

        return `
                            <tr>
                                <td data-label="Invoice #" style="font-weight: 600; color: var(--color-text-primary);">${invoiceNum}</td>
                                <td data-label="Client">${sanitizeHTML(client.name)}</td>
                                <td data-label="Date">${formatDate(invoice.date)}</td>
                                <td data-label="Due Date">${formatDate(dueDate)}</td>
                                <td data-label="Amount" style="font-weight: 600;">${formatCurrency(invoice.total)}</td>
                                <td data-label="Status">
                                    <span class="badge badge-${overdueClass}">
                                        ${isOverdue(dueDate, invoice.status) ? 'Overdue' : invoice.status}
                                    </span>
                                </td>
                                <td data-label="Actions" style="text-align: right;">
                                    <div style="display: flex; gap: var(--spacing-sm); justify-content: flex-end;">
                                        ${invoice.status.toLowerCase() !== 'paid' ? `
                                        <button class="btn btn-sm btn-success" onclick="window.markAsPaid('${invoice.id}')" title="Mark as Paid">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M13.3333 4L6.00001 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </button>
                                        ` : ''}
                                        <button class="btn btn-sm btn-secondary" onclick="window.editInvoice('${invoice.id}')" title="Edit">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.33301 14.6667L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="window.viewInvoice('${invoice.id}')" title="View PDF">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8C6 6.89543 6.89543 6 8 6C9.10457 6 10 6.89543 10 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M8 3.33331C4.66667 3.33331 1.83333 5.33331 0.666667 8C1.83333 10.6666 4.66667 12.6666 8 12.6666C11.3333 12.6666 14.1667 10.6666 15.3333 8C14.1667 5.33331 11.3333 3.33331 8 3.33331Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="window.downloadInvoice('${invoice.id}')" title="Download PDF">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10M4.66667 6.66667L8 10M8 10L11.3333 6.66667M8 10V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="window.deleteInvoice('${invoice.id}')" title="Delete">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2 4H3.33333H14M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="window.sendEmail('${invoice.id}')" title="Send Email">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M14.6667 2.66666L8.00004 9.33332M14.6667 2.66666L10.424 14.1804C10.3781 14.3237 10.2846 14.4455 10.158 14.5276C10.0313 14.6096 9.87865 14.6471 9.72322 14.6343C9.56779 14.6216 9.41834 14.5594 9.29731 14.4571C9.17627 14.3548 9.09051 14.218 9.0531 14.0677L7.72671 9.60627L3.26526 8.27988C3.11475 8.24285 2.97775 8.15732 2.87532 8.03632C2.77289 7.91533 2.71077 7.76566 2.69804 7.61004C2.68531 7.45442 2.72269 7.30154 2.80436 7.17478C2.88602 7.04803 3.00742 6.9545 3.15004 6.90855L14.6667 2.66666Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function createNewInvoice() {
    try {
        // Fetch dependencies first
        const [clients, products] = await Promise.all([
            ClientStore.getAll(),
            ProductStore.getAll()
        ]);

        showModal('Create New Invoice', renderInvoiceForm(null, clients, products));
        // Initialize total calculation
        setTimeout(() => {
            if (window.updateInvoiceTotal) window.updateInvoiceTotal();
        }, 100);
    } catch (error) {
        console.error('Error in createNewInvoice:', error);
        Toast.show('Failed to open new invoice form', 'error');
    }
}

async function editInvoice(id) {
    try {
        // Fetch dependencies
        const [invoice, clients, products] = await Promise.all([
            InvoiceStore.getById(id),
            ClientStore.getAll(),
            ProductStore.getAll()
        ]);

        if (invoice) {
            showModal('Edit Invoice', renderInvoiceForm(invoice, clients, products));
            // Initialize total calculation
            setTimeout(() => {
                if (window.updateInvoiceTotal) window.updateInvoiceTotal();
            }, 100);
        }
    } catch (error) {
        console.error('Error in editInvoice:', error);
        Toast.show('Failed to open edit invoice form', 'error');
    }
}

async function deleteInvoice(id) {
    if (await showConfirm('Are you sure you want to delete this invoice?')) {
        await InvoiceStore.delete(id);
        renderInvoices();
        Toast.show('Invoice deleted', 'success');
    }
}

async function markAsPaid(id) {
    if (await showConfirm('Are you sure you want to mark this invoice as paid and notify client?', 'Are you sure?', 'Confirm', 'primary', true)) {
        const confirmBtn = document.getElementById('confirmOk');
        if (confirmBtn) {
            confirmBtn.textContent = 'Confirming...';
            confirmBtn.disabled = true;
        }

        try {
            await InvoiceStore.update(id, { status: 'paid' });

            // Auto-send email
            const invoice = await InvoiceStore.getById(id);
            const client = await ClientStore.getById(invoice.client_id || invoice.clientId);
            const settings = await SettingsStore.get();

            if (invoice && client) {
                const doc = await generatePDF(invoice, client, true);
                const pdfBlob = doc.output('blob');

                let subject = `Receipt for Invoice #${invoice.invoice_number || invoice.invoiceNumber} from`;
                if (settings.companyName) {
                    subject += ` ${settings.companyName}`;
                }

                let message = `Dear ${client.name},\n\nThank you for your payment. Please find attached the receipt for invoice #${invoice.invoice_number || invoice.invoiceNumber}.\n\nThank you for your business.\n\nBest regards,`;
                if (settings.companyName) {
                    message += `\n\n${settings.companyName}`;
                }

                const formData = new FormData();
                formData.append('invoice_id', invoice.id);
                formData.append('to', client.email);
                formData.append('subject', subject);
                formData.append('message', message);
                formData.append('pdf', pdfBlob, `Invoice_${invoice.invoice_number || invoice.invoiceNumber}.pdf`);

                await API.postMultipart('/invoices/send', formData);
                Toast.show('Invoice marked as paid and email sent', 'success');
            } else {
                Toast.show('Invoice marked as paid, but failed to send email (client details missing)', 'warning');
            }

        } catch (error) {
            console.error('Error marking invoice as paid and sending email:', error);
            Toast.show('Failed to process request', 'error');
        } finally {
            import('../components/Modal.js').then(module => module.hideConfirm());
            renderInvoices();
            if (confirmBtn) {
                confirmBtn.disabled = false;
            }
        }
    }
}

async function downloadInvoice(id) {
    try {
        const invoice = await InvoiceStore.getById(id);
        if (invoice) {
            // Need to ensure we have client data for PDF
            const client = await ClientStore.getById(invoice.client_id || invoice.clientId);
            generatePDF(invoice, client);
        }
    } catch (e) {
        console.error('PDF Error:', e);
        Toast.show('Failed to generate PDF. check console.', 'error');
    }
}

async function viewInvoice(id) {
    try {
        const invoice = await InvoiceStore.getById(id);
        if (invoice) {
            // Need to ensure we have client data for PDF
            const client = await ClientStore.getById(invoice.client_id || invoice.clientId);
            viewPDF(invoice, client);
        }
    } catch (e) {
        console.error('PDF View Error:', e);
        Toast.show('Failed to view PDF. check console.', 'error');
    }
}

async function sendEmail(id) {
    try {
        const invoice = await InvoiceStore.getById(id);
        if (invoice) {
            const client = await ClientStore.getById(invoice.client_id || invoice.clientId);

            if (!client) {
                console.error('Client not found for invoice:', invoice);
                Toast.show('Client not found. Cannot send email.', 'error');
                return;
            }

            try {
                // Dynamically import to ensure fresh version
                const { renderEmailModal } = await import(`../components/EmailModal.js?v=${Date.now()}`);
                showModal('Send Invoice via Email', renderEmailModal(invoice, client));
            } catch (importError) {
                console.error('Failed to load EmailModal:', importError);
                Toast.show('Failed to load email component. Please refresh.', 'error');
            }
        } else {
            Toast.show('Invoice not found.', 'error');
        }
    } catch (e) {
        console.error('Email Modal Error:', e);
        Toast.show('Failed to open email modal: ' + e.message, 'error');
    }
}
