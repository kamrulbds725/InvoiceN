// Login View

import { Auth } from '../utils/auth.js';

export function renderLogin() {
    const app = document.getElementById('app');

    // Add login-mode class to body to hide sidebar/header
    document.body.classList.add('login-mode');

    app.innerHTML = `
        <style>
            @media (max-width: 480px) {
                .login-card {
                    padding: 1.5rem !important;
                }
            }
        </style>
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
            <div class="card login-card" style="width: 100%; max-width: 400px; padding: 2.5rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 2rem;">
                    <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="10" fill="url(#logo-gradient-login)" />
                        <path d="M12 20L18 26L28 14" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                        <defs>
                            <linearGradient id="logo-gradient-login" x1="0" y1="0" x2="40" y2="40">
                                <stop offset="0%" stop-color="#c2410c" />
                                <stop offset="100%" stop-color="#9a3412" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1 style="font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #c2410c 0%, #9a3412 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0;">InvoiceN</h1>
                </div>
                    <h2 style="color: var(--color-text-primary); margin: 0 0 0.5rem 0; font-size: 1.5rem;">Welcome Back</h2>
                    <p style="color: var(--color-text-tertiary);">Sign in to your dashboard</p>
                </div>

                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" id="username" class="form-input" placeholder="Enter email address" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <div style="position: relative;">
                            <input type="password" id="password" class="form-input" placeholder="Enter password" required style="padding-right: 40px;">
                            <button type="button" id="togglePassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 5px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div id="loginError" style="color: #EF4444; font-size: 0.875rem; margin-bottom: 1rem; text-align: center; display: none;">
                        Invalid credentials
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 1rem;">
                        Sign In
                    </button>
                    
                    <div style="margin-top: 1.5rem; text-align: center; font-size: 0.8rem; color: var(--color-text-muted);">
                        <span style="opacity: 0.7">Protected Area</span>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Handle Password Toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Update Icon
            if (type === 'text') {
                this.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                this.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    // Handle Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Show loading state
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Signing In...';
            submitBtn.disabled = true;

            const result = await Auth.login(email, password);

            if (result.success) {
                // Always land on dashboard on login
                window.location.hash = '#dashboard';
                window.location.reload();
            } else {
                const errorEl = document.getElementById('loginError');
                errorEl.style.display = 'block';
                errorEl.textContent = result.error || 'Invalid email or password';

                // Shake animation effect
                const card = document.querySelector('.card');
                if (card) {
                    card.style.transform = 'translateX(10px)';
                    setTimeout(() => card.style.transform = 'translateX(-10px)', 100);
                    setTimeout(() => card.style.transform = 'translateX(10px)', 200);
                    setTimeout(() => card.style.transform = 'translateY(-2px)', 300);
                }

                // Reset button
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}
