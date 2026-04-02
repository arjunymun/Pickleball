export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || null;
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey());
}
