import { loadStripe } from "@stripe/stripe-js";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey) {
  throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is not defined");
}

export const stripePromise = loadStripe(stripePublicKey);