import createOrderHandler from '../create-order';

export default async function handler(req, res) {
  return createOrderHandler(req, res);
}
