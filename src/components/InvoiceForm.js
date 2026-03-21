// Invoice Form Component

import { InvoiceStore, ClientStore, ProductStore, SettingsStore } from '../data/store.js';
import { hideModal } from './Modal.js';
import { showQuickCreate } from './QuickCreateModal.js';
import { renderClientFormQuick } from './ClientForm.js';
import { renderProductFormQuick } from './ProductForm.js';
import { Toast } from './Toast.js';
import { formatCurrency, formatDateInput, generateInvoiceNumber, calculateInvoiceTotal, generateId, getCurrencySymbol, sanitizeHTML } from '../utils/helpers.js';

export function renderInvoiceForm(invoice = null, clients = [], products = []) {
    const isEdit = invoice !== null;
    const settings = SettingsStore.getSync(); // Settings handles sync localstorage

    const invoiceData = invoice || {
        invoice_number: generateInvoiceNumber(settings.invoicePrefix),
        client_id: '',
        date: formatDateInput(new Date()),
        due_date: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        show_due_date: true,
        status: 'Draft',
        items: [],
        notes: ''
    };

    // Helper to handle camelCase fallback if legacy data exists
    const clientId = invoiceData.client_id || invoiceData.clientId || '';
    const invoiceNumber = invoiceData.invoice_number || invoiceData.invoiceNumber || '';
    const dueDate = invoiceData.due_date || invoiceData.dueDate || '';
    const showDueDate = invoiceData.show_due_date !== undefined ? invoiceData.show_due_date : (invoiceData.showDueDate !== false);

    return `
        <form id="invoiceForm" onsubmit="window.handleInvoiceSubmit(event, ${isEdit ? `'${invoice.id}'` : 'null'})">
            <div class="form-grid-2 margin-bottom-lg">
                <div class="form-group">
                    <label class="form-label">Invoice Number</label>
                    <input type="text" class="form-input" name="invoiceNumber" value="${invoiceNumber}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Client</label>
                    <select class="form-select" name="clientId" required>
                        <option value="">Select a client</option>
                        ${clients.map(client => `
                            <option value="${client.id}" ${clientId == client.id ? 'selected' : ''}>
                                ${sanitizeHTML(client.name)}
                            </option>
                        `).join('')}
                    </select>
                    <button type="button" class="quick-create-link" onclick="window.openQuickCreateClient()">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2V10M2 6H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        Add New Client
                    </button>
                </div>
            </div>
            
            <div class="invoice-dates-grid">
                <div class="form-group">
                    <label class="form-label">Invoice Date</label>
                    <input type="date" class="form-input" name="date" value="${formatDateInput(invoiceData.date)}" required>
                </div>
                
                <div class="form-group">
                    <div class="flex-between" style="margin-bottom: var(--spacing-sm);">
                        <label class="form-label" style="margin-bottom: 0;">Due Date</label>
                        <label class="toggle-switch" style="margin-right: 0;">
                            <input type="checkbox" class="toggle-input" name="showDueDate" ${showDueDate ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Show</span>
                        </label> 
                    </div>
                    <input type="date" class="form-input" name="dueDate" value="${formatDateInput(dueDate)}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-select" name="status" required>
                        <option value="Draft" ${invoiceData.status.toLowerCase() === 'draft' ? 'selected' : ''}>Draft</option>
                        <option value="Sent" ${invoiceData.status.toLowerCase() === 'sent' ? 'selected' : ''}>Sent</option>
                        <option value="Paid" ${invoiceData.status.toLowerCase() === 'paid' ? 'selected' : ''}>Paid</option>
                    </select>
                </div>
            </div>
            
            <!-- Line Items -->
            <div style="margin-bottom: var(--spacing-lg);">
                <div class="flex-between" style="margin-bottom: var(--spacing-md);">
                    <label class="form-label" style="margin: 0;">Line Items</label>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="window.addInvoiceItem()">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 3.33334V12.6667M3.33334 8H12.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        Add Item
                    </button>
                </div>
                
                <div id="invoiceItems">
                    ${invoiceData.items && invoiceData.items.length > 0 ?
            invoiceData.items.map((item, index) => renderInvoiceItem(item, index, products)).join('') :
            renderInvoiceItem(null, 0, products)
        }
                </div>
            </div>
            
            <!-- Discount -->
            <div class="form-group">
                <label class="form-label">Discount Amount</label>
                <div class="input-group">
                    <span class="input-group-text">${getCurrencySymbol()}</span>
                    <input type="number" class="form-input" name="discount" value="${invoiceData.discount || 0}" min="0" step="0.01" oninput="window.updateInvoiceTotal()">
                </div>
            </div>
            
            <!-- Total Display -->
            <div style="background: var(--color-bg-tertiary); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
                    <span style="color: var(--color-text-secondary);">Subtotal:</span>
                    <span id="subtotalDisplay" style="font-weight: 600;">$0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
                    <span style="color: var(--color-text-secondary);">Tax (${settings.taxRate}%):</span>
                    <span id="taxDisplay" style="font-weight: 600;">$0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
                    <span style="color: var(--color-text-secondary);">Discount:</span>
                    <span id="discountDisplay" style="font-weight: 600;">$0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: var(--spacing-md); border-top: 1px solid var(--color-divider);">
                    <span style="font-size: var(--font-size-lg); font-weight: 700;">Total:</span>
                    <span id="totalDisplay" style="font-size: var(--font-size-xl); font-weight: 800; color: var(--color-primary);">$0.00</span>
                </div>
            </div>
            
            <!-- Notes -->
            <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes" rows="3" placeholder="Payment terms, thank you message, etc.">${invoiceData.notes || ''}</textarea>
            </div>
            
            <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end; margin-top: var(--spacing-xl);">
                <button type="button" class="btn btn-secondary" onclick="window.hideModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    ${isEdit ? 'Update Invoice' : 'Create Invoice'}
                </button>
            </div>
        </form>
        
    `;
}

function renderInvoiceItem(item, index, products) {
    // Helper to handle both cases
    const itemId = item?.productId || item?.product_id || '';

    return `
        <div class="invoice-item" data-index="${index}" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: var(--spacing-md); margin-bottom: var(--spacing-md); padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div class="form-group" style="margin: 0;">
                <select class="form-select" name="items[${index}][productId]" onchange="window.populateProductDetails(this, ${index})" required>
                    <option value="">Select product/service</option>
                    ${products.map(product => `
                        <option value="${product.id}" 
                                data-name="${product.name}" 
                                data-description="${product.description || ''}" 
                                data-price="${product.price}"
                                ${itemId == product.id ? 'selected' : ''}>
                            ${product.name} - ${formatCurrency(product.price)}
                        </option>
                    `).join('')}
                </select>
                <button type="button" class="quick-create-link" onclick="window.openQuickCreateProduct(${index})">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2V10M2 6H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    Add New Product
                </button>
                <input type="hidden" name="items[${index}][name]" value="${item?.name || ''}">
                <input type="hidden" name="items[${index}][description]" value="${item?.description || ''}">
            </div>
            
            <div class="form-group" style="margin: 0;">
                <input type="number" class="form-input" name="items[${index}][quantity]" placeholder="Qty" value="${item?.quantity || 1}" min="1" oninput="window.updateInvoiceTotal()" required>
            </div>
            
            <div class="form-group" style="margin: 0;">
                <div class="input-group">
                    <span class="input-group-text" style="min-width: 2.5rem; padding: 0 0.5rem; font-size: 0.9em;">${getCurrencySymbol()}</span>
                    <input type="number" class="form-input" name="items[${index}][price]" placeholder="Price" value="${item?.price || ''}" min="0" step="0.01" oninput="window.updateInvoiceTotal()" required>
                </div>
            </div>
            
            <button type="button" class="btn btn-ghost-danger btn-icon" onclick="window.removeInvoiceItem(${index})" title="Remove Item" ${index === 0 && (!products || products.length === 0) ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `;
}

// Global functions for invoice form
let itemCounter = 1;

window.addInvoiceItem = async function () {
    const container = document.getElementById('invoiceItems');
    // Fetch products again? Or better, cache them in render or window.
    // For simplicity, fetch fresh
    const products = await ProductStore.getAll();
    container.insertAdjacentHTML('beforeend', renderInvoiceItem(null, itemCounter++, products));
    updateInvoiceTotal();
};

window.removeInvoiceItem = function (index) {
    const item = document.querySelector(`.invoice-item[data-index="${index}"]`);
    if (item) {
        item.remove();
        updateInvoiceTotal();
    }
};

window.populateProductDetails = function (select, index) {
    const option = select.options[select.selectedIndex];
    if (option.value) {
        const container = select.closest('.invoice-item');
        container.querySelector(`input[name="items[${index}][name]"]`).value = option.dataset.name;
        container.querySelector(`input[name="items[${index}][description]"]`).value = option.dataset.description;
        container.querySelector(`input[name="items[${index}][price]"]`).value = option.dataset.price;
        updateInvoiceTotal();
    }
};

window.updateInvoiceTotal = function () {
    const settings = SettingsStore.getSync();
    const items = [];

    document.querySelectorAll('.invoice-item').forEach((item, index) => {
        const quantity = parseFloat(item.querySelector(`input[name="items[${item.dataset.index}][quantity]"]`)?.value || 0);
        const price = parseFloat(item.querySelector(`input[name="items[${item.dataset.index}][price]"]`)?.value || 0);

        if (quantity && price) {
            items.push({ quantity, price });
        }
    });

    const discount = parseFloat(document.querySelector('input[name="discount"]')?.value || 0);
    const totals = calculateInvoiceTotal(items, settings.taxRate, discount);

    document.getElementById('subtotalDisplay').textContent = formatCurrency(totals.subtotal);
    document.getElementById('taxDisplay').textContent = formatCurrency(totals.tax);
    document.getElementById('discountDisplay').textContent = formatCurrency(totals.discount);
    document.getElementById('totalDisplay').textContent = formatCurrency(totals.total);
};

window.handleInvoiceSubmit = async function (event, invoiceId) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        const formData = new FormData(event.target);
        const settings = SettingsStore.getSync();

        // Collect line items
        const items = [];
        document.querySelectorAll('.invoice-item').forEach((item) => {
            const index = item.dataset.index;
            const productId = formData.get(`items[${index}][productId]`);
            const name = formData.get(`items[${index}][name]`);
            const description = formData.get(`items[${index}][description]`);
            const quantity = parseFloat(formData.get(`items[${index}][quantity]`));
            const price = parseFloat(formData.get(`items[${index}][price]`));

            if (productId && quantity && price) {
                items.push({
                    id: generateId(),
                    productId: productId, // camelCase for API
                    name,
                    description,
                    quantity,
                    price
                });
            }
        });

        if (items.length === 0) {
            Toast.show('Please add at least one line item', 'error');
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
            return;
        }

        const discount = parseFloat(formData.get('discount') || 0);
        const totals = calculateInvoiceTotal(items, settings.taxRate, discount);

        const invoiceData = {
            invoiceNumber: formData.get('invoiceNumber'),
            clientId: formData.get('clientId'),
            date: formData.get('date'),
            dueDate: formData.get('dueDate'),
            showDueDate: formData.get('showDueDate') === 'on',
            status: formData.get('status'),
            items: items,
            subtotal: totals.subtotal,
            tax: totals.tax,
            discount: totals.discount,
            total: totals.total,
            notes: formData.get('notes'),
            invoicePrefix: settings.invoicePrefix // pass prefix too just in case
        };

        if (invoiceId && invoiceId !== 'null') {
            await InvoiceStore.update(invoiceId, invoiceData);
        } else {
            await InvoiceStore.create(invoiceData);
        }

        hideModal();
        if (window.renderInvoices) window.renderInvoices();
        Toast.show(invoiceId ? 'Invoice updated successfully' : 'Invoice created successfully');
    } catch (error) {
        console.error('Failed to save invoice:', error);
        Toast.show('Error saving invoice: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
};

// Open quick-create modal for clients (from inside invoice form)
window.openQuickCreateClient = function () {
    showQuickCreate('Add New Client', renderClientFormQuick());
};

// Open quick-create modal for products (from inside invoice form item row)
window.openQuickCreateProduct = function (itemIndex) {
    showQuickCreate('Add New Product', renderProductFormQuick(itemIndex));
};
