<?php
// api/Controllers/Controller.php

class Controller
{
    protected $conn;
    protected $userId;

    public function __construct($db, $userId)
    {
        $this->conn = $db;
        $this->userId = $userId;
    }

    protected function getJsonInput()
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    protected function jsonResponse($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
