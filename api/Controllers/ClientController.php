<?php
// api/Controllers/ClientController.php

require_once __DIR__ . '/Controller.php';

class ClientController extends Controller
{
    public function handleRequest($method, $id)
    {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getById($id);
                } else {
                    $this->getAll();
                }
                break;
            case 'POST':
                $this->create();
                break;
            case 'PUT':
                if ($id) {
                    $this->update($id);
                } else {
                    $this->jsonResponse(['error' => 'ID required for update'], 400);
                }
                break;
            case 'DELETE':
                if ($id) {
                    $this->delete($id);
                } else {
                    $this->jsonResponse(['error' => 'ID required for deletion'], 400);
                }
                break;
            default:
                $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }

    private function getAll()
    {
        $stmt = $this->conn->prepare("SELECT * FROM clients WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $this->jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    private function getById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM clients WHERE id = :id AND user_id = :user_id");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($client) {
            $this->jsonResponse($client);
        } else {
            $this->jsonResponse(['error' => 'Client not found'], 404);
        }
    }

    private function create()
    {
        $data = $this->getJsonInput();

        if (empty($data['name'])) {
            $this->jsonResponse(['error' => 'Name is required'], 400);
            return;
        }

        $stmt = $this->conn->prepare("
            INSERT INTO clients (user_id, name, email, phone, address, created_at)
            VALUES (:user_id, :name, :email, :phone, :address, NOW())
        ");

        $execute = $stmt->execute([
            ':user_id' => $this->userId,
            ':name' => $data['name'],
            ':email' => $data['email'] ?? null,
            ':phone' => $data['phone'] ?? null,
            ':address' => $data['address'] ?? null
        ]);

        if ($execute) {
            $this->getById($this->conn->lastInsertId());
        } else {
            $this->jsonResponse(['error' => 'Failed to create client'], 500);
        }
    }

    private function update($id)
    {
        $data = $this->getJsonInput();

        $stmt = $this->conn->prepare("
            UPDATE clients 
            SET name = :name, 
                email = :email, 
                phone = :phone, 
                address = :address
            WHERE id = :id AND user_id = :user_id
        ");

        $execute = $stmt->execute([
            ':name' => $data['name'],
            ':email' => $data['email'] ?? null,
            ':phone' => $data['phone'] ?? null,
            ':address' => $data['address'] ?? null,
            ':id' => $id,
            ':user_id' => $this->userId
        ]);

        if ($execute) {
            $this->getById($id);
        } else {
            $this->jsonResponse(['error' => 'Failed to update client'], 500);
        }
    }

    private function delete($id)
    {
        // Check for linked invoices before deleting

        try {
            $stmt = $this->conn->prepare("DELETE FROM clients WHERE id = :id AND user_id = :user_id");
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $this->userId);

            if ($stmt->execute()) {
                $this->jsonResponse(['success' => true]);
            } else {
                $this->jsonResponse(['error' => 'Failed to delete client'], 500);
            }
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Cannot delete client in use'], 400);
        }
    }
}
