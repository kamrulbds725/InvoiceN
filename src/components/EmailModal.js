// Email Modal Component
import { SettingsStore, InvoiceStore, ClientStore } from '../data/store.js';
import { Toast } from './Toast.js';
import { generatePDF } from '../utils/pdfGenerator.js';
import { API } from '../lib/api.js';
import { sanitizeHTML } from '../utils/helpers.js';

export function renderEmailModal(invoice, client) {
    const isPaid = invoice.status.toLowerCase() === 'paid';
    const messageContent = isPaid
        ? `Dear ${sanitizeHTML(client.name)},\n\nThank you for your payment. Please find attached the receipt for invoice #${invoice.invoice_number}.\n\nThank you for your business.\n\nBest regards,`
        : `Dear ${sanitizeHTML(client.name)},\n\nPlease find attached invoice #${invoice.invoice_number}.\n\nThank you for your business.\n\nBest regards,`;

    const html = `
        <form id="emailForm" onsubmit="window.handleSendEmail(event)">
            <input type="hidden" name="invoice_id" value="${invoice.id}">
            
            <div class="form-group" style="margin-bottom: var(--spacing-md);">
                <label class="form-label">To</label>
                <input type="email" class="form-input" name="to" value="${client.email || ''}" required placeholder="client@example.com">
            </div>

            <div class="form-group" style="margin-bottom: var(--spacing-md);">
                <label class="form-label">Subject</label>
                <input type="text" class="form-input" name="subject" value="${isPaid ? 'Receipt for Invoice' : 'Invoice'} #${invoice.invoice_number} from" required>
            </div>

            <div class="form-group" style="margin-bottom: var(--spacing-lg);">
                <label class="form-label">Message</label>
                <textarea class="form-textarea" name="message" rows="5" required>${messageContent}</textarea>
            </div>

            <div style="background: var(--color-bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius-md); display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xl);">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: var(--color-primary);">
                    <path d="M10 3.33334V16.6667M10 16.6667L15 11.6667M10 16.6667L5 11.6667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div>
                    <div style="font-weight: 500;">Invoice_${invoice.invoice_number}.pdf</div>
                    <div style="font-size: var(--font-size-sm); color: var(--color-text-tertiary);">Will be generated and attached automatically</div>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: var(--spacing-md);">
                <button type="button" class="btn btn-secondary" onclick="window.hideModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="sendEmailBtn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.3333 1.66666L9.16663 10.8333M18.3333 1.66666L12.5 17.5C12.4367 17.697 12.3082 17.8647 12.134 17.9774C11.9599 18.0901 11.75 18.1417 11.5363 18.1242C11.3227 18.1068 11.1171 18.0212 10.9507 17.8805C10.7844 17.7398 10.6664 17.5516 10.615 17.345L8.79163 11.2083L2.65496 9.38499C2.44837 9.33355 2.26017 9.21558 2.11949 9.04924C1.97881 8.8829 1.89326 8.67727 1.87579 8.46363C1.85832 8.24999 1.9099 8.04008 2.02259 7.86596C2.13528 7.69184 2.30299 7.56333 2.49996 7.49999L18.3333 1.66666Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Send Invoice
                </button>
            </div>
        </form>
    `;

    // Initialize data
    activeInvoice = invoice;
    activeClient = client;
    initEmailForm(invoice, client);

    return html;
}

// Module-level cache to avoid store access issues in global handler
let activeInvoice = null;
let activeClient = null;

async function initEmailForm(invoice, client) {
    // Fill in company name in subject/body if available
    try {
        const settings = await SettingsStore.get();
        const form = document.getElementById('emailForm');
        if (form) {
            if (settings.companyName) {
                // Check if already appended to avoid duplication on re-renders if any
                if (!form.subject.value.includes(settings.companyName)) {
                    form.subject.value += ` ${settings.companyName}`;
                }
                if (!form.message.value.includes(settings.companyName)) {
                    form.message.value += `\n\n${settings.companyName}`;
                }
            }
        }
    } catch (e) {
        console.warn('Failed to load settings for email template', e);
    }
}

window.handleSendEmail = async function (event) {
    event.preventDefault();
    const btn = document.getElementById('sendEmailBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `
        <div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
        Sending...
    `;
    btn.disabled = true;

    try {
        const form = event.target;
        const invoiceId = form.invoice_id.value;

        // Use cached data to avoid re-fetching and potential import issues
        // Ensure we are sending the right invoice
        if (!activeInvoice || activeInvoice.id != invoiceId) {
            // Fallback to simpler method if cache missing logic (unlikely in this flow)
            // or throw error
            if (!activeInvoice) throw new Error("Invoice context lost. Please close and reopen.");
            // If IDs don't match, trust activeInvoice if logical, or trust form?
            // Form ID is hidden input. 
        }

        const invoiceData = activeInvoice;
        const clientData = activeClient;

        // 2. Generate PDF Blob
        const doc = await generatePDF(invoiceData, clientData, true); // Add flag to return doc instead of save
        const pdfBlob = doc.output('blob');

        // 3. Create FormData
        const formData = new FormData();
        formData.append('invoice_id', invoiceData.id);
        formData.append('to', form.to.value);
        formData.append('subject', form.subject.value);
        formData.append('message', form.message.value);
        formData.append('pdf', pdfBlob, `Invoice_${invoiceData.invoice_number || invoiceData.invoiceNumber}.pdf`);

        // 4. Send to Backend
        await API.postMultipart('/invoices/send', formData);

        Toast.show('Email sent successfully!', 'success');
        window.hideModal();

        // Refresh invoice list to show updated status
        if (window.renderInvoices) {
            window.renderInvoices();
        }

    } catch (error) {
        console.error('Email send error:', error);
        Toast.show('Failed to send email: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
};
