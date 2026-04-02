interface TwilioWhatsappEnv {
  accountSid: string;
  authToken: string;
  from: string;
}

export function getTwilioWhatsappEnv(): TwilioWhatsappEnv | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return null;
  }

  return {
    accountSid,
    authToken,
    from,
  };
}

export async function sendWhatsappMessage(params: {
  to: string;
  body: string;
}) {
  const env = getTwilioWhatsappEnv();

  if (!env) {
    return {
      provider: "twilio_whatsapp",
      status: "queued" as const,
      providerMessageId: null,
      sent: false,
    };
  }

  const auth = Buffer.from(`${env.accountSid}:${env.authToken}`).toString("base64");
  const formData = new URLSearchParams();
  formData.set("From", `whatsapp:${env.from}`);
  formData.set("To", `whatsapp:${params.to}`);
  formData.set("Body", params.body);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio WhatsApp send failed: ${errorText}`);
  }

  const payload = (await response.json()) as { sid?: string; status?: string };

  return {
    provider: "twilio_whatsapp",
    status: payload.status === "queued" || payload.status === "sent" ? payload.status : "sent",
    providerMessageId: payload.sid ?? null,
    sent: true,
  };
}
