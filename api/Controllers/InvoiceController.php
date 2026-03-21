<?php
// api/Controllers/InvoiceController.php

require_once __DIR__ . '/Controller.php';
require_once __DIR__ . '/../libs/MailService.php';

class InvoiceController extends Controller
{
    public function handleRequest($method, $id)
    {
        if ($method === 'GET') {
            if ($id)
                $this->get($id);
            else
                $this->getAll();
        } elseif ($method === 'POST') {
            // Check for specific actions
            if ($id === 'send') {
                $this->sendEmail();
            } else {
                $this->create();
            }
        } elseif ($method === 'PUT') {
            $this->update($id);
        } elseif ($method === 'DELETE') {
            $this->delete($id);
        } else {
            $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }

    private function getAll()
    {
        $stmt = $this->conn->prepare("
            SELECT i.*, c.name as client_name 
            FROM invoices i 
            LEFT JOIN clients c ON i.client_id = c.id 
            WHERE i.user_id = :user_id 
            ORDER BY i.created_at DESC
        ");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch items for each invoice (could be optimized with JOIN but keep simple)
        foreach ($invoices as &$invoice) {
            $invoice['items'] = $this->getItems($invoice['id']);
        }

        $this->jsonResponse($invoices);
    }

    private function get($id)
    {
        $stmt = $this->conn->prepare("
            SELECT i.*, c.name as client_name, c.email as client_email, c.address as client_address, c.phone as client_phone
            FROM invoices i 
            LEFT JOIN clients c ON i.client_id = c.id 
            WHERE i.id = :id AND i.user_id = :user_id
        ");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($invoice) {
            $invoice['items'] = $this->getItems($id);
            $this->jsonResponse($invoice);
        } else {
            $this->jsonResponse(['error' => 'Invoice not found'], 404);
        }
    }

    private function getItems($invoiceId)
    {
        $stmt = $this->conn->prepare("SELECT * FROM invoice_items WHERE invoice_id = :invoice_id");
        $stmt->bindParam(':invoice_id', $invoiceId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function create()
    {
        $data = $this->getJsonInput();

        if (empty($data['clientId']) || empty($data['date']) || empty($data['invoiceNumber'])) {
            $this->jsonResponse(['error' => 'Client, date, and invoice number are required'], 400);
            return;
        }

        try {
            $this->conn->beginTransaction();

            $stmt = $this->conn->prepare("
                INSERT INTO invoices (
                    user_id, client_id, date, due_date, status, notes, 
                    subtotal, tax, discount, total, invoice_number, invoice_prefix
                ) VALUES (
                    :user_id, :client_id, :date, :due_date, :status, :notes, 
                    :subtotal, :tax, :discount, :total, :invoice_number, :invoice_prefix
                )
            ");

            $stmt->execute([
                ':user_id' => $this->userId,
                ':client_id' => $data['clientId'],
                ':date' => $data['date'],
                ':due_date' => $data['dueDate'],
                ':status' => $data['status'],
                ':notes' => $data['notes'],
                ':subtotal' => $data['subtotal'],
                ':tax' => $data['tax'],
                ':discount' => $data['discount'],
                ':total' => $data['total'],
                ':invoice_number' => $data['invoiceNumber'],
                ':invoice_prefix' => $data['invoicePrefix'] ?? 'INV'
            ]);

            $invoiceId = $this->conn->lastInsertId();

            if (!empty($data['items'])) {
                $this->saveItems($invoiceId, $data['items']);
            }

            $this->conn->commit();
            $this->jsonResponse(['id' => $invoiceId, 'message' => 'Invoice created']);

        } catch (Exception $e) {
            $this->conn->rollBack();
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    private function update($id)
    {
        $data = $this->getJsonInput();

        try {
            $this->conn->beginTransaction();

            // Verify ownership and get existing data
            $stmt = $this->conn->prepare("SELECT * FROM invoices WHERE id = :id AND user_id = :user_id");
            $stmt->execute([':id' => $id, ':user_id' => $this->userId]);
            $existingInvoice = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$existingInvoice) {
                throw new Exception("Invoice not found or access denied");
            }

            $stmt = $this->conn->prepare("
                UPDATE invoices SET 
                    client_id = :client_id, date = :date, due_date = :due_date, 
                    status = :status, notes = :notes, 
                    subtotal = :subtotal, tax = :tax, discount = :discount, total = :total,
                    invoice_number = :invoice_number,
                    tax_rate = :tax_rate, currency = :currency
                WHERE id = :id AND user_id = :user_id
            ");

            $stmt->execute([
                ':client_id' => isset($data['clientId']) ? $data['clientId'] : $existingInvoice['client_id'],
                ':date' => isset($data['date']) ? $data['date'] : $existingInvoice['date'],
                ':due_date' => isset($data['dueDate']) ? $data['dueDate'] : $existingInvoice['due_date'],
                ':status' => isset($data['status']) ? $data['status'] : $existingInvoice['status'],
                ':notes' => isset($data['notes']) ? $data['notes'] : $existingInvoice['notes'],
                ':subtotal' => isset($data['subtotal']) ? $data['subtotal'] : $existingInvoice['subtotal'],
                ':tax' => isset($data['tax']) ? $data['tax'] : $existingInvoice['tax'],
                ':discount' => isset($data['discount']) ? $data['discount'] : $existingInvoice['discount'],
                ':total' => isset($data['total']) ? $data['total'] : $existingInvoice['total'],
                ':invoice_number' => isset($data['invoiceNumber']) ? $data['invoiceNumber'] : $existingInvoice['invoice_number'],
                ':tax_rate' => isset($data['taxRate']) ? $data['taxRate'] : $existingInvoice['tax_rate'],
                ':currency' => isset($data['currency']) ? $data['currency'] : $existingInvoice['currency'],
                ':id' => $id,
                ':user_id' => $this->userId
            ]);

            // Only update items if they were explicitly provided
            if (isset($data['items'])) {
                // Clear existing items and re-add
                $stmt = $this->conn->prepare("DELETE FROM invoice_items WHERE invoice_id = :invoice_id");
                $stmt->execute([':invoice_id' => $id]);

                if (!empty($data['items'])) {
                    $this->saveItems($id, $data['items']);
                }
            }

            $this->conn->commit();
            $this->jsonResponse(['message' => 'Invoice updated']);

        } catch (Exception $e) {
            $this->conn->rollBack();
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    private function saveItems($invoiceId, $items)
    {
        $stmt = $this->conn->prepare("
            INSERT INTO invoice_items (
                invoice_id, product_id, name, description, quantity, price, total
            ) VALUES (
                :invoice_id, :product_id, :name, :description, :quantity, :price, :total
            )
        ");

        foreach ($items as $item) {
            $stmt->execute([
                ':invoice_id' => $invoiceId,
                ':product_id' => $item['productId'] ?? null, // Can be null if custom item
                ':name' => $item['name'],
                ':description' => $item['description'] ?? '',
                ':quantity' => $item['quantity'],
                ':price' => $item['price'],
                ':total' => $item['quantity'] * $item['price']
            ]);
        }
    }

    private function delete($id)
    {
        $stmt = $this->conn->prepare("DELETE FROM invoices WHERE id = :id AND user_id = :user_id");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $this->jsonResponse(['message' => 'Invoice deleted']);
        } else {
            $this->jsonResponse(['error' => 'Invoice not found'], 404);
        }
    }

    // NEW: Email Sending
    private function sendEmail()
    {
        // Handle file upload and form data
        // Since we are uploading a file, we can't use getJsonInput. We must use $_POST and $_FILES

        $to = $_POST['to'] ?? '';
        $subject = $_POST['subject'] ?? 'Invoice';
        $message = $_POST['message'] ?? '';
        $invoiceId = $_POST['invoice_id'] ?? null; // Optional, for logging/status update

        if (empty($to)) {
            $this->jsonResponse(['error' => 'Recipient email is required'], 400);
            return;
        }

        $mailService = new MailService($this->conn, $this->userId);

        $attachmentPath = null;
        $attachmentName = 'invoice.pdf';

        // Check for file upload
        if (isset($_FILES['pdf']) && $_FILES['pdf']['error'] === UPLOAD_ERR_OK) {
            $tmpName = $_FILES['pdf']['tmp_name'];
            $attachmentName = $_FILES['pdf']['name'];
            $attachmentPath = $tmpName; // We can use the tmp file directly then let PHP clean it up
        }

        try {
            $result = $mailService->send($to, $subject, $message, $attachmentPath, $attachmentName);

            if ($result === false) {
                throw new Exception("Mail delivery failed (server returned false)");
            }

            // Optionally update invoice status to 'sent'
            if ($invoiceId) {
                // Verify ownership loosely (if needed) or just update
                $stmt = $this->conn->prepare("UPDATE invoices SET status = 'sent' WHERE id = :id AND user_id = :user_id AND status != 'paid'");
                $stmt->execute([':id' => $invoiceId, ':user_id' => $this->userId]);
            }

            $this->jsonResponse(['success' => true, 'message' => 'Email sent successfully']);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => 'Failed to send email: ' . $e->getMessage()], 500);
        }
    }
}
