<?php
// router.php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Serve existing files
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

// Route API requests
if (strpos($uri, '/api') === 0) {
    require __DIR__ . '/api/router.php';
    return true;
}

// Default to index.php
require __DIR__ . '/index.php';
