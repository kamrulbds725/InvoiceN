// Products View

import { ProductStore } from '../data/store.js';
import { formatCurrency, sanitizeHTML } from '../utils/helpers.js';
import { showModal, hideModal, showConfirm } from '../components/Modal.js';
import { Toast } from '../components/Toast.js';
import { renderProductForm } from '../components/ProductForm.js';

export async function renderProducts() {
    window.renderProducts = renderProducts;
    const app = document.getElementById('app');

    // app.innerHTML = '<div class="loading">Loading products...</div>';

    const products = await ProductStore.getAll();

    app.innerHTML = `
        <div class="fade-in">
            <div class="flex-between mb-2">
                <div>
                    <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--spacing-sm);">
                        Products & Services
                    </h1>
                    <p style="color: var(--color-text-tertiary);">
                        Manage your product catalog
                    </p>
                </div>
                <button class="btn btn-primary" onclick="window.createNewProduct()">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>Add Product</span>
                </button>
            </div>
            
            <!-- Products Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg);">
                ${products.map(product => renderProductCard(product)).join('')}
            </div>
            
            ${products.length === 0 ? `
                <div class="card" style="text-align: center; padding: var(--spacing-3xl);">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto var(--spacing-lg); opacity: 0.3;">
                        <path d="M12 28L32 12L52 28M12 28L32 44M12 28V52L32 64M52 28L32 44M52 28V52L32 64M32 44V64" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h3 style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">No products yet</h3>
                    <p style="color: var(--color-text-tertiary); margin-bottom: var(--spacing-md);">Add your first product or service</p>
                    <button class="btn btn-primary" onclick="window.createNewProduct()">Create Product</button>
                </div>
            ` : ''}
        </div>
    `;

    // Attach global functions
    window.createNewProduct = createNewProduct;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
}

function renderProductCard(product) {
    // Note: Schema has name, description, price. removed SKU/category as they are not in schema
    return `
        <div class="card">
            <div style="margin-bottom: var(--spacing-lg);">
                <div class="flex-between" style="margin-bottom: var(--spacing-sm);">
                    <h3 style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text-primary);">
                        ${sanitizeHTML(product.name)}
                    </h3>
                    <span style="display: inline-flex; align-items: center; padding: 0.2rem 0.65rem; font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-radius: var(--radius-full); background: rgba(194, 65, 12, 0.15); color: var(--color-primary);">${sanitizeHTML(product.category || 'Item')}</span>
                </div>
                ${product.sku ? `<div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--spacing-xs);">SKU: ${sanitizeHTML(product.sku)}</div>` : ''}
                <p style="color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-bottom: var(--spacing-md);">
                    ${sanitizeHTML(product.description || 'No description')}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: var(--spacing-md); border-top: 1px solid var(--color-divider);">
                    <div>
                        <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Price</div>
                        <div style="font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-text-primary);">
                            ${formatCurrency(product.price)}
                        </div>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: var(--spacing-sm);">
                <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.editProduct('${product.id}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.33301 14.6667L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="window.deleteProduct('${product.id}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4H3.33333H14M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function createNewProduct() {
    showModal('Add New Product', renderProductForm());
}

async function editProduct(id) {
    const product = await ProductStore.getById(id);
    if (product) {
        showModal('Edit Product', renderProductForm(product));
    }
}

async function deleteProduct(id) {
    if (await showConfirm('Are you sure you want to delete this product?')) {
        await ProductStore.delete(id);
        renderProducts();
        Toast.show('Product deleted');
    }
}
