<?php
// api/Controllers/SettingsController.php

require_once __DIR__ . '/Controller.php';

class SettingsController extends Controller
{
    public function handleRequest($method, $id)
    {
        $this->upgradeDatabase();

        if ($method === 'GET') {
            $this->get();
        } elseif ($method === 'PUT' || $method === 'POST') {
            $this->update();
        } elseif ($method === 'DELETE') {
            $this->reset();
        } else {
            $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }

    private function upgradeDatabase()
    {
        try {
            // Test if smtp_host column exists
            $this->conn->query("SELECT smtp_host FROM settings LIMIT 1");
        } catch (PDOException $e) {
            // If it fails, that means the columns are missing. Add them explicitly.
            try {
                $this->conn->exec("
                    ALTER TABLE settings 
                    ADD COLUMN email_driver VARCHAR(50) DEFAULT 'mail',
                    ADD COLUMN smtp_host VARCHAR(255),
                    ADD COLUMN smtp_port INT,
                    ADD COLUMN smtp_username VARCHAR(255),
                    ADD COLUMN smtp_password VARCHAR(255),
                    ADD COLUMN smtp_encryption VARCHAR(50) DEFAULT 'tls',
                    ADD COLUMN smtp_from_name VARCHAR(255),
                    ADD COLUMN smtp_from_email VARCHAR(255)
                ");
            } catch (PDOException $e2) {
                // Ignore if it fails (perhaps partial upgrade)
            }
        }
    }

    private function get()
    {
        $stmt = $this->conn->prepare("SELECT * FROM settings WHERE user_id = :user_id LIMIT 1");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($settings) {
            // Don't expose password if not needed, or client handles masking
            // For now, return it so user can see it filled (or mask it in frontend)
            $this->jsonResponse($settings);
        } else {
            // Return empty object or defaults if not found (let frontend handle defaults)
            $this->jsonResponse(new stdClass());
        }
    }

    private function update()
    {
        $data = $this->getJsonInput();

        // Convert empty strings to null for strict DB columns
        foreach ($data as $k => $v) {
            if ($v === '') {
                $data[$k] = null;
            }
        }

        // Check if logo is a base64 string (new upload)
        if (isset($data['logo']) && strpos($data['logo'], 'data:image') === 0) {
            $data['logo'] = $this->handleLogoUpload($data['logo']);
        } elseif (array_key_exists('logo', $data) && empty($data['logo'])) {
            // If key exists but value is null/empty, user wants to delete logo
            $this->deleteLogo();
            $data['logo'] = null; // Ensure null is passed to DB
        }

        // Upsert approach
        // Check if exists first
        $stmtCheck = $this->conn->prepare("SELECT id FROM settings WHERE user_id = :user_id");
        $stmtCheck->bindParam(':user_id', $this->userId);
        $stmtCheck->execute();
        $exists = $stmtCheck->fetchColumn();

        if ($exists) {
            $sql = "UPDATE settings SET updated_at = NOW()";
            $params = [':user_id' => $this->userId];

            // Dynamic fields mapping
            $fields = [
                'companyName' => 'company_name',
                'companyEmail' => 'company_email',
                'companyPhone' => 'company_phone',
                'companyAddress' => 'company_address',
                'logo' => 'logo',
                'taxRate' => 'tax_rate',
                'currency' => 'currency',
                'invoicePrefix' => 'invoice_prefix',
                // Email Settings
                'emailDriver' => 'email_driver',
                'smtpHost' => 'smtp_host',
                'smtpPort' => 'smtp_port',
                'smtpUsername' => 'smtp_username',
                'smtpPassword' => 'smtp_password',
                'smtpEncryption' => 'smtp_encryption',
                'smtpFromName' => 'smtp_from_name',
                'smtpFromEmail' => 'smtp_from_email'
            ];

            foreach ($fields as $key => $dbCol) {
                // Use array_key_exists to allow updating to NULL (like deleting logo)
                if (array_key_exists($key, $data)) {
                    $sql .= ", $dbCol = :$dbCol";
                    $params[":$dbCol"] = $data[$key];
                }
            }

            $sql .= " WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);

        } else {
            $stmt = $this->conn->prepare("
                INSERT INTO settings (
                    user_id, company_name, company_email, company_phone, company_address, 
                    logo, tax_rate, currency, invoice_prefix, 
                    email_driver, smtp_host, smtp_port, smtp_username, smtp_password, smtp_encryption,
                    smtp_from_name, smtp_from_email,
                    updated_at
                ) VALUES (
                    :user_id, :company_name, :company_email, :company_phone, :company_address,
                    :logo, :tax_rate, :currency, :invoice_prefix,
                    :email_driver, :smtp_host, :smtp_port, :smtp_username, :smtp_password, :smtp_encryption,
                    :smtp_from_name, :smtp_from_email,
                    NOW()
                )
            ");

            $stmt->execute([
                ':user_id' => $this->userId,
                ':company_name' => $data['companyName'] ?? null,
                ':company_email' => $data['companyEmail'] ?? null,
                ':company_phone' => $data['companyPhone'] ?? null,
                ':company_address' => $data['companyAddress'] ?? null,
                ':logo' => $data['logo'] ?? null,
                ':tax_rate' => $data['taxRate'] ?? 0,
                ':currency' => $data['currency'] ?? 'USD',
                ':invoice_prefix' => $data['invoicePrefix'] ?? 'INV',

                ':email_driver' => $data['emailDriver'] ?? 'mail',
                ':smtp_host' => $data['smtpHost'] ?? null,
                ':smtp_port' => $data['smtpPort'] ?? null,
                ':smtp_username' => $data['smtpUsername'] ?? null,
                ':smtp_password' => $data['smtpPassword'] ?? null,
                ':smtp_encryption' => $data['smtpEncryption'] ?? 'tls',
                ':smtp_from_name' => $data['smtpFromName'] ?? null,
                ':smtp_from_email' => $data['smtpFromEmail'] ?? null
            ]);
        }

        $this->get();
    }

    private function handleLogoUpload($base64String)
    {
        // Delete old logo first
        $this->deleteLogo();

        // 1. Decode Base64
        $matches = [];
        preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches);
        $type = $matches[1] ?? 'png';
        $data = substr($base64String, strpos($base64String, ',') + 1);
        $data = base64_decode($data);

        if ($data === false) {
            throw new Exception("Invalid image data");
        }

        // 2. Create Uploads Directory
        $uploadDir = __DIR__ . '/../../uploads/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // 3. Generate unique filename
        $fileName = 'logo_' . $this->userId . '_' . time() . '.' . $type;
        $filePath = $uploadDir . $fileName;

        // 4. Save file
        file_put_contents($filePath, $data);

        // 5. Return public URL
        // Assuming API is at /api, so uploads is at root /uploads
        // We need to return a relative path that the frontend can use
        return 'uploads/' . $fileName;
    }

    private function deleteLogo()
    {
        // Get current logo path
        $stmt = $this->conn->prepare("SELECT logo FROM settings WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $currentLogo = $stmt->fetchColumn();

        if ($currentLogo && file_exists(__DIR__ . '/../../' . $currentLogo)) {
            unlink(__DIR__ . '/../../' . $currentLogo);
        }
    }

    private function reset()
    {
        $stmt = $this->conn->prepare("DELETE FROM settings WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $this->jsonResponse(['success' => true]);
    }
}
