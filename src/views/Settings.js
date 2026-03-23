// Settings View
import { SettingsStore, ProductStore, InvoiceStore } from '../data/store.js';
import { Toast } from '../components/Toast.js';
import { showConfirm } from '../components/Modal.js';
import { fetchExchangeRate } from '../utils/helpers.js';

export async function renderSettings() {
    const app = document.getElementById('app');

    // Show skeleton/loading state
    app.innerHTML = `
        <div class="fade-in">
            <div class="mb-2">
                <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--spacing-sm);">Settings</h1>
            </div>
            <div class="card" style="display: flex; justify-content: center; padding: 2rem;">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    try {
        const settings = await SettingsStore.get();
        // Delay to prevent flickering if fast
        // await new Promise(r => setTimeout(r, 300));

        app.innerHTML = `
            <div class="fade-in">
                <div class="mb-2">
                    <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--spacing-sm);">
                        Settings
                    </h1>
                    <p style="color: var(--color-text-tertiary);">
                        Configure your company information and preferences
                    </p>
                </div>
                
                <div class="card">
                    <form id="settingsForm" onsubmit="window.saveSettings(event)">
                        <!-- Company Information -->
                        <div style="margin-bottom: var(--spacing-2xl);">
                            <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-divider);">
                                Company Information
                            </h2>
                            
                            <div class="form-group">
                                <label class="form-label">Company Name</label>
                                <input type="text" class="form-input" name="companyName" value="${settings.companyName || ''}" required>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                                <div class="form-group">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-input" name="companyEmail" value="${settings.companyEmail || ''}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Phone</label>
                                    <input type="tel" class="form-input" name="companyPhone" value="${settings.companyPhone || ''}" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Address</label>
                                <textarea class="form-textarea" name="companyAddress" rows="3" required>${settings.companyAddress || ''}</textarea>
                            </div>
                        </div>
                        
                        <!-- Logo Upload -->
                        <div style="margin-bottom: var(--spacing-2xl);">
                            <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-divider);">
                                Company Logo
                            </h2>
                            
                            <div class="form-group">
                                <label class="form-label">Company Logo</label>
                                <div style="border: 2px dashed var(--color-border); border-radius: var(--radius-lg); padding: var(--spacing-xl); text-align: center; background: var(--color-bg-tertiary); transition: all 0.2s;" 
                                     ondragover="this.style.borderColor = 'var(--color-primary)'; this.style.background = 'rgba(139, 92, 246, 0.05)'; event.preventDefault();" 
                                     ondragleave="this.style.borderColor = 'var(--color-border)'; this.style.background = 'var(--color-bg-tertiary)'; event.preventDefault();"
                                     ondrop="this.style.borderColor = 'var(--color-border)'; this.style.background = 'var(--color-bg-tertiary)'; window.handleLogoDrop(event); event.preventDefault();">
                                    
                                    <div id="logoPreviewArea">
                                        ${settings.logo ? `
                                            <div style="position: relative; display: inline-block; margin-bottom: var(--spacing-md);">
                                                <img src="${settings.logo}" style="max-height: 120px; max-width: 100%; border-radius: var(--radius-md); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                                <button type="button" onclick="window.removeLogo()" style="position: absolute; top: -10px; right: -10px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                                </button>
                                            </div>
                                            <div style="display: flex; gap: var(--spacing-sm); justify-content: center;">
                                                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('logoInput').click()">Change Logo</button>
                                            </div>
                                        ` : `
                                            <div style="margin-bottom: var(--spacing-md); color: var(--color-text-tertiary);">
                                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.5;">
                                                    <path d="M38 38H10C8.89543 38 8 37.1046 8 36V12C8 10.8954 8.89543 10 10 10H38C39.1046 10 40 10.8954 40 12V36C40 37.1046 39.1046 38 38 38Z" stroke="currentColor" stroke-width="2"/>
                                                    <path d="M16 22C17.6569 22 19 20.6569 19 19C19 17.3431 17.6569 16 16 16C14.3431 16 13 17.3431 13 19C13 20.6569 14.3431 22 16 22Z" stroke="currentColor" stroke-width="2"/>
                                                    <path d="M24 30V18M24 18L20 22M24 18L28 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </div>
                                            <p style="margin-bottom: var(--spacing-sm); font-weight: 500;">Click to upload or drag and drop</p>
                                            <p style="font-size: var(--font-size-sm); color: var(--color-text-tertiary);">SVG, PNG, JPG (max 2MB)</p>
                                            <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('logoInput').click()" style="margin-top: var(--spacing-md);">Select Image</button>
                                        `}
                                    </div>
                                    <input type="file" id="logoInput" accept="image/*" style="display: none;" onchange="window.handleLogoUpload(event)">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Invoice Settings -->
                        <div style="margin-bottom: var(--spacing-2xl);">
                            <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-divider);">
                                Invoice Settings
                            </h2>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                                <div class="form-group">
                                    <label class="form-label">Tax Rate (%)</label>
                                    <input type="number" class="form-input" name="taxRate" value="${settings.taxRate}" min="0" max="100" step="0.01" required>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Currency</label>
                                    <select class="form-select" name="currency" required>
                                        <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD - US Dollar</option>
                                        <option value="BDT" ${settings.currency === 'BDT' ? 'selected' : ''}>BDT - Bangladeshi Taka</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Invoice Number Prefix</label>
                                <input type="text" class="form-input" name="invoicePrefix" value="${settings.invoicePrefix}" required>
                                <p style="font-size: var(--font-size-sm); color: var(--color-text-tertiary); margin-top: var(--spacing-sm);">
                                    Example: INV-2026-001
                                </p>
                            </div>
                        </div>

                            <!-- Email Settings (SMTP Only) -->
                            <div style="margin-bottom: var(--spacing-2xl);">
                                <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-divider);">
                                    Email Settings (SMTP)
                                </h2>

                                <div class="alert alert-info" style="margin-bottom: var(--spacing-lg);">
                                    We use SMTP to ensure your invoices are delivered reliably. Please configure your email provider details below.
                                </div>

                                <div id="smtpSettings" style="display: block;">
                                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-lg);">
                                        <div class="form-group">
                                            <label class="form-label">SMTP Host</label>
                                            <input type="text" class="form-input" name="smtpHost" value="${settings.smtpHost || ''}" placeholder="smtp.example.com">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Port</label>
                                            <input type="number" class="form-input" name="smtpPort" value="${settings.smtpPort || ''}" placeholder="587">
                                        </div>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                                        <div class="form-group">
                                            <label class="form-label">Username</label>
                                            <input type="text" class="form-input" name="smtpUsername" value="${settings.smtpUsername || ''}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Password</label>
                                            <input type="password" class="form-input" name="smtpPassword" value="${settings.smtpPassword || ''}">
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Encryption</label>
                                        <select class="form-select" name="smtpEncryption">
                                            <option value="tls" ${settings.smtpEncryption === 'tls' ? 'selected' : ''}>TLS (Recommended)</option>
                                            <option value="ssl" ${settings.smtpEncryption === 'ssl' ? 'selected' : ''}>SSL</option>
                                            <option value="none" ${settings.smtpEncryption === 'none' ? 'selected' : ''}>None</option>
                                        </select>
                                    </div>
                                </div>                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-top: var(--spacing-lg);">
                                <div class="form-group">
                                    <label class="form-label">From Name</label>
                                    <input type="text" class="form-input" name="smtpFromName" value="${settings.smtpFromName || ''}" placeholder="My Company">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">From Email</label>
                                    <input type="email" class="form-input" name="smtpFromEmail" value="${settings.smtpFromEmail || ''}" placeholder="billing@example.com">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="settings-actions">
                            <button type="button" class="btn btn-secondary" onclick="window.resetSettings()">
                                Reset to Defaults
                            </button>
                            <button type="submit" class="btn btn-primary" id="saveSettingsBtn">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    } catch (e) {
        console.error('Failed to load settings:', e);
        app.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #EF4444;">
                <h2>Failed to load settings</h2>
                <p>Please try refreshing the page.</p>
            </div>
        `;
    }

    // Attach global functions (need to wrap saveSettings to handle async properly in onclick)
    window.saveSettings = saveSettings;
    window.resetSettings = resetSettings;
    window.handleLogoUpload = handleLogoUpload;
    window.removeLogo = removeLogo;
    window.handleLogoDrop = handleLogoDrop;
    window.toggleSmtpSettings = toggleSmtpSettings;
}

function toggleSmtpSettings(driver) {
    const smtpSettings = document.getElementById('smtpSettings');
    if (smtpSettings) {
        smtpSettings.style.display = driver === 'smtp' ? 'block' : 'none';
    }
}

async function saveSettings(event) {
    event.preventDefault();
    const btn = document.getElementById('saveSettingsBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;

    try {
        const formData = new FormData(event.target);

        // Await get() since it is now async
        const oldSettings = await SettingsStore.get();
        const newCurrency = formData.get('currency');

        // Check if currency changed
        if (oldSettings.currency !== newCurrency) {
            let rate = await fetchExchangeRate(oldSettings.currency, newCurrency);
            let usingManualRate = false;

            if (!rate) {
                // API failed, ask for manual rate
                // Using window.prompt since we don't have a complex modal with input ready
                // Improvements: Could build a proper custom modal later
                const manualRate = window.prompt(
                    `Could not automatically fetch exchange rate from ${oldSettings.currency} to ${newCurrency}.\n\nPlease enter the exchange rate manually (1 ${oldSettings.currency} = ? ${newCurrency}):`
                );

                if (manualRate && !isNaN(parseFloat(manualRate))) {
                    rate = parseFloat(manualRate);
                    usingManualRate = true;
                }
            }

            if (rate) {
                const message = usingManualRate
                    ? `Convert prices using manual rate?\n1 ${oldSettings.currency} = ${rate} ${newCurrency}`
                    : `Do you want to convert all existing prices from ${oldSettings.currency} to ${newCurrency}?\nCurrent Rate: 1 ${oldSettings.currency} = ${rate.toFixed(4)} ${newCurrency}`;

                if (await showConfirm(message, 'Convert Currency', 'Convert', 'primary')) {
                    // Convert Products
                    const products = await ProductStore.getAll();
                    await Promise.all(products.map(product =>
                        ProductStore.update(product.id, {
                            ...product,
                            price: parseFloat((product.price * rate).toFixed(2))
                        })
                    ));

                    // Convert Invoices
                    const listInvoices = await InvoiceStore.getAll();
                    // Use sequential loop to prevent server overload and database locking
                    for (const invList of listInvoices) {
                        try {
                            // Fetch full invoice to get items
                            const invoice = await InvoiceStore.getById(invList.id);

                            if (!invoice || !invoice.items) continue;

                            // Update items
                            const updatedItems = invoice.items.map(item => ({
                                ...item,
                                productId: item.product_id || item.productId,
                                price: parseFloat((item.price * rate).toFixed(2))
                            }));

                            // Handle discount safely (default to 0 if missing from schema)
                            const currentDiscount = invoice.discount || 0;
                            const discount = parseFloat((currentDiscount * rate).toFixed(2));

                            // Recalculate totals
                            const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

                            // Use invoice's existing tax rate unless it's missing, then fallback
                            const invoiceTaxRate = invoice.tax_rate !== undefined ? parseFloat(invoice.tax_rate) : parseFloat(formData.get('taxRate'));
                            const tax = parseFloat((subtotal * (invoiceTaxRate / 100)).toFixed(2));
                            const total = subtotal + tax - discount;

                            await InvoiceStore.update(invoice.id, {
                                ...invoice, // Spread existing properties
                                clientId: invoice.client_id || invoice.clientId, // Ensure camelCase for backend
                                date: invoice.date,
                                dueDate: invoice.due_date || invoice.dueDate,
                                invoiceNumber: invoice.invoice_number || invoice.invoiceNumber,
                                status: invoice.status,
                                notes: invoice.notes,
                                items: updatedItems,
                                discount: discount, // Will be ignored if not in DB schema, but kept for calc
                                subtotal: parseFloat(subtotal.toFixed(2)),
                                tax: parseFloat(tax.toFixed(2)),
                                total: parseFloat(total.toFixed(2)),
                                currency: newCurrency // Update stored currency code
                            });
                        } catch (err) {
                            console.error(`Failed to convert invoice ${invList.id}`, err);
                        }
                    }

                    Toast.show(`Prices converted to ${newCurrency}`);
                }
            } else {
                Toast.show('Exchange rate not provided. Prices were not converted.', 'warning');
            }
        }

        // ALWAYS save settings, regardless of conversion outcome
        const updates = {
            companyName: formData.get('companyName'),
            companyEmail: formData.get('companyEmail'),
            companyPhone: formData.get('companyPhone'),
            companyAddress: formData.get('companyAddress'),
            taxRate: parseFloat(formData.get('taxRate')),
            currency: newCurrency,
            invoicePrefix: formData.get('invoicePrefix'),

            // Email Settings - FORCE SMTP
            emailDriver: 'smtp',
            smtpHost: formData.get('smtpHost'),
            smtpPort: formData.get('smtpPort'),
            smtpUsername: formData.get('smtpUsername'),
            smtpPassword: formData.get('smtpPassword'),
            smtpEncryption: formData.get('smtpEncryption'),
            smtpFromName: formData.get('smtpFromName'),
            smtpFromEmail: formData.get('smtpFromEmail')
        };

        await SettingsStore.update(updates);
        Toast.show('Settings saved successfully!');

        // Re-render to reflect state
        await renderSettings();
    } catch (error) {
        console.error('Error saving settings:', error);
        Toast.show('Failed to save settings: ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
}

async function resetSettings() {
    if (await showConfirm('Are you sure you want to reset all settings to defaults?', 'Reset Settings', 'Reset', 'danger')) {
        try {
            await SettingsStore.reset();
            await renderSettings();
            Toast.show('Settings reset to defaults');
        } catch (error) {
            Toast.show('Failed to reset settings', 'error');
        }
    }
}

async function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        Toast.show('File size must be less than 2MB', 'error');
        return;
    }

    if (!file.type.startsWith('image/')) {
        Toast.show('Please upload an image file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const base64 = e.target.result;
        try {
            await SettingsStore.update({ logo: base64 });
            await renderSettings();
            Toast.show('Logo uploaded successfully');
        } catch (error) {
            Toast.show('Upload failed: ' + (error.message || 'Unknown error'), 'error');
        }
    };
    reader.readAsDataURL(file);
}

async function removeLogo() {
    try {
        await SettingsStore.update({ logo: null });
        await renderSettings();
        Toast.show('Logo removed');
    } catch (error) {
        Toast.show('Failed to remove logo', 'error');
    }
}

function handleLogoDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
        // Mock event for reuse
        handleLogoUpload({ target: { files: [file] } });
    }
}
