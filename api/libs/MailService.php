<?php
// api/libs/MailService.php

class MailService
{
    private $conn;
    private $userId;
    private $settings;

    public function __construct($db, $userId)
    {
        $this->conn = $db;
        $this->userId = $userId;
        $this->loadSettings();
    }

    private function loadSettings()
    {
        $stmt = $this->conn->prepare("SELECT * FROM settings WHERE user_id = :user_id LIMIT 1");
        $stmt->bindParam(':user_id', $this->userId);
        $stmt->execute();
        $this->settings = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function send($to, $subject, $message, $attachmentPath = null, $attachmentName = 'invoice.pdf')
    {
        if (!$this->settings) {
            throw new Exception("Settings not found");
        }

        // Always use SMTP
        return $this->sendSMTP($to, $subject, $message, $attachmentPath, $attachmentName);
    }

    private function sendSMTP($to, $subject, $message, $attachmentPath, $attachmentName)
    {
        $host = $this->settings['smtp_host'];
        $port = $this->settings['smtp_port'];
        $username = $this->settings['smtp_username'];
        $password = $this->settings['smtp_password'];
        $encryption = $this->settings['smtp_encryption']; // ssl, tls, or none
        $fromEmail = $this->settings['smtp_from_email'] ?? $username;
        $fromName = $this->settings['smtp_from_name'] ?? 'Invoice System';

        if (empty($host) || empty($username) || empty($password)) {
            throw new Exception("SMTP settings are incomplete");
        }

        // SSL verification disabled for shared hosting compatibility.
        // For production environments with proper certificates, set verify_peer
        // and verify_peer_name to true for stronger security.
        $contextOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ];
        $context = stream_context_create($contextOptions);

        $protocol = '';
        if ($encryption === 'ssl')
            $protocol = 'ssl://';
        if ($encryption === 'tls')
            $protocol = 'tcp://'; // STARTTLS handled later

        $server = $protocol . $host . ':' . $port;
        // custom timeout to 30s
        $connection = stream_socket_client($server, $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);

        if (!$connection) {
            throw new Exception("Could not connect to SMTP server: $errstr ($errno)");
        }

        $this->readResponse($connection);

        $this->sendCommand($connection, "EHLO " . $_SERVER['SERVER_NAME']);

        if ($encryption === 'tls') {
            $this->sendCommand($connection, "STARTTLS");
            // Enable crypto with the same context options implicitly? 
            // stream_socket_enable_crypto doesn't take context, it uses the stream's context.
            if (!stream_socket_enable_crypto($connection, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new Exception("Failed to start TLS encryption");
            }
            $this->sendCommand($connection, "EHLO " . $_SERVER['SERVER_NAME']);
        }

        $this->sendCommand($connection, "AUTH LOGIN");
        $this->sendCommand($connection, base64_encode($username));
        $this->sendCommand($connection, base64_encode($password));

        $this->sendCommand($connection, "MAIL FROM: <$fromEmail>");
        $this->sendCommand($connection, "RCPT TO: <$to>");
        $this->sendCommand($connection, "DATA");

        // Headers
        $boundary = md5(uniqid(time()));
        $headers = "From: \"$fromName\" <$fromEmail>\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "Subject: $subject\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

        $body = "--$boundary\r\n";
        $body .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
        $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
        $body .= "$message\r\n\r\n";

        // Attachment
        if ($attachmentPath && file_exists($attachmentPath)) {
            $fileContent = file_get_contents($attachmentPath);
            $encodedContent = chunk_split(base64_encode($fileContent));

            $body .= "--$boundary\r\n";
            $body .= "Content-Type: application/pdf; name=\"$attachmentName\"\r\n";
            $body .= "Content-Disposition: attachment; filename=\"$attachmentName\"\r\n";
            $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $body .= "$encodedContent\r\n\r\n";
        }

        $body .= "--$boundary--\r\n";
        $body .= ".";

        $this->sendCommand($connection, $headers . "\r\n" . $body);
        $this->sendCommand($connection, "QUIT");

        fclose($connection);
        return true;
    }



    private function sendCommand($connection, $command)
    {
        fwrite($connection, $command . "\r\n");
        $this->readResponse($connection);
    }

    private function readResponse($connection)
    {
        $response = '';
        while ($str = fgets($connection, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == " ") {
                break;
            }
        }
        // Basic error checking
        $code = substr($response, 0, 3);
        if ($code >= 400) {
            throw new Exception("SMTP Error: $response");
        }
        return $response;
    }
}
