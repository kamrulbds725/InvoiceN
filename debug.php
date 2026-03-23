<?php
header('Content-Type: application/json');

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
    'all_server_keys' => array_keys($_SERVER),
    'php_sapi' => php_sapi_name()
];

echo json_encode($envData, JSON_PRETTY_PRINT);
