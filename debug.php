<?php
header('Content-Type: application/json');

// Load .env if it exists
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
        $_ENV[trim($name)] = trim($value);
        $_SERVER[trim($name)] = trim($value);
    }
}

$envData = [
    'getenv' => [
        'DB_HOST' => getenv('DB_HOST'),
        'DB_NAME' => getenv('DB_NAME'),
        'DB_USER' => getenv('DB_USER'),
        'DB_PASS' => getenv('DB_PASS') ? '***SET***' : '***MISSING***',
    ],
    '$_ENV' => [
        'DB_HOST' => $_ENV['DB_HOST'] ?? 'NOT_SET',
        'DB_NAME' => $_ENV['DB_NAME'] ?? 'NOT_SET',
        'DB_USER' => $_ENV['DB_USER'] ?? 'NOT_SET',
    ],
    '$_SERVER' => [
        'DB_HOST' => $_SERVER['DB_HOST'] ?? 'NOT_SET',
        'DB_NAME' => $_SERVER['DB_NAME'] ?? 'NOT_SET',
        'DB_USER' => $_SERVER['DB_USER'] ?? 'NOT_SET',
    ],
    'dot_env_exists' => file_exists('.env'),
    'php_sapi' => php_sapi_name()
];

echo json_encode($envData, JSON_PRETTY_PRINT);
