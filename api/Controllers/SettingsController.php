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
            // 1. Add SMTP columns if missing
            $this->conn->query("SELECT smtp_host FROM settings LIMIT 1");
        } catch (PDOException $e) {
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
            } catch (PDOException $e2) {}
        }

        try {
            // 2. Ensure logo column is LONGTEXT for Base64 storage
            $this->conn->exec("ALTER TABLE settings MODIFY COLUMN logo LONGTEXT");
        } catch (PDOException $e) {
            // Column might already be LONGTEXT or doesn't exist yet (unlikely)
        }
    }

    private function get()
    {
        $stmt = $this->conn->prepare("SELECT * FROM settings WHERE user_id = :user_id LIMIT 1");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($settings) {
            $this->jsonResponse($settings);
        } else {
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
        // We now store the entire data URI in the database
        if (isset($data['logo']) && strpos($data['logo'], 'data:image') === 0) {
            // No action needed, $data['logo'] already contains the base64 string
        } elseif (array_key_exists('logo', $data) && empty($data['logo'])) {
            $data['logo'] = null;
        }

        // Upsert approach...
        $stmtCheck = $this->conn->prepare("SELECT id FROM settings WHERE user_id = :user_id");
        $stmtCheck->bindParam(':user_id', $this->userId);
        $stmtCheck->execute();
        $exists = $stmtCheck->fetchColumn();

        if ($exists) {
            $sql = "UPDATE settings SET updated_at = NOW()";
            $params = [':user_id' => $this->userId];

            $fields = [
                'companyName' => 'company_name',
                'companyEmail' => 'company_email',
                'companyPhone' => 'company_phone',
                'companyAddress' => 'company_address',
                'logo' => 'logo',
                'taxRate' => 'tax_rate',
                'currency' => 'currency',
                'invoicePrefix' => 'invoice_prefix',
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

    // Removed handleLogoUpload and deleteLogo as they are no longer needed for file storage


    private function reset()
    {
        $stmt = $this->conn->prepare("DELETE FROM settings WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $this->jsonResponse(['success' => true]);
    }
}
