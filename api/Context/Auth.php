<?php
// api/Context/Auth.php

class Auth
{
    private $conn;
    private $user_id = null;

    public function __construct($db)
    {
        $this->conn = $db;
        $this->startSession();
    }

    private function startSession()
    {
        if (session_status() === PHP_SESSION_NONE) {
            $lifetime = 60 * 60 * 24 * 30; // 30 days
            session_set_cookie_params([
                'lifetime' => $lifetime,
                'path' => '/',
                'secure' => isset($_SERVER['HTTPS']),
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            ini_set('session.gc_maxlifetime', $lifetime);
            session_start();
        }
    }

    public function login($email, $password)
    {
        if (empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'Email and password are required'];
        }

        $stmt = $this->conn->prepare("SELECT id, password_hash FROM users WHERE email = :email LIMIT 1");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $this->user_id = $user['id'];
            return ['success' => true, 'user' => $this->currentUser()];
        }

        return ['success' => false, 'error' => 'Invalid credentials'];
    }

    public function logout()
    {
        $_SESSION = array();
        session_destroy();
        $this->user_id = null;
    }

    public function isAuthenticated()
    {
        return isset($_SESSION['user_id']);
    }

    public function getUserId()
    {
        return $_SESSION['user_id'] ?? null;
    }

    public function currentUser()
    {
        if (!$this->isAuthenticated()) {
            return null;
        }

        $id = $_SESSION['user_id'];
        $stmt = $this->conn->prepare("SELECT id, email, created_at FROM users WHERE id = :id LIMIT 1");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
