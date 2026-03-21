// Quick Create Modal — lightweight second overlay for inline creation
// Used when clicking "Add New Client" / "Add New Product" inside the Invoice form.

export function showQuickCreate(title, content) {
    const overlay = document.getElementById('quickCreateOverlay');
    const titleEl = document.getElementById('quickCreateTitle');
    const body = document.getElementById('quickCreateBody');

    titleEl.textContent = title;
    body.innerHTML = '';

    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof Node) {
        body.appendChild(content);
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function hideQuickCreate() {
    const overlay = document.getElementById('quickCreateOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

export function initializeQuickCreate() {
    const overlay = document.getElementById('quickCreateOverlay');
    const closeBtn = document.getElementById('quickCreateClose');

    if (!overlay || !closeBtn) return;

    closeBtn.addEventListener('click', hideQuickCreate);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideQuickCreate();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            hideQuickCreate();
        }
    });
}

// Expose globally
window.hideQuickCreate = hideQuickCreate;
