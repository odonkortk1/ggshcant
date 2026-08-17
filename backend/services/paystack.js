// Ported from base44/shared/paystack.ts

export function getPaystackConfig() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Paystack secret key is not configured. Set PAYSTACK_SECRET_KEY in your .env file.');
  }
  return { secretKey, baseUrl: 'https://api.paystack.co' };
}

export function generateReference() {
  return `GGSH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
