# InvoiceN — Simple Invoice Generator for Business Owners

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![PHP](https://img.shields.io/badge/php-%3E%3D8.0-8892BF.svg)

A Simple, self-hosted invoicing dashboard built with **Vanilla PHP** and **MySQL**. Manage clients, products, and invoices with a beautiful, dark-themed interface.

<img width="1841" height="931" alt="image" src="https://kamrul.net/assets/images/img_69b52dea28d42.webp" />


## 🚀 Features

-   **Dashboard**: Real-time overview of business performance.
-   **Invoicing**: Create, manage, and download PDF invoices.
-   **Email System**: Send invoices directly to clients via **SMTP** (supports Gmail, Outlook, etc.).
-   **Client Management**: Store client details for quick invoicing.
-   **Product/Service Management**: Manage your catalog.
-   **Settings**: Configure company details, tax rates, currency, and email settings.
-   **Automated Installer**: Easy-to-use wizard for first-time setup.
-   **Secure Auth**: Modern admin login system (username based).
-   **Dark Mode**: Stunning, modern UI design with loading animations for a smooth UX.
-   **Fully Responsive**: Optimized for desktop, tablet, and mobile devices.

## 📋 Requirements

-   **PHP**: 8.0 or higher
-   **Database**: MySQL 5.7+ or MariaDB
-   **Extensions**: `pdo_mysql`, `gd`, `mbstring` enabled

## 🛠️ Installation

### Standard Installation
1.  **Clone/Upload**: Copy all files to your web server (e.g., `public_html`).
2.  **Database**: Create a new MySQL database.
3.  **Install**: Open your website URL. You will be redirected to the **Installation Wizard**.
4.  **Setup**: Enter database credentials and create an admin account.

### Docker & Cloud Installation (Dokploy, Coolify, Railway, Heroku)
For Docker or cloud-based deployments where file permissions can be restrictive, you can bypass the `config.php` creation by using **Environment Variables**.

#### 1. Database Configuration
You can either provide a single connection string:
- `DATABASE_URL`: `mysql://user:pass@host:3306/dbname`

Or individual variables:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`

#### 2. Persistent Storage (Required for Logos)
Cloud containers are ephemeral. To ensure your **Company Logo** and other uploads are not lost during redeployment, you **must** mount a persistent volume to the `/app/uploads` directory.

**In Dokploy / Coolify:**
- Go to your Application -> **Volumes** tab.
- Add a new volume:
  - **Host Path:** `/var/lib/docker/volumes/invoicen_uploads/_data` (or any path on your host)
  - **Mount Path:** `/app/uploads`

**In Railway:**
- Right-click your Project Canvas -> **New** -> **Volume**.
- Connect the volume to your Application.
- Set the **Mount Path** to `/app/uploads`.

#### 3. Mandatory Initialization
Even when using environment variables, you **must** visit `your-app-url/install/index.php` once to initialize the database tables and create your initial admin account.

## 💻 Local Development

1.  Ensure PHP is installed.
2.  Run the built-in server:
    ```bash
    php -S localhost:8000 router.php
    ```
3.  Visit `http://localhost:8000`.

## 📂 Project Structure

-   `api/` - RESTful Backend Controllers & Database Logic
-   `install/` - Automated Installation Wizard
-   `src/` - Frontend UI Components (Vanilla JS)
-   `style.css` - Custom Dark-Themed UI Styles
-   `config.php` - Database Configuration (auto-generated)
-   `.env` - Environment Variable fallback (optional)

## 🌟 Why InvoiceN?

InvoiceN was built for business owners who want a **fast, private, and self-hosted** solution without the complexity of heavy frameworks. It uses a clean, modern "Ark UI" inspired dark theme and is optimized for low-latency performance.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👤 Author

**Kamrul Hasan**
-   Website: [kamrul.net](https://kamrul.net)
-   GitHub: [@kamrulbds725](https://github.com/kamrulbds725)

---

Built with ❤️ for the open-source community.
