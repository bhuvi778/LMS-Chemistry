import nodemailer from 'nodemailer';

const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const FROM = () => `"Ace2Examz" <${process.env.SMTP_USER || process.env.FROM_EMAIL || 'noreply@ace2examz.com'}>`;

const send = async (to, subject, html, attachments = []) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[EMAIL DEV] to=${to} | subject=${subject}`);
    return;
  }
  try {
    await t.sendMail({ from: FROM(), to, subject, html, attachments });
  } catch (err) {
    console.error('[EMAIL] send error:', err.message);
  }
};

// ─── Templates ────────────────────────────────────────────────────────────────

const base = (content) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:24px 32px">
    <h1 style="color:#fff;margin:0;font-size:22px">Ace2Examz</h1>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Your Chemistry Exam Partner</p>
  </div>
  <div style="padding:28px 32px">
    ${content}
  </div>
  <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} Ace2Examz. All rights reserved.</p>
  </div>
</div>`;

export const sendWelcomeEmail = (email, name, studentId) =>
  send(
    email,
    'Welcome to Ace2Examz! 🎉',
    base(`
      <h2 style="color:#1f2937;margin-top:0">Welcome, ${name}! 🎉</h2>
      <p style="color:#4b5563">Your account has been created successfully.</p>
      <div style="background:#f5f3ff;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;color:#6d28d9;font-size:14px"><b>Student ID:</b> ${studentId}</p>
      </div>
      <p style="color:#4b5563">Start exploring our courses and test series to ace your chemistry exams!</p>
      <a href="${process.env.CLIENT_URL || 'https://ace2examz.com'}/courses"
         style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px">
        Browse Courses
      </a>
    `)
  );

export const sendEnrollmentEmail = (email, name, courseName, amount) =>
  send(
    email,
    `Enrollment Confirmed: ${courseName}`,
    base(`
      <h2 style="color:#1f2937;margin-top:0">Enrollment Confirmed! ✅</h2>
      <p style="color:#4b5563">Hi <b>${name}</b>, you are now enrolled in:</p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:4px;margin:16px 0">
        <h3 style="margin:0;color:#15803d">${courseName}</h3>
        ${amount > 0 ? `<p style="margin:4px 0 0;color:#16a34a;font-size:14px">Amount paid: ₹${amount}</p>` : '<p style="margin:4px 0 0;color:#16a34a;font-size:14px">Free enrollment</p>'}
      </div>
      <a href="${process.env.CLIENT_URL || 'https://ace2examz.com'}/dashboard"
         style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px">
        Go to Dashboard
      </a>
    `)
  );

export const sendPaymentReceiptEmail = (email, name, invoiceData, pdfBuffer = null) => {
  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }
  return send(
    email,
    `Payment Receipt - Invoice #${invoiceData.invoiceNumber}`,
    base(`
      <h2 style="color:#1f2937;margin-top:0">Payment Receipt</h2>
      <p style="color:#4b5563">Hi <b>${name}</b>, here is your payment summary:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr style="background:#f9fafb">
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Invoice #</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${invoiceData.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Item</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${invoiceData.itemName}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Amount</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">₹${invoiceData.finalAmount || invoiceData.amount}</td>
        </tr>
        ${(invoiceData.discountAmount || 0) > 0 ? `
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Discount</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#10b981;font-size:14px">-₹${invoiceData.discountAmount}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Payment ID</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px;font-family:monospace">${invoiceData.razorpayPaymentId}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Date</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${new Date(invoiceData.invoiceDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:12px">Keep this receipt for your records. We have also attached your official PDF invoice. You can also download your invoice from your dashboard.</p>
    `),
    attachments
  );
};

export const sendDoubtAnsweredEmail = (email, name, question, answer, courseTitle) =>
  send(
    email,
    'Your doubt has been answered! 💡',
    base(`
      <h2 style="color:#1f2937;margin-top:0">Doubt Answered! 💡</h2>
      <p style="color:#4b5563">Hi <b>${name}</b>, your doubt in <b>${courseTitle || 'General'}</b> has been answered.</p>
      <div style="background:#fafafa;border-left:4px solid #7c3aed;padding:16px;border-radius:4px;margin:12px 0">
        <p style="margin:0;font-size:13px;color:#6b7280"><b>Your Question:</b></p>
        <p style="margin:8px 0 0;color:#1f2937;font-size:14px">${question}</p>
      </div>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:4px;margin:12px 0">
        <p style="margin:0;font-size:13px;color:#6b7280"><b>Answer:</b></p>
        <p style="margin:8px 0 0;color:#1f2937;font-size:14px">${answer}</p>
      </div>
      <a href="${process.env.CLIENT_URL || 'https://ace2examz.com'}/doubts"
         style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px">
        View All Doubts
      </a>
    `)
  );

export const sendPasswordResetEmail = (email, name, tempPassword) =>
  send(
    email,
    'Your Ace2Examz Password Has Been Reset',
    base(`
      <h2 style="color:#1f2937;margin-top:0">Password Reset</h2>
      <p style="color:#4b5563">Hi <b>${name}</b>, an administrator has reset your account password.</p>
      <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #fde68a">
        <p style="margin:0;color:#92400e;font-size:14px"><b>Temporary Password:</b> <code style="background:#fff;padding:2px 8px;border-radius:4px;font-size:16px">${tempPassword}</code></p>
      </div>
      <p style="color:#ef4444;font-size:13px">⚠️ Please change your password immediately after logging in.</p>
      <a href="${process.env.CLIENT_URL || 'https://ace2examz.com'}/login"
         style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px">
        Login Now
      </a>
    `)
  );

export const sendLoginNotificationEmail = (email, name, deviceInfo, ip) =>
  send(
    email,
    'New Login Detected — Ace2Examz 🔒',
    base(`
      <h2 style="color:#1f2937;margin-top:0">New Login Detected 🔒</h2>
      <p style="color:#4b5563">Hi <b>${name}</b>,</p>
      <p style="color:#4b5563">We noticed a new login to your Ace2Examz account:</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;color:#374151">
        <p style="margin:0 0 8px 0"><b>Device:</b> ${deviceInfo}</p>
        <p style="margin:0 0 8px 0"><b>IP Address:</b> ${ip}</p>
        <p style="margin:0"><b>Date/Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST</p>
      </div>
      <p style="color:#6b7280;font-size:13px">If this was you, you can safely ignore this email. If you don't recognize this activity, we recommend securing your account immediately by changing your password.</p>
    `)
  );

export const sendPasswordChangedEmail = (email, name) =>
  send(
    email,
    'Your Ace2Examz Password Was Changed Successfully',
    base(`
      <h2 style="color:#1f2937;margin-top:0">Password Changed Successfully</h2>
      <p style="color:#4b5563">Hi <b>${name}</b>,</p>
      <p style="color:#4b5563">The password for your Ace2Examz account was recently changed.</p>
      <p style="color:#ef4444;font-size:13px">If you did not perform this action, please contact our support team immediately.</p>
    `)
  );

export const sendEnquiryNotificationToAdmin = (adminEmail, enquiry) =>
  send(
    adminEmail,
    `New Contact Enquiry: ${enquiry.subject || 'No Subject'} 📥`,
    base(`
      <h2 style="color:#1f2937;margin-top:0">New Enquiry Received 📥</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280"><b>Name:</b></td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#1f2937">${enquiry.name}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280"><b>Email:</b></td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#1f2937">${enquiry.email}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280"><b>Phone:</b></td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#1f2937">${enquiry.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280"><b>Subject:</b></td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#1f2937">${enquiry.subject || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#6b7280"><b>Message:</b></td>
          <td style="padding:8px;color:#1f2937">${enquiry.message}</td>
        </tr>
      </table>
    `)
  );

export const sendEnquiryReceiptToUser = (email, name, enquiry) =>
  send(
    email,
    'We received your message — Ace2Examz',
    base(`
      <h2 style="color:#1f2937;margin-top:0">Thank you for contacting us!</h2>
      <p style="color:#4b5563">Hi <b>${name}</b>,</p>
      <p style="color:#4b5563">We have received your message regarding "<b>${enquiry.subject || 'General Enquiry'}</b>". Our support team will get back to you shortly.</p>
      <p style="color:#6b7280;font-size:13px;border-left:3px solid #7c3aed;padding-left:12px;margin:16px 0">
        <i>"${enquiry.message}"</i>
      </p>
    `)
  );

export const sendMentorshipRequestAdminEmail = (adminEmail, studentName, details) =>
  send(
    adminEmail,
    `New 1:1 Mentorship Request: ${details.subject} 🎓`,
    base(`
      <h2 style="color:#1f2937;margin-top:0">New Mentorship Request Received 🎓</h2>
      <p style="color:#4b5563">A student has requested a 1:1 mentorship session:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr style="background:#f9fafb">
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Student Name</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${studentName}</td>
        </tr>
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Subject / Topic</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${details.subject}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Preferred Date</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${new Date(details.preferredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Preferred Time Slot</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${details.preferredTimeSlot}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Details</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${details.description}</td>
        </tr>
      </table>
      <a href="${process.env.CLIENT_URL || 'https://ace2examz.com'}/admin/mentorship"
         style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px">
        Manage Request
      </a>
    `)
  );

export const sendMentorshipRequestStudentEmail = (studentEmail, studentName, details) =>
  send(
    studentEmail,
    `Mentorship Request Submitted: ${details.subject} 🚀`,
    base(`
      <h2 style="color:#1f2937;margin-top:0">Mentorship Request Submitted! 🚀</h2>
      <p style="color:#4b5563">Hi <b>${studentName}</b>,</p>
      <p style="color:#4b5563">Your request for a 1:1 mentorship session has been submitted successfully. Our team will review it and schedule a call shortly.</p>
      <h3 style="color:#1f2937;margin-bottom:8px">Request Summary:</h3>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr style="background:#f9fafb">
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Subject / Topic</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${details.subject}</td>
        </tr>
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Preferred Date</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${new Date(details.preferredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px"><b>Preferred Time Slot</b></td>
          <td style="padding:10px;border:1px solid #e5e7eb;color:#374151;font-size:14px">${details.preferredTimeSlot}</td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:12px">You will receive an email and a dashboard notification once a mentor is assigned and a meeting link is generated.</p>
    `)
  );
