<?php
header('Content-Type: application/json');

$envData = [
    'getenv' => [
        'DB_HOST' => getenv('DB_HOST'),
        'PORT' => getenv('PORT'),
    ],
    '$_SERVER_DB_HOST' => $_SERVER['DB_HOST'] ?? 'NOT_SET',
    'php_sapi' => php_sapi_name(),
    'dot_env_exists' => file_exists('.env'),
    'loaded_extensions' => get_loaded_extensions(),
    'pdo_drivers' => PDO::getAvailableDrivers(),
];

echo json_encode($envData, JSON_PRETTY_PRINT);
