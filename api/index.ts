import createServer from '../server';

export default async (req: any, res: any) => {
  const app = await createServer();
  // Vercel/Express integration: app is the express instance
  return app(req, res);
};
