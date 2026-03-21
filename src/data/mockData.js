// Mock Data for Initial Demo

export const mockClients = [
    {
        id: '1',
        name: 'Acme Corporation',
        email: 'contact@acmecorp.com',
        phone: '+1 (555) 234-5678',
        address: '456 Enterprise Ave\nNew York, NY 10001',
        createdAt: '2026-01-15T10:00:00Z'
    },
    {
        id: '2',
        name: 'TechStart Inc',
        email: 'billing@techstart.io',
        phone: '+1 (555) 345-6789',
        address: '789 Innovation Blvd\nSan Francisco, CA 94102',
        createdAt: '2026-01-10T14:30:00Z'
    },
    {
        id: '3',
        name: 'Global Solutions Ltd',
        email: 'accounts@globalsolutions.com',
        phone: '+1 (555) 456-7890',
        address: '321 Business Park\nChicago, IL 60601',
        createdAt: '2026-01-05T09:15:00Z'
    },
    {
        id: '4',
        name: 'Creative Studio',
        email: 'hello@creativestudio.design',
        phone: '+1 (555) 567-8901',
        address: '654 Design District\nAustin, TX 78701',
        createdAt: '2025-12-20T11:45:00Z'
    }
];

export const mockProducts = [
    {
        id: '1',
        name: 'Web Development',
        description: 'Custom website development and design',
        price: 5000,
        sku: 'WEB-001',
        category: 'Services',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: '2',
        name: 'Mobile App Development',
        description: 'iOS and Android app development',
        price: 8000,
        sku: 'MOB-001',
        category: 'Services',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: '3',
        name: 'UI/UX Design',
        description: 'User interface and experience design',
        price: 3000,
        sku: 'DES-001',
        category: 'Services',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: '4',
        name: 'SEO Optimization',
        description: 'Search engine optimization services',
        price: 1500,
        sku: 'SEO-001',
        category: 'Services',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: '5',
        name: 'Consulting (Hourly)',
        description: 'Technical consulting services',
        price: 150,
        sku: 'CON-001',
        category: 'Services',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: '6',
        name: 'Maintenance Package',
        description: 'Monthly website maintenance',
        price: 500,
        sku: 'MAIN-001',
        category: 'Services',
        createdAt: '2026-01-01T00:00:00Z'
    }
];

export const mockInvoices = [
    {
        id: '1',
        invoiceNumber: 'INV-2026-001',
        clientId: '1',
        date: '2026-01-20T00:00:00Z',
        dueDate: '2026-02-20T00:00:00Z',
        status: 'Sent',
        items: [
            {
                id: '1',
                productId: '1',
                name: 'Web Development',
                description: 'E-commerce website development',
                quantity: 1,
                price: 5000
            },
            {
                id: '2',
                productId: '3',
                name: 'UI/UX Design',
                description: 'Complete design system',
                quantity: 1,
                price: 3000
            }
        ],
        subtotal: 8000,
        tax: 800,
        discount: 0,
        total: 8800,
        notes: 'Payment terms: Net 30 days',
        createdAt: '2026-01-20T10:00:00Z'
    },
    {
        id: '2',
        invoiceNumber: 'INV-2026-002',
        clientId: '2',
        date: '2026-01-15T00:00:00Z',
        dueDate: '2026-02-15T00:00:00Z',
        status: 'Paid',
        items: [
            {
                id: '1',
                productId: '2',
                name: 'Mobile App Development',
                description: 'iOS app development',
                quantity: 1,
                price: 8000
            }
        ],
        subtotal: 8000,
        tax: 800,
        discount: 500,
        total: 8300,
        notes: 'Early payment discount applied',
        createdAt: '2026-01-15T14:30:00Z'
    },
    {
        id: '3',
        invoiceNumber: 'INV-2026-003',
        clientId: '3',
        date: '2026-01-10T00:00:00Z',
        dueDate: '2026-01-25T00:00:00Z',
        status: 'Overdue',
        items: [
            {
                id: '1',
                productId: '4',
                name: 'SEO Optimization',
                description: 'Complete SEO audit and optimization',
                quantity: 1,
                price: 1500
            },
            {
                id: '2',
                productId: '5',
                name: 'Consulting (Hourly)',
                description: 'Technical consulting - 10 hours',
                quantity: 10,
                price: 150
            }
        ],
        subtotal: 3000,
        tax: 300,
        discount: 0,
        total: 3300,
        notes: 'Please remit payment as soon as possible',
        createdAt: '2026-01-10T09:00:00Z'
    },
    {
        id: '4',
        invoiceNumber: 'INV-2026-004',
        clientId: '4',
        date: '2026-01-25T00:00:00Z',
        dueDate: '2026-02-25T00:00:00Z',
        status: 'Draft',
        items: [
            {
                id: '1',
                productId: '6',
                name: 'Maintenance Package',
                description: 'Monthly maintenance - 3 months',
                quantity: 3,
                price: 500
            }
        ],
        subtotal: 1500,
        tax: 150,
        discount: 0,
        total: 1650,
        notes: 'Draft - pending client approval',
        createdAt: '2026-01-25T16:00:00Z'
    },
    {
        id: '5',
        invoiceNumber: 'INV-2026-005',
        clientId: '1',
        date: '2025-12-15T00:00:00Z',
        dueDate: '2026-01-15T00:00:00Z',
        status: 'Paid',
        items: [
            {
                id: '1',
                productId: '5',
                name: 'Consulting (Hourly)',
                description: 'Strategy consulting - 20 hours',
                quantity: 20,
                price: 150
            }
        ],
        subtotal: 3000,
        tax: 300,
        discount: 0,
        total: 3300,
        notes: 'Paid via wire transfer',
        createdAt: '2025-12-15T10:00:00Z'
    },
    {
        id: '6',
        invoiceNumber: 'INV-2025-012',
        clientId: '2',
        date: '2025-11-20T00:00:00Z',
        dueDate: '2025-12-20T00:00:00Z',
        status: 'Paid',
        items: [
            {
                id: '1',
                productId: '1',
                name: 'Web Development',
                description: 'Landing page development',
                quantity: 1,
                price: 5000
            }
        ],
        subtotal: 5000,
        tax: 500,
        discount: 0,
        total: 5500,
        notes: 'Paid in full',
        createdAt: '2025-11-20T10:00:00Z'
    }
];
