# InvoiceN — Simple Invoice Generator for Business Owners

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![PHP](https://img.shields.io/badge/php-%3E%3D8.2-8892BF.svg)

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

-   **PHP**: 8.2 or higher
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

#### . Database Configuration
You can either provide a single connection string:
- `DATABASE_URL`: `mysql://user:pass@host:3306/dbname`

Or individual variables:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`

#### 2. Initialize Database (Mandatory)
Even after setting up environment variables, you **must visit** `your-app-url/install/index.php` manually the first time. This script will:
- Create the necessary database tables.
- Set up your initial **Admin Username** and **Password**.

**Note:** You will not be able to log in until you complete this step.

## 💻 Local Development

1.  Ensure PHP is installed.
2.  Run the built-in server:
    ```bash
    php -S localhost:8000 router.php
    ```
3.  Visit `http://localhost:8000`.

## 📂 Project Structure

-   `api/` - RESTful Backend Controllers & Database Logic
-   `assets/` - CSS and JS static assets
-   `install/` - Automated Installation Wizard
-   `src/` - Frontend UI Components (Vanilla JS)
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
