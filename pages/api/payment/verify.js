import verifyPaymentHandler from '../verify-payment';

export default async function handler(req, res) {
  return verifyPaymentHandler(req, res);
}
