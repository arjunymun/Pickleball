import Stripe from "stripe";

import { getStripeSecretKey } from "@/lib/stripe/env";

let stripeInstance: Stripe | null | undefined;

export function getStripeServerClient() {
  if (stripeInstance !== undefined) {
    return stripeInstance;
  }

  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    stripeInstance = null;
    return stripeInstance;
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  return stripeInstance;
}
