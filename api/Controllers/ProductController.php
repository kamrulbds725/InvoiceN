<?php
// api/Controllers/ProductController.php

require_once __DIR__ . '/Controller.php';

class ProductController extends Controller
{
    public function handleRequest($method, $id)
    {
        // Auto-patch schema if needed
        try {
            $this->conn->query("SELECT sku, category FROM products LIMIT 1");
        } catch (PDOException $e) {
            // Columns likely don't exist, let's add them
            try {
                $this->conn->exec("ALTER TABLE products ADD COLUMN sku VARCHAR(100) DEFAULT NULL, ADD COLUMN category VARCHAR(100) DEFAULT NULL");
            } catch (PDOException $e2) {
                // Ignore, maybe no permission, but try anyway
            }
        }

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
        $stmt = $this->conn->prepare("SELECT * FROM products WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $this->jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    private function getById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM products WHERE id = :id AND user_id = :user_id");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($product) {
            $this->jsonResponse($product);
        } else {
            $this->jsonResponse(['error' => 'Product not found'], 404);
        }
    }

    private function create()
    {
        $data = $this->getJsonInput();

        if (empty($data['name']) || !isset($data['price'])) {
            $this->jsonResponse(['error' => 'Name and Price are required'], 400);
            return;
        }

        try {
            $stmt = $this->conn->prepare("
                INSERT INTO products (user_id, sku, category, name, description, price, created_at)
                VALUES (:user_id, :sku, :category, :name, :description, :price, NOW())
            ");

            $execute = $stmt->execute([
                ':user_id' => $this->userId,
                ':sku' => $data['sku'] ?? null,
                ':category' => $data['category'] ?? null,
                ':name' => $data['name'],
                ':description' => $data['description'] ?? null,
                ':price' => $data['price']
            ]);

            if ($execute) {
                $this->getById($this->conn->lastInsertId());
            } else {
                $this->jsonResponse(['error' => 'Failed to create product'], 500);
            }
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    private function update($id)
    {
        $data = $this->getJsonInput();

        // Check if existing product exists to merge data if specific fields (like name) aren't passed
        // This is crucial for partial updates like currency conversion acting on only 'price'
        $stmtCheck = $this->conn->prepare("SELECT * FROM products WHERE id = :id AND user_id = :user_id");
        $stmtCheck->execute([':id' => $id, ':user_id' => $this->userId]);
        $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            $this->jsonResponse(['error' => 'Product not found'], 404);
        }

        try {
            $stmt = $this->conn->prepare("
                UPDATE products 
                SET name = :name, 
                    sku = :sku,
                    category = :category,
                    description = :description, 
                    price = :price
                WHERE id = :id AND user_id = :user_id
            ");

            $execute = $stmt->execute([
                ':name' => $data['name'] ?? $existing['name'],
                ':sku' => array_key_exists('sku', $data) ? $data['sku'] : $existing['sku'],
                ':category' => array_key_exists('category', $data) ? $data['category'] : $existing['category'],
                ':description' => array_key_exists('description', $data) ? $data['description'] : $existing['description'],
                ':price' => $data['price'] ?? $existing['price'],
                ':id' => $id,
                ':user_id' => $this->userId
            ]);

            if ($execute) {
                $this->getById($id);
            } else {
                $this->jsonResponse(['error' => 'Failed to update product'], 500);
            }
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    private function delete($id)
    {
        try {
            $stmt = $this->conn->prepare("DELETE FROM products WHERE id = :id AND user_id = :user_id");
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $this->userId);

            if ($stmt->execute()) {
                $this->jsonResponse(['success' => true]);
            } else {
                $this->jsonResponse(['error' => 'Failed to delete product'], 500);
            }
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Cannot delete product in use'], 400);
        }
    }
}
