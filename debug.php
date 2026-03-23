<?php
header('Content-Type: application/json');

$envData = [
    'getenv' => [
        'DB_HOST' => getenv('DB_HOST'),
        'PORT' => getenv('PORT'),
    ],
    '$_SERVER_DB_HOST' => $_SERVER['DB_HOST'] ?? 'NOT_SET',
    'shell_printenv' => shell_exec('printenv'),
    'php_sapi' => php_sapi_name(),
    'dot_env_exists' => file_exists('.env'),
];

echo json_encode($envData, JSON_PRETTY_PRINT);
