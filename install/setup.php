<?php
// install/setup.php

// Disable HTML error reporting to prevent breaking JSON response
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Helper to send error response
function sendError($msg) {
    echo json_encode(['error' => $msg]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendError('Invalid input');
}

$host = $input['host'] ?? 'localhost';
$name = $input['name'] ?? '';
$user = $input['user'] ?? '';
$pass = $input['pass'] ?? '';
$adminEmail = $input['admin_email'] ?? '';
$adminPass = $input['admin_pass'] ?? '';

if (empty($name) || empty($user) || empty($adminEmail) || empty($adminPass)) {
    sendError('All fields required');
}

// 1. Test Connection
try {
    // Note: On Dokploy, ensure $host is the service name (e.g. 'mariadb')
    $dsn = "mysql:host=$host;dbname=$name";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    sendError('Database connection failed: ' . $e->getMessage());
}

// 2. Create Tables
try {
    $sql = "
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        category VARCHAR(100),
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        client_id INT,
        date DATE NOT NULL,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        subtotal DECIMAL(10, 2) DEFAULT 0,
        tax DECIMAL(10, 2) DEFAULT 0,
        discount DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        invoice_prefix VARCHAR(20),
        invoice_number VARCHAR(50), 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        product_id INT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity DECIMAL(10, 2) DEFAULT 1,
        price DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        company_name VARCHAR(255),
        company_email VARCHAR(255),
        company_phone VARCHAR(50),
        company_address TEXT,
        logo VARCHAR(255),
        tax_rate DECIMAL(5, 2),
        currency VARCHAR(10),
        invoice_prefix VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ";

    $pdo->exec($sql);

    // 3. Create Admin User
    $passHash = password_hash($adminPass, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash) VALUES (:email, :pass) ON DUPLICATE KEY UPDATE password_hash = :pass");
    $stmt->execute([':email' => $adminEmail, ':pass' => $passHash]);

} catch (PDOException $e) {
    sendError('Table creation failed: ' . $e->getMessage());
}

// 4. Write Config File
$configContent = "<?php
define('DB_HOST', '" . addslashes($host) . "');
define('DB_NAME', '" . addslashes($name) . "');
define('DB_USER', '" . addslashes($user) . "');
define('DB_PASS', '" . addslashes($pass) . "');
";

$configFile = __DIR__ . '/../config.php';
if (@file_put_contents($configFile, $configContent)) {
    echo json_encode(['success' => true]);
} else {
    sendError('Failed to write config.php at ' . realpath(__DIR__ . '/..') . '. Please check folder permissions.');
}

