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
            /* Colors — Ark UI Dark Theme (Simplified) */
            --color-bg-primary: #0d0d0d;
            --color-bg-secondary: #111111;
            --color-bg-tertiary: #191918;
            
            /* Text Colors */
            --color-text-primary: #eeeeec;
            --color-text-secondary: #b5b3ad;
            --color-text-tertiary: #878580;

            /* Accent Colors */
            --color-primary: #c2410c;
            --color-primary-hover: #9a3412;
            
            /* Border */
            --color-border: #2a2a2a;
            
            /* Radius */
            --radius-md: 4px;
            
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
        }

        .card {
            background: var(--color-bg-secondary);
            padding: 2.5rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
            width: 100%;
            max-width: 400px;
        }

        h1 {
            margin-top: 0;
            color: var(--color-primary);
            text-align: center;
            font-weight: 700;
            margin-bottom: 2rem;
            font-size: 1.75rem;
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
            font-size: 0.9rem;
        }

        input:focus {
            outline: none;
            border-color: var(--color-primary);
        }

        button {
            width: 100%;
            padding: 0.875rem;
            background: var(--color-primary);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1rem;
        }

        button:hover {
            background: var(--color-primary-hover);
        }

        button:disabled {
            background: #444;
            cursor: not-allowed;
        }

        .error {
            color: #ef4444;
            margin-bottom: 1.5rem;
            text-align: center;
            padding: 0.75rem;
            background: #1a1010;
            border: 1px solid #442222;
            border-radius: var(--radius-md);
            display: none;
            font-size: 0.875rem;
        }

        @media (max-width: 480px) {
            .card {
                padding: 1.5rem;
            }
        }
    </style>
</head>

<body>
    <div class="card">
        <?php
        // Load .env if it exists
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                list($name, $value) = explode('=', $line, 2);
                putenv(trim($name) . '=' . trim($value));
                $_ENV[trim($name)] = trim($value);
                $_SERVER[trim($name)] = trim($value);
            }
        }
        ?>
        <h1>InvoiceN</h1>
        <p
            style="text-align:center; color: var(--color-text-tertiary); font-size:0.875rem; margin-top:-1.25rem; margin-bottom:1.75rem;">
            Simple Invoice Generator for Business Owners</p>
        <div id="error-msg" class="error"></div>
        <!-- Debug Helper -->
        <div style="font-size: 0.6rem; color: #333; margin-bottom: 10px;">
            DEBUG: <?php 
                $check = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? 'None');
                echo "DB_HOST Detected: " . ($check !== 'None' ? 'YES (' . $check . ')' : 'NO');
            ?>
        </div>
        <form id="install-form">
            <?php
            $envHost = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? null);
            if ($envHost):
            ?>
                <div style="background: rgba(13, 148, 136, 0.1); border: 1px solid rgba(13, 148, 136, 0.2); padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 0.8rem; color: #0d9488;">
                    <strong>Notice:</strong> Database is configured via Environment Variables. You only need to set up the Admin account.
                </div>
                <input type="hidden" name="host" value="<?php echo htmlspecialchars($envHost); ?>">
                <input type="hidden" name="name" value="<?php echo htmlspecialchars(getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'] ?? '')); ?>">
                <input type="hidden" name="user" value="<?php echo htmlspecialchars(getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? $_SERVER['DB_USER'] ?? '')); ?>">
                <input type="hidden" name="pass" value="<?php echo htmlspecialchars(getenv('DB_PASS') ?: ($_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'] ?? '')); ?>">
            <?php else: ?>
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
            <?php endif; ?>

            <div class="form-group">
                <label>Admin Username</label>
                <input type="text" name="admin_user" required placeholder="admin">
            </div>
            <div class="form-group">
                <label>Admin Password</label>
                <input type="password" name="admin_pass" required minlength="6">
            </div>
            <button type="submit">Install & Initialize</button>
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
                    btn.innerText = 'Success!';
                    errorDiv.innerHTML = 'Installation successful! Redirecting to login...';
                    errorDiv.style.background = '#064e3b';
                    errorDiv.style.color = '#10b981';
                    errorDiv.style.borderColor = '#065f46';
                    errorDiv.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = '../';
                    }, 2000);
                } else {
                    if (result.manual_config) {
                        errorDiv.innerHTML = `${result.error}<br><br><strong>Manual Fix:</strong> Create a file named <code>config.php</code> in the root directory and paste the following:<br><pre id="manual-code" style="text-align:left; background:#000; padding:10px; margin-top:10px; border:1px solid #333; color:#fff; overflow-x:auto; white-space:pre-wrap;"></pre>`;
                        document.getElementById('manual-code').innerText = result.manual_config;
                        errorDiv.style.display = 'block';
                    } else {
                        throw new Error(result.error || 'Installation failed');
                    }
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