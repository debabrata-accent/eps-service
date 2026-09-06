import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay environment variables are not set');
    }

    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    console.log('✅ Razorpay initialized');
  }
  return razorpayInstance;
};
