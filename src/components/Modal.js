// Modal Component

export function showModal(title, content) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = title;

    // Clear previous content
    modalBody.innerHTML = '';

    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else if (content instanceof Node) {
        modalBody.appendChild(content);
    }
    modalOverlay.classList.add('active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

export function hideModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';
}

// Initialize modal close handlers
export function initializeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');

    // Close on X button
    modalClose.addEventListener('click', hideModal);

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            hideModal();
        }
    });
}

// Global resolve function for confirmation
let confirmResolve = null;

// NEW Global flag to prevent auto-close
let confirmKeepOpen = false;

export function showConfirm(message, title = 'Are you sure?', confirmText = 'Delete', type = 'danger', keepOpen = false) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirmOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmOk');

        confirmKeepOpen = keepOpen;

        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;

        confirmBtn.className = `btn btn-${type}`;

        overlay.classList.add('active');
        confirmResolve = resolve;
    });
}

export function hideConfirm() {
    const overlay = document.getElementById('confirmOverlay');
    overlay.classList.remove('active');
    confirmResolve = null;
    confirmKeepOpen = false;
}

export function initializeConfirm() {
    const overlay = document.getElementById('confirmOverlay');
    const cancelBtn = document.getElementById('confirmCancel');
    const confirmBtn = document.getElementById('confirmOk');

    const handleClose = (result) => {
        if (confirmResolve) confirmResolve(result);
        if (!result || !confirmKeepOpen) {
            hideConfirm();
        }
    };

    cancelBtn.onclick = () => handleClose(false);
    confirmBtn.onclick = () => handleClose(true);

    // Close on click outside
    overlay.onclick = (e) => {
        if (e.target === overlay) handleClose(false);
    };
}
