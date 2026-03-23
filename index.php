<?php
// Support Environment Variables (Docker/Dokploy) or config.php
function getAppEnv($key, $default = null) {
    $val = getenv($key);
    if ($val !== false) return $val;
    if (isset($_ENV[$key])) return $_ENV[$key];
    if (isset($_SERVER[$key])) return $_SERVER[$key];
    
    // Case-insensitive fallback
    $upper = strtoupper($key);
    foreach ([$_ENV, $_SERVER] as $arr) {
        foreach ($arr as $k => $v) {
            if (strtoupper($k) === $upper) return $v;
        }
    }
    return $default;
}

if (file_exists('.env')) {
    $lines = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
        $_ENV[trim($name)] = trim($value);
        $_SERVER[trim($name)] = trim($value);
    }
}

$dbHost = getAppEnv('DB_HOST');
$isConfigured = file_exists('config.php') || $dbHost;

if (!$isConfigured) {
    header('Location: install/index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description"
        content="InvoiceN — Simple Invoice Generator for Business Owners. Manage invoices, clients, and products with ease.">
    <meta name="author" content="Kamrul Hasan">
    <link rel="icon" type="image/svg+xml"
        href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c2410c' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E">
    <title>InvoiceN</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="style.css?v=<?php echo filemtime('style.css'); ?>">

    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

    <!-- jsPDF CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>

<body>
    <div class="app-container">
        <!-- Sidebar Overlay -->
        <div class="sidebar-overlay" id="sidebar-overlay"></div>

        <!-- Sidebar Navigation -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
                        <path d="M12 20L18 26L28 14" stroke="white" stroke-width="3" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <defs>
                            <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
                                <stop offset="0%" stop-color="#c2410c" />
                                <stop offset="100%" stop-color="#9a3412" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1>InvoiceN</h1>

                </div>
            </div>

            <nav class="sidebar-nav">
                <a href="#dashboard" class="nav-item" data-route="dashboard">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M3 4C3 3.44772 3.44772 3 4 3H7C7.55228 3 8 3.44772 8 4V7C8 7.55228 7.55228 8 7 8H4C3.44772 8 3 7.55228 3 7V4Z"
                            stroke="currentColor" stroke-width="2" />
                        <path
                            d="M12 4C12 3.44772 12.4477 3 13 3H16C16.5523 3 17 3.44772 17 4V7C17 7.55228 16.5523 8 16 8H13C12.4477 8 12 7.55228 12 7V4Z"
                            stroke="currentColor" stroke-width="2" />
                        <path
                            d="M3 13C3 12.4477 3.44772 12 4 12H7C7.55228 12 8 12.4477 8 13V16C8 16.5523 7.55228 17 7 17H4C3.44772 17 3 16.5523 3 16V13Z"
                            stroke="currentColor" stroke-width="2" />
                        <path
                            d="M12 13C12 12.4477 12.4477 12 13 12H16C16.5523 12 17 12.4477 17 13V16C17 16.5523 16.5523 17 16 17H13C12.4477 17 12 16.5523 12 16V13Z"
                            stroke="currentColor" stroke-width="2" />
                    </svg>
                    <span>Dashboard</span>
                </a>

                <a href="#invoices" class="nav-item" data-route="invoices">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M6 2L6 18M14 2V18M2 6H18M2 10H18M2 14H18M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    <span>Invoices</span>
                </a>

                <a href="#products" class="nav-item" data-route="products">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 7L10 3L17 7M3 7L10 11M3 7V13L10 17M17 7L10 11M17 7V13L10 17M10 11V17"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span>Products</span>
                </a>

                <a href="#clients" class="nav-item" data-route="clients">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z"
                            stroke="currentColor" stroke-width="2" />
                        <path d="M2 17C2 14.2386 4.23858 12 7 12H11C13.7614 12 16 14.2386 16 17V18H2V17Z"
                            stroke="currentColor" stroke-width="2" />
                    </svg>
                    <span>Clients</span>
                </a>

                <a href="#settings" class="nav-item" data-route="settings">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"
                            stroke="currentColor" stroke-width="2" />
                        <path
                            d="M17.6569 10C17.6569 10.3453 17.5821 10.6804 17.4434 10.9854L18.8995 12.0711C19.1658 12.2763 19.2331 12.6513 19.0526 12.9389L17.5526 15.5611C17.3721 15.8487 17.0237 15.9737 16.7079 15.8553L14.9026 15.1789C14.5 15.4737 14.0526 15.7105 13.5711 15.8789L13.2895 17.7789C13.2368 18.1211 12.95 18.3789 12.6053 18.3789H9.60526C9.26053 18.3789 8.97368 18.1211 8.92105 17.7789L8.63947 15.8789C8.15789 15.7105 7.71053 15.4737 7.30789 15.1789L5.50263 15.8553C5.18684 15.9737 4.83842 15.8487 4.65789 15.5611L3.15789 12.9389C2.97737 12.6513 3.04474 12.2763 3.31105 12.0711L4.76711 10.9854C4.62842 10.6804 4.55368 10.3453 4.55368 10C4.55368 9.65474 4.62842 9.31974 4.76711 9.01474L3.31105 7.92895C3.04474 7.72368 2.97737 7.34868 3.15789 7.06105L4.65789 4.43895C4.83842 4.15132 5.18684 4.02632 5.50263 4.14474L7.30789 4.82105C7.71053 4.52632 8.15789 4.28947 8.63947 4.12105L8.92105 2.22105C8.97368 1.87895 9.26053 1.62105 9.60526 1.62105H12.6053C12.95 1.62105 13.2368 1.87895 13.2895 2.22105L13.5711 4.12105C14.0526 4.28947 14.5 4.52632 14.9026 4.82105L16.7079 4.14474C17.0237 4.02632 17.3721 4.15132 17.5526 4.43895L19.0526 7.06105C19.2331 7.34868 19.1658 7.72368 18.8995 7.92895L17.4434 9.01474C17.5821 9.31974 17.6569 9.65474 17.6569 10Z"
                            stroke="currentColor" stroke-width="2" />
                    </svg>
                    <span>Settings</span>
                </a>

                <a href="#" onclick="event.preventDefault(); window.Auth.logout()" class="nav-item logout-btn"
                    style="margin-top: auto;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Logout</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">

            <!-- Mobile Header -->
            <div class="mobile-header">
                <button id="mobile-menu-btn" class="mobile-menu-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <h1>InvoiceN</h1>
            </div>

            <div class="content-wrapper" id="app">

                <div class="loading-container">
                    <div class="spinner"></div>
                    <noscript>
                        <p style="color: #EF4444; margin-top: 20px;"><strong>Error: JavaScript is disabled. Please
                                enable it to use this app.</strong></p>
                    </noscript>
                </div>
            </div>
        </main>
    </div>


    <div class="modal-overlay" id="modalOverlay">
        <div class="modal" id="modal">
            <div class="modal-header">
                <h2 id="modalTitle">Modal Title</h2>
                <button class="modal-close" id="modalClose">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
            </div>
            <div class="modal-body" id="modalBody">
                <!-- Modal content will be rendered here -->
            </div>
        </div>
    </div>

    <!-- Quick Create Modal (sits above invoice modal for inline client/product creation) -->
    <div class="modal-overlay" id="quickCreateOverlay" style="z-index: 2500;">
        <div class="modal" id="quickCreateModal" style="max-width: 560px;">
            <div class="modal-header">
                <h2 id="quickCreateTitle">Create</h2>
                <button class="modal-close" id="quickCreateClose">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
            </div>
            <div class="modal-body" id="quickCreateBody">
                <!-- Content rendered by JS -->
            </div>
        </div>
    </div>

    <!-- Confirm Modal -->
    <div class="modal-overlay" id="confirmOverlay" style="z-index: 2000;">
        <div class="modal" id="confirmModal" style="max-width: 400px; text-align: center;">
            <div class="modal-body">
                <div style="margin-bottom: 1.5rem;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path
                            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z">
                        </path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <h3 id="confirmTitle" style="margin-bottom: 0.5rem; font-size: 1.25rem;">Are you sure?</h3>
                <p id="confirmMessage" style="color: grey; margin-bottom: 1.5rem;">This action cannot be undone.</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
                    <button class="btn btn-danger" id="confirmOk">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Immediate Active State Script -->
    <script>
        (function () {
            const hash = window.location.hash.slice(1) || 'dashboard';
            const activeLink = document.querySelector(`.nav-item[data-route="${hash}"]`);
            if (activeLink) {
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                activeLink.classList.add('active');
            }
        })();
    </script>

    <!-- Scripts -->
    <script type="module" src="main.js?v=<?php echo filemtime('main.js'); ?>"></script>
</body>

</html>