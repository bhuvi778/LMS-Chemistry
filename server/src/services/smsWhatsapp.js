/**
 * Pluggable SMS & WhatsApp OTP dispatch service.
 * Connects to external text/WhatsApp APIs if configured in .env,
 * otherwise falls back to logging the OTP to the server console/logs in development.
 */

export const sendSmsOtp = async (phone, code) => {
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;

  if (!apiUrl) {
    console.log(`\n==============================================`);
    console.log(`[SMS OTP DEV] Phone: ${phone} | Code: ${code}`);
    console.log(`==============================================\n`);
    return true;
  }

  try {
    // Construct request payload/query depending on your SMS provider
    // Example: sending via a GET or POST request
    const url = apiUrl
      .replace('{phone}', encodeURIComponent(phone))
      .replace('{code}', encodeURIComponent(code))
      .replace('{key}', encodeURIComponent(apiKey || ''));

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : '',
      },
      body: JSON.stringify({
        to: phone,
        message: `Your Ace2Examz verification OTP code is: ${code}. Valid for 10 minutes.`,
      }),
    });

    if (!res.ok) {
      console.error(`[SMS] Provider error: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SMS] Failed to send SMS OTP:', err.message);
    return false;
  }
};

export const sendWhatsappOtp = async (phone, code) => {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!apiUrl) {
    console.log(`\n==============================================`);
    console.log(`[WHATSAPP OTP DEV] Phone: ${phone} | Code: ${code}`);
    console.log(`==============================================\n`);
    return true;
  }

  try {
    // Construct request payload depending on your WhatsApp provider (e.g., Gupshup, Twilio, or Meta Cloud API)
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : '',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: 'ace2examz_otp', // template name registered on your WhatsApp portal
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: code }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: code }],
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[WhatsApp] Provider error: ${res.status} - ${errorText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[WhatsApp] Failed to send WhatsApp OTP:', err.message);
    return false;
  }
};
