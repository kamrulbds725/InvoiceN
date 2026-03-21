// Product Form Component

import { ProductStore } from '../data/store.js';
import { hideModal } from './Modal.js';
import { hideQuickCreate } from './QuickCreateModal.js';
import { getCurrencySymbol } from '../utils/helpers.js';
import { Toast } from './Toast.js';

export function renderProductForm(product = null) {
    const isEdit = product !== null;

    return `
        <form id="productForm" onsubmit="window.handleProductSubmit(event, ${isEdit ? `'${product.id}'` : 'null'})">
            <div class="form-group">
                <label class="form-label">Product/Service Name</label>
                <input type="text" class="form-input" name="name" value="${product?.name || ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" name="description" rows="3">${product?.description || ''}</textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <div class="form-group">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-input" name="sku" value="${product?.sku || ''}" placeholder="e.g. SRV-001">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" name="category" required>
                        <option value="">Select Category</option>
                        <option value="Product" ${product?.category === 'Product' ? 'selected' : ''}>Product</option>
                        <option value="Service" ${product?.category === 'Service' ? 'selected' : ''}>Service</option>
                        <option value="Subscription" ${product?.category === 'Subscription' ? 'selected' : ''}>Subscription</option>
                        <option value="Consulting" ${product?.category === 'Consulting' ? 'selected' : ''}>Consulting</option>
                        <option value="Other" ${product?.category === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg);">
                <div class="form-group">
                    <label class="form-label">Price</label>
                    <div class="input-group">
                        <span class="input-group-text">${getCurrencySymbol()}</span>
                        <input type="number" class="form-input" name="price" value="${product?.price || ''}" min="0" step="0.01" required>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end; margin-top: var(--spacing-xl);">
                <button type="button" class="btn btn-secondary" onclick="window.hideModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    ${isEdit ? 'Update Product' : 'Create Product'}
                </button>
            </div>
        </form>
    `;
}

// Quick-create variant: used from inside the Invoice form item product select
export function renderProductFormQuick(itemIndex) {
    return `
        <form id="productFormQuick" onsubmit="window.handleProductQuickSubmit(event, ${itemIndex})">
            <div class="form-group">
                <label class="form-label">Product/Service Name</label>
                <input type="text" class="form-input" name="name" required autofocus>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" name="description" rows="2"></textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <div class="form-group">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-input" name="sku" placeholder="e.g. SRV-001">
                </div>

                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" name="category" required>
                        <option value="">Select Category</option>
                        <option value="Product">Product</option>
                        <option value="Service">Service</option>
                        <option value="Subscription">Subscription</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Price</label>
                <div class="input-group">
                    <span class="input-group-text">${getCurrencySymbol()}</span>
                    <input type="number" class="form-input" name="price" min="0" step="0.01" required>
                </div>
            </div>
            
            <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end; margin-top: var(--spacing-xl);">
                <button type="button" class="btn btn-secondary" onclick="window.hideQuickCreate()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Product</button>
            </div>
        </form>
    `;
}

// Handle form submission (standard — from Products view)
window.handleProductSubmit = async function (event, productId) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        const formData = new FormData(event.target);

        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            sku: formData.get('sku'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price'))
        };

        if (productId && productId !== 'null') {
            await ProductStore.update(productId, productData);
        } else {
            await ProductStore.create(productData);
        }

        hideModal();
        if (window.renderProducts) window.renderProducts();
        Toast.show(productId ? 'Product updated successfully' : 'Product created successfully');
    } catch (error) {
        console.error('Failed to save product:', error);
        Toast.show('Error saving product: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
};

// Handle quick-create submission (from inside invoice form item row)
window.handleProductQuickSubmit = async function (event, itemIndex) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        const formData = new FormData(event.target);

        const productData = {
            name: formData.get('name'),
            description: formData.get('description') || '',
            sku: formData.get('sku') || '',
            category: formData.get('category'),
            price: parseFloat(formData.get('price'))
        };

        const newProduct = await ProductStore.create(productData);

        // Find the product select in the correct invoice item row and add + select the new option
        const itemRow = document.querySelector(`.invoice-item[data-index="${itemIndex}"]`);
        if (itemRow && newProduct?.id) {
            const productSelect = itemRow.querySelector(`select[name="items[${itemIndex}][productId]"]`);
            if (productSelect) {
                const option = document.createElement('option');
                option.value = newProduct.id;
                option.textContent = `${productData.name} - ${productData.price}`;
                option.dataset.name = productData.name;
                option.dataset.description = productData.description;
                option.dataset.price = productData.price;
                option.selected = true;
                productSelect.appendChild(option);

                // Trigger populateProductDetails to fill price field
                window.populateProductDetails(productSelect, itemIndex);
            }
        }

        hideQuickCreate();
        Toast.show('Product created and selected!');
    } catch (error) {
        console.error('Failed to create product:', error);
        Toast.show('Error creating product: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
};

window.hideModal = hideModal;
