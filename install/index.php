<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install InvoiceN</title>
    <link rel="icon" type="image/svg+xml"
        href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c2410c' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E">
    <style>
        :root {
            /* Colors — Ark UI Dark Theme */
            --color-bg-primary: #0d0d0d;
            --color-bg-secondary: #111111;
            --color-bg-tertiary: #191918;
            --color-bg-card: #111111;
            
            /* Gradients */
            --gradient-primary: linear-gradient(135deg, #c2410c 0%, #9a3412 100%);
            --gradient-overlay: linear-gradient(180deg, rgba(194, 65, 12, 0.07) 0%, rgba(0, 0, 0, 0) 100%);

            /* Text Colors */
            --color-text-primary: #eeeeec;
            --color-text-secondary: #b5b3ad;
            --color-text-tertiary: #878580;

            /* Accent Colors */
            --color-primary: #c2410c;
            
            /* Border */
            --color-border: rgba(73, 72, 68, 0.18);
            
            /* Spacing & Radius */
            --radius-md: 0.5rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
            
            --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        body {
            font-family: var(--font-family);
            background: var(--color-bg-primary);
            color: var(--color-text-primary);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 1rem;
            box-sizing: border-box;
            overflow-y: auto;
        }

        /* Animated Background */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background:
                radial-gradient(circle at 20% 50%, rgba(194, 65, 12, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(194, 65, 12, 0.08) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }

        .card {
            background: var(--color-bg-secondary);
            padding: 2.5rem;
            border-radius: var(--radius-xl);
            border: 1px solid var(--color-border);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
            width: 100%;
            max-width: 420px;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--gradient-overlay);
            pointer-events: none;
        }

        h1 {
            position: relative;
            margin-top: 0;
            color: var(--color-text-primary);
            text-align: center;
            font-weight: 700;
            margin-bottom: 2rem;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        p {
            position: relative;
        }

        form {
            position: relative;
        }

        .form-group {
            margin-bottom: 1.25rem;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--color-text-secondary);
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        input {
            width: 100%;
            padding: 0.75rem;
            background: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            box-sizing: border-box;
            color: var(--color-text-primary);
            font-size: 1rem;
            transition: all 0.2s;
        }

        input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px rgba(194, 65, 12, 0.12);
        }

        button {
            width: 100%;
            padding: 0.875rem;
            background: var(--gradient-primary);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1rem;
            transition: opacity 0.2s;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.6);
        }

        button:hover {
            opacity: 0.9;
        }

        button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .error {
            position: relative;
            color: #ef4444;
            margin-bottom: 1.5rem;
            text-align: center;
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: var(--radius-md);
            display: none;
            font-size: 0.875rem;
        }

        @media (max-width: 480px) {
            .card {
                padding: 1.5rem;
            }

            h1 {
                margin-bottom: 1.5rem;
            }
        }
    </style>
</head>

<body>
    <div class="card">
        <h1>InvoiceN</h1>
        <p
            style="text-align:center; color: var(--color-text-tertiary); font-size:0.875rem; margin-top:-1.25rem; margin-bottom:1.75rem;">
            Simple Invoice Generator for Business Owners</p>
        <div id="error-msg" class="error"></div>
        <form id="install-form">
            <div class="form-group">
                <label>Database Host</label>
                <input type="text" name="host" value="localhost" required>
            </div>
            <div class="form-group">
                <label>Database Name</label>
                <input type="text" name="name" required placeholder="invoicen">
            </div>
            <div class="form-group">
                <label>Database User</label>
                <input type="text" name="user" required placeholder="root">
            </div>
            <div class="form-group">
                <label>Database Password</label>
                <input type="password" name="pass" placeholder="Leave empty if none">
            </div>
            <div class="form-group">
                <label>Admin Email</label>
                <input type="email" name="admin_email" required placeholder="admin@example.com">
            </div>
            <div class="form-group">
                <label>Admin Password</label>
                <input type="password" name="admin_pass" required minlength="6">
            </div>
            <button type="submit">Install</button>
        </form>
    </div>

    <script>
        document.getElementById('install-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const errorDiv = document.getElementById('error-msg');

            btn.disabled = true;
            btn.innerText = 'Installing...';
            errorDiv.style.display = 'none';

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('setup.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    alert('Installation successful! Redirecting to login...');
                    window.location.href = '../';
                } else {
                    throw new Error(result.error || 'Installation failed');
                }
            } catch (err) {
                errorDiv.innerText = err.message;
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Install';
            }
        });
    </script>
</body>

</html>