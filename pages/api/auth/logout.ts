import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Clear all Salesforce-related cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0, // Expire immediately
    path: '/',
  };

  res.setHeader('Set-Cookie', [
    serialize('sf_access_token', '', cookieOptions),
    serialize('sf_refresh_token', '', cookieOptions),
    serialize('sf_instance_url', '', cookieOptions),
    serialize('sf_user_info', '', cookieOptions),
  ]);

  res.status(200).json({ message: 'Logged out successfully' });
}
