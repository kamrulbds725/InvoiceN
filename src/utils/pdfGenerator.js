// PDF Generator using jsPDF

import { SettingsStore } from '../data/store.js';
import { formatCurrency, formatDate } from './helpers.js';
import { Toast } from '../components/Toast.js';

export async function generatePDF(invoice, client, returnDoc = false) {
    try {
        const doc = await createPDFDoc(invoice, client);
        if (returnDoc) return doc;
        if (doc) {
            const blob = doc.output('blob');
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${invoice.invoice_number || invoice.invoiceNumber || 'invoice'}.pdf`;

            // Append, click, and cleanup
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }, 100);
        }
    } catch (error) {
        console.error('PDF Generation Error:', error);
        Toast.show(`Failed to generate PDF: ${error.message}`, 'error');
    }
}

export async function viewPDF(invoice, client) {
    const isIOSFirefox = navigator.userAgent.match(/FxiOS/i);

    // Firefox on iOS throws NSURLErrorDomain for blob navigation but allows blob downloads.
    if (isIOSFirefox) {
        return generatePDF(invoice, client);
    }

    let newWin = null;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.userAgent.match(/CriOS/i);

    try {
        if (!isIOS) {
            // Open window synchronously for desktop/Android to prevent popup blocker
            newWin = window.open('', '_blank');
            if (newWin) {
                newWin.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#666;"><h2>Preparing PDF...</h2></body></html>');
            }
        }

        const doc = await createPDFDoc(invoice, client);
        if (doc) {
            const blob = doc.output('blob');
            const blobUrl = URL.createObjectURL(blob);

            if (isIOS) {
                window.location.assign(blobUrl);
            } else {
                if (newWin) {
                    newWin.location.replace(blobUrl);
                } else {
                    window.open(blobUrl, '_blank');
                }
            }
        } else if (newWin) {
            newWin.close();
        }
    } catch (error) {
        console.error('PDF View Error:', error);
        if (newWin) newWin.close();
        Toast.show(`Failed to open PDF: ${error.message}`, 'error');
    }
}

async function createPDFDoc(invoice, client) {
    if (!window.jspdf) {
        Toast.show('PDF Library (jsPDF) is not loaded. Please check your internet connection.', 'error');
        return null;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Map snake_case to internal structure or just use helpers
    const safeInvoice = {
        invoiceNumber: invoice.invoice_number || invoice.invoiceNumber || 'DRAFT',
        date: invoice.date || new Date(),
        dueDate: invoice.due_date || invoice.dueDate || new Date(),
        showDueDate: (invoice.show_due_date !== undefined ? invoice.show_due_date : invoice.showDueDate) !== false,
        status: invoice.status || 'draft',
        items: Array.isArray(invoice.items) ? invoice.items : [],
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        discount: invoice.discount || 0,
        total: invoice.total || 0,
        notes: invoice.notes || ''
    };

    // Client data fallback
    const safeClient = client || {
        name: 'Unknown Client',
        email: '',
        phone: '',
        address: ''
    };

    // Fetch settings asynchronously
    const dbSettings = await SettingsStore.get();

    // Ensure settings has defaults if any field is missing
    const settings = {
        companyName: 'My Company',
        companyEmail: '',
        companyPhone: '',
        companyAddress: '',
        taxRate: 0,
        ...dbSettings
    };

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Colors
    const primaryColor = [139, 92, 246]; // Purple
    const textColor = [50, 50, 50];
    const lightGray = [150, 150, 150];

    // Header - Company Logo and Info
    let companyInfoY = yPos;

    if (settings.logo) {
        try {
            // Render logo at top-left
            doc.addImage(settings.logo, null, margin, yPos, 25, 25);
            // Move text Y start position to be below logo
            companyInfoY += 30;
        } catch (e) {
            console.warn('Failed to add logo to PDF:', e);
            // If logo fails, we just start text at top
        }
    }

    // Capture start Y for invoice details (Right Side) - still starts at top
    let rightSideY = yPos;

    // Company Name & Details (Left Side, below logo)
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName || 'Invoice', margin, companyInfoY + 8);

    let infoY = companyInfoY + 18;
    doc.setFontSize(11);
    doc.setTextColor(...textColor); // Was pure black
    doc.setFont('helvetica', 'normal');

    const companyInfo = [
        settings.companyEmail,
        settings.companyPhone,
        ...(settings.companyAddress ? settings.companyAddress.split('\n') : [])
    ];

    companyInfo.filter(Boolean).forEach(line => {
        doc.text(line, margin, infoY);
        infoY += 7;
    });

    // Invoice Title & Details (Right Side)
    // We restart Y for the right column
    let invoiceInfoY = rightSideY;

    doc.setFontSize(32);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, invoiceInfoY + 10, { align: 'right' }); // +10 to roughly match logo top baseline visually

    invoiceInfoY += 20;
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    // Helper for right aligned key-value pairs
    const printRightAligned = (label, value, isBold = false, color = null) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        if (color) doc.setTextColor(...color);
        else doc.setTextColor(...textColor);

        doc.text(`${label}: ${value}`, pageWidth - margin, invoiceInfoY, { align: 'right' });
        invoiceInfoY += 5;
    };

    printRightAligned('#', safeInvoice.invoiceNumber);
    printRightAligned('Date', formatDate(safeInvoice.date));

    if (safeInvoice.showDueDate) {
        printRightAligned('Due Date', formatDate(safeInvoice.dueDate));
    }

    if (safeInvoice.status.toLowerCase() === 'paid') {
        const statusColor = [16, 185, 129];
        invoiceInfoY += 2; // Extra space before status
        printRightAligned('Status', safeInvoice.status.toUpperCase(), true, statusColor);
    }

    // Bill To Section (Right Side, under Invoice Details)
    invoiceInfoY += 10;

    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', pageWidth - margin, invoiceInfoY, { align: 'right' });

    invoiceInfoY += 7;
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(safeClient.name, pageWidth - margin, invoiceInfoY, { align: 'right' });

    invoiceInfoY += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor); // Was pure black

    const clientInfo = [
        safeClient.email,
        safeClient.phone,
        ...(safeClient.address ? safeClient.address.split('\n') : [])
    ];

    clientInfo.filter(Boolean).forEach(line => {
        doc.text(line, pageWidth - margin, invoiceInfoY, { align: 'right' });
        invoiceInfoY += 5;
    });

    // Reset Y for table to be below the lowest column
    // The left column ends at infoY, right column ends at invoiceInfoY
    yPos = Math.max(infoY, invoiceInfoY) + 15;

    // Line Items Table
    yPos += 10;

    // Table Header
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Description', margin + 2, yPos + 5.5);
    doc.text('Qty', pageWidth - margin - 75, yPos + 5.5, { align: 'right' });
    doc.text('Price', pageWidth - margin - 40, yPos + 5.5, { align: 'right' });
    doc.text('Amount', pageWidth - margin - 2, yPos + 5.5, { align: 'right' });

    yPos += 8;

    // Table Rows
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    safeInvoice.items.forEach((item, index) => {
        const rowHeight = 10;

        // Alternate row background
        if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.text(item.name || '', margin + 2, yPos + 4);

        if (item.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...lightGray);
            doc.text(item.description, margin + 2, yPos + 7.5);
            doc.setFontSize(10);
            doc.setTextColor(...textColor);
        }

        doc.setFont('helvetica', 'normal');
        doc.text((item.quantity || 0).toString(), pageWidth - margin - 75, yPos + 4, { align: 'right' });
        doc.text(formatCurrency(item.price || 0), pageWidth - margin - 40, yPos + 4, { align: 'right' });
        doc.text(formatCurrency((item.quantity || 0) * (item.price || 0)), pageWidth - margin - 2, yPos + 4, { align: 'right' });

        yPos += rowHeight;
    });

    // Totals Section
    yPos += 5;
    const totalsX = pageWidth - margin - 60;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(formatCurrency(safeInvoice.subtotal), pageWidth - margin - 2, yPos, { align: 'right' });

    yPos += 6;
    doc.text(`Tax (${settings.taxRate}%):`, totalsX, yPos);
    doc.text(formatCurrency(safeInvoice.tax), pageWidth - margin - 2, yPos, { align: 'right' });

    if (safeInvoice.discount > 0) {
        yPos += 6;
        doc.text('Discount:', totalsX, yPos);
        doc.text(`-${formatCurrency(safeInvoice.discount)}`, pageWidth - margin - 2, yPos, { align: 'right' });
    }

    yPos += 2;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(totalsX - 5, yPos, pageWidth - margin, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('TOTAL:', totalsX, yPos);
    doc.text(formatCurrency(safeInvoice.total), pageWidth - margin - 2, yPos, { align: 'right' });

    // Notes Section
    if (safeInvoice.notes) {
        yPos += 15;
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, yPos);

        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightGray);
        const splitNotes = doc.splitTextToSize(safeInvoice.notes, pageWidth - 2 * margin);
        doc.text(splitNotes, margin, yPos);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

    return doc;
}
