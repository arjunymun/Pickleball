"use client";

export interface GatewayResult {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
}
interface CheckoutOptions {
  key: string;
  amount?: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: { name?: string; email?: string };
  theme: { color: string };
  handler: (result: GatewayResult) => void;
  modal: { ondismiss: () => void };
}
interface GatewayCheckout {
  open(): void;
  on(
    event: "payment.failed",
    handler: (result: { error?: { description?: string } }) => void,
  ): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => GatewayCheckout;
  }
}
let scriptPromise: Promise<void> | null = null;

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      script.remove();
      scriptPromise = null;
      reject(
        new Error("Payment checkout took too long to load. Please try again."),
      );
    }, 15_000);
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      clearTimeout(timeout);
      if (window.Razorpay) resolve();
      else {
        scriptPromise = null;
        reject(new Error("Payment checkout could not load. Please try again."));
      }
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      scriptPromise = null;
      reject(
        new Error(
          "Payment checkout could not load. Check your connection and try again.",
        ),
      );
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function openPaymentCheckout(
  options: Omit<CheckoutOptions, "handler" | "modal" | "theme">,
): Promise<GatewayResult> {
  await loadCheckout();
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Payment checkout is unavailable."));
      return;
    }
    let lastFailure: string | null = null;
    const checkout = new window.Razorpay({
      ...options,
      theme: { color: "#075fe5" },
      handler: resolve,
      modal: {
        ondismiss: () =>
          reject(
            new Error(
              lastFailure ??
                "Checkout closed. Payment must be verified before your booking or membership is confirmed.",
            ),
          ),
      },
    });
    // Razorpay lets a player retry inside the same checkout after a failed attempt.
    checkout.on("payment.failed", (result) => {
      lastFailure =
        result.error?.description ??
        "Payment failed. You can retry while your court is held.";
    });
    checkout.open();
  });
}
