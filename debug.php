<?php
header('Content-Type: application/json');
$data = [
    'php_version' => PHP_VERSION,
    'extensions' => [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'gd' => extension_loaded('gd'),
        'mbstring' => extension_loaded('mbstring'),
    ],
    'pdo_drivers' => PDO::getAvailableDrivers(),
    'display_errors' => ini_get('display_errors'),
    'error_reporting' => ini_get('error_reporting'),
];
echo json_encode($data, JSON_PRETTY_PRINT);
