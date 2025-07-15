import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const redirectUri = process.env.SALESFORCE_REDIRECT_URI;
  const loginUrl = 'https://orgfarm-a5c969edfc-dev-ed.develop.my.salesforce.com';

  if (!clientId || !redirectUri) {
    return res.status(500).json({ message: 'Salesforce OAuth not configured' });
  }

  // Generate a random state parameter for security
  const state = Math.random().toString(36).substring(2, 15);

  // Store state in session (for production, use a proper session store)
  // For now, we'll just redirect and verify on callback
  const authUrl = new URL('/services/oauth2/authorize', loginUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'api refresh_token');
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
}
