import PDFDocument from 'pdfkit';
import fs from 'fs';

const regularFontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const boldFontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const hasUnicodeInvoiceFont = fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath);
const regularFont = hasUnicodeInvoiceFont ? 'InvoiceRegular' : 'Helvetica';
const boldFont = hasUnicodeInvoiceFont ? 'InvoiceBold' : 'Helvetica-Bold';
const currencyPrefix = hasUnicodeInvoiceFont ? '₹' : 'Rs. ';

const formatAmount = (value = 0) => {
  const amount = Number(value) || 0;
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${currencyPrefix}${formatted}`;
};

/**
 * Generate a PDF invoice buffer for a payment.
 * @param {Object} data - payment, student, item details
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePDF = (data) => {
  return new Promise((resolve, reject) => {
    const {
      invoiceNumber,
      invoiceDate,
      studentName,
      studentEmail,
      studentId,
      itemName,
      itemType,
      originalAmount,
      discountAmount,
      finalAmount,
      razorpayPaymentId,
      couponCode,
    } = data;
    const typeLabel = itemType === 'test_series'
      ? 'Test Series'
      : itemType === 'coin_purchase'
        ? 'Ace Coins'
        : itemType === 'power_course'
          ? 'Power Batch'
          : 'Course';

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    if (hasUnicodeInvoiceFont) {
      doc.registerFont(regularFont, regularFontPath);
      doc.registerFont(boldFont, boldFontPath);
    }
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ─── Header ───────────────────────────────────────────────
    doc.rect(0, 0, 612, 100).fill('#7c3aed');
    doc.fillColor('#ffffff').fontSize(28).font(boldFont).text('Ace2Examz', 50, 32);
    doc.fontSize(11).font(regularFont).text('Your Chemistry Exam Partner', 50, 65);
    doc.fillColor('#ffffff').fontSize(11).text('INVOICE', 490, 42, { align: 'right' });

    // ─── Invoice Meta ─────────────────────────────────────────
    doc.fillColor('#1f2937').font(boldFont).fontSize(14).text('Invoice Details', 50, 120);
    doc.moveTo(50, 137).lineTo(562, 137).strokeColor('#e5e7eb').lineWidth(1).stroke();

    const left = 50, right = 320;
    const row = (label, value, y) => {
      doc.fillColor('#6b7280').font(regularFont).fontSize(10).text(label, left, y);
      doc.fillColor('#1f2937').font(boldFont).fontSize(10).text(value, right, y);
    };
    row('Invoice Number:', `#${invoiceNumber}`, 150);
    row('Invoice Date:', new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 168);
    row('Payment ID:', razorpayPaymentId || 'FREE', 186);

    // ─── Student Info ─────────────────────────────────────────
    doc.fillColor('#1f2937').font(boldFont).fontSize(14).text('Billed To', 50, 215);
    doc.moveTo(50, 232).lineTo(562, 232).strokeColor('#e5e7eb').lineWidth(1).stroke();
    doc.fillColor('#1f2937').font(boldFont).fontSize(11).text(studentName, 50, 245);
    doc.fillColor('#4b5563').font(regularFont).fontSize(10).text(studentEmail, 50, 262);
    if (studentId) doc.text(`Student ID: ${studentId}`, 50, 279);

    // ─── Items Table ──────────────────────────────────────────
    doc.fillColor('#1f2937').font(boldFont).fontSize(14).text('Order Summary', 50, 310);
    doc.moveTo(50, 327).lineTo(562, 327).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Table header
    doc.rect(50, 335, 512, 28).fill('#f3f4f6');
    doc.fillColor('#374151').font(boldFont).fontSize(10);
    doc.text('Item', 60, 344);
    doc.text('Type', 360, 344);
    doc.text('Amount', 480, 344, { width: 80, align: 'right' });

    // Table row
    doc.rect(50, 363, 512, 32).fill('#ffffff').stroke('#e5e7eb');
    doc.fillColor('#1f2937').font(regularFont).fontSize(10);
    doc.text(itemName, 60, 374, { width: 280 });
    doc.text(typeLabel, 360, 374);
    doc.text(formatAmount(originalAmount), 480, 374, { width: 80, align: 'right' });

    // Subtotal area
    let subtotalY = 410;
    if (discountAmount > 0) {
      doc.fillColor('#6b7280').font(regularFont).fontSize(10).text('Subtotal:', 360, subtotalY);
      doc.text(formatAmount(originalAmount), 480, subtotalY, { width: 80, align: 'right' });
      subtotalY += 18;
      doc.fillColor('#10b981').font(regularFont).fontSize(10).text('Discount:', 360, subtotalY);
      doc.text(`-${formatAmount(discountAmount)}`, 480, subtotalY, { width: 80, align: 'right' });
      if (couponCode) {
        subtotalY += 14;
        doc.fillColor('#6b7280').fontSize(9).text(`Coupon: ${couponCode}`, 360, subtotalY);
      }
      subtotalY += 18;
    }
    doc.moveTo(360, subtotalY).lineTo(562, subtotalY).strokeColor('#6d28d9').lineWidth(1.5).stroke();
    subtotalY += 8;
    doc.fillColor('#7c3aed').font(boldFont).fontSize(13).text('Total:', 360, subtotalY);
    doc.text(formatAmount(finalAmount), 480, subtotalY, { width: 80, align: 'right' });

    // ─── Footer ───────────────────────────────────────────────
    doc.fillColor('#9ca3af').font(regularFont).fontSize(9)
      .text('This is a computer-generated invoice. No signature required.', 50, 720, { align: 'center', width: 512 });
    doc.text(`© ${new Date().getFullYear()} Ace2Examz. All rights reserved.`, 50, 735, { align: 'center', width: 512 });

    doc.end();
  });
};
