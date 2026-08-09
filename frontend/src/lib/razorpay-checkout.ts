// Razorpay's hosted checkout widget -- loaded from their CDN, not bundled,
// since it needs to stay in sync with Razorpay's own PCI-compliant payment
// UI. This is the standard, documented integration pattern for Razorpay's
// "Standard Checkout".

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string };
};

type RazorpayCheckoutInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let loadPromise: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Couldn't load the payment widget. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });

  return loadPromise;
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  await loadRazorpayCheckout();
  if (!window.Razorpay) {
    throw new Error("Payment widget failed to initialize.");
  }
  new window.Razorpay(options).open();
}
