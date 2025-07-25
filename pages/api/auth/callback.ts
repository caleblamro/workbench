import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/?error=missing_code');
  }

  // Environment variable checks
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const redirectUri = process.env.SALESFORCE_REDIRECT_URI;
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ message: 'Salesforce OAuth not configured' });
  }

  try {
    // Exchange authorization code for access token
    const tokenUrl = new URL('/services/oauth2/token', loginUrl);

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code as string,
    });

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      return res.redirect('/?error=token_exchange_failed');
    }

    const tokens: TokenResponse = await tokenResponse.json();

    const userInfoResponse = await fetch(tokens.id, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = userInfoResponse.ok ? await userInfoResponse.json() : {};

    // Store tokens in httpOnly cookies (more secure than localStorage)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };

    const cookies = [
      serialize('sf_access_token', tokens.access_token, cookieOptions),
      serialize('sf_refresh_token', tokens.refresh_token, cookieOptions),
      serialize('sf_instance_url', tokens.instance_url, cookieOptions),
      serialize('sf_user_info', JSON.stringify(userInfo), cookieOptions),
    ];

    res.setHeader('Set-Cookie', cookies);

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    res.redirect('/?error=callback_failed');
  }
}
