<?php
// api/router.php

// Disable HTML error reporting to prevent breaking JSON response
ini_set('display_errors', 0);
error_reporting(E_ALL);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Helper to send JSON response
function jsonResponse($data, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Helper to get input data
function getJsonInput()
{
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Basic router logic
$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Simple path matching
// Expected format: /api/{resource}/{id?}

$basePath = '/api';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

$parts = explode('/', trim($path, '/'));
$resource = $parts[0] ?? null;
$id = $parts[1] ?? null;

if (!$resource) {
    jsonResponse(['error' => 'No resource specified'], 400);
}

// Check database connection
require_once __DIR__ . '/db.php';
$db = new Database();
$conn = $db->connect();

if (!$conn) {
    jsonResponse(['error' => 'Database connection failed. Please check your config.', 'code' => 'NOT_INSTALLED'], 503);
}

// Authentication check (except for login/setup)
require_once __DIR__ . '/Context/Auth.php';
$auth = new Auth($conn);

if ($resource === 'auth') {
    if ($method === 'POST' && $id === 'login') {
        $input = getJsonInput();
        $result = $auth->login($input['email'] ?? '', $input['password'] ?? '');
        if ($result['success']) {
            jsonResponse($result);
        } else {
            jsonResponse($result, 401);
        }
    } elseif ($method === 'POST' && $id === 'logout') {
        $auth->logout();
        jsonResponse(['success' => true]);
    } elseif ($method === 'GET' && $id === 'user') {
        $user = $auth->currentUser();
        if ($user) {
            jsonResponse(['user' => $user]);
        } else {
            jsonResponse(['user' => null]);
        }
    } else {
        jsonResponse(['error' => 'Invalid auth endpoint'], 404);
    }
}

// Protect other routes
if (!$auth->isAuthenticated()) {
    jsonResponse(['error' => 'Unauthorized'], 401);
}

// Resource Handlers
// We can use a simple switch or dynamic inclusion
switch ($resource) {
    case 'invoices':
        require_once __DIR__ . '/Controllers/InvoiceController.php';
        $controller = new InvoiceController($conn, $auth->getUserId());
        $controller->handleRequest($method, $id);
        break;
    case 'clients':
        require_once __DIR__ . '/Controllers/ClientController.php';
        $controller = new ClientController($conn, $auth->getUserId());
        $controller->handleRequest($method, $id);
        break;
    case 'products':
        require_once __DIR__ . '/Controllers/ProductController.php';
        $controller = new ProductController($conn, $auth->getUserId());
        $controller->handleRequest($method, $id);
        break;
    case 'settings':
        require_once __DIR__ . '/Controllers/SettingsController.php';
        $controller = new SettingsController($conn, $auth->getUserId());
        $controller->handleRequest($method, $id);
        break;
    default:
        jsonResponse(['error' => 'Resource not found'], 404);
}
