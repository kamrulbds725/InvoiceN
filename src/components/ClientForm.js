// Client Form Component

import { ClientStore } from '../data/store.js';
import { hideModal } from './Modal.js';
import { hideQuickCreate } from './QuickCreateModal.js';
import { Toast } from './Toast.js';
import { renderClients } from '../views/Clients.js';
import { validateEmail, validatePhone } from '../utils/helpers.js';

export function renderClientForm(client = null) {
    const isEdit = client !== null;

    return `
        <form id="clientForm" onsubmit="window.handleClientSubmit(event, ${isEdit ? `'${client.id}'` : 'null'})">
            <div class="form-group">
                <label class="form-label">Client/Company Name</label>
                <input type="text" class="form-input" name="name" value="${client?.name || ''}" required>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" value="${client?.email || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" name="phone" value="${client?.phone || ''}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Address</label>
                <textarea class="form-textarea" name="address" rows="3">${client?.address || ''}</textarea>
            </div>
            
            <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end; margin-top: var(--spacing-xl);">
                <button type="button" class="btn btn-secondary" onclick="window.hideModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    ${isEdit ? 'Update Client' : 'Create Client'}
                </button>
            </div>
        </form>
    `;
}

// Quick-create variant: used from inside the Invoice form quick-create modal
export function renderClientFormQuick() {
    return `
        <form id="clientFormQuick" onsubmit="window.handleClientQuickSubmit(event)">
            <div class="form-group">
                <label class="form-label">Client/Company Name</label>
                <input type="text" class="form-input" name="name" required autofocus>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" name="phone" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Address</label>
                <textarea class="form-textarea" name="address" rows="2"></textarea>
            </div>
            
            <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end; margin-top: var(--spacing-xl);">
                <button type="button" class="btn btn-secondary" onclick="window.hideQuickCreate()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Client</button>
            </div>
        </form>
    `;
}

// Handle form submission (standard — from Clients view)
window.handleClientSubmit = async function (event, clientId) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const email = formData.get('email');
    const phone = formData.get('phone');

    if (!validateEmail(email)) {
        Toast.show('Please enter a valid email address', 'error');
        return;
    }

    if (!validatePhone(phone)) {
        Toast.show('Please enter a valid phone number', 'error');
        return;
    }

    const clientData = {
        name: formData.get('name'),
        email: email,
        phone: phone,
        address: formData.get('address')
    };

    if (clientId) {
        await ClientStore.update(clientId, clientData);
    } else {
        await ClientStore.create(clientData);
    }

    hideModal();
    renderClients();
    Toast.show(clientId ? 'Client updated successfully' : 'Client created successfully');
};

// Handle quick-create submission (from inside invoice form)
window.handleClientQuickSubmit = async function (event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;

    const formData = new FormData(event.target);
    const email = formData.get('email');
    const phone = formData.get('phone');

    if (!validateEmail(email)) {
        Toast.show('Please enter a valid email address', 'error');
        return;
    }

    if (!validatePhone(phone)) {
        Toast.show('Please enter a valid phone number', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        const clientData = {
            name: formData.get('name'),
            email: email,
            phone: phone,
            address: formData.get('address')
        };

        const newClient = await ClientStore.create(clientData);

        // Add new option to the client select in the open invoice form and select it
        const clientSelect = document.querySelector('select[name="clientId"]');
        if (clientSelect && newClient?.id) {
            const option = document.createElement('option');
            option.value = newClient.id;
            option.textContent = clientData.name;
            option.selected = true;
            clientSelect.appendChild(option);
        }

        hideQuickCreate();
        Toast.show('Client created and selected!');
    } catch (error) {
        console.error('Failed to create client:', error);
        Toast.show('Error creating client: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
};
