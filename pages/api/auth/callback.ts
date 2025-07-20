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

// Helper function to safely log sensitive data
const logSafe = (label: string, data: any, sensitiveKeys: string[] = []) => {
  if (typeof data === 'object' && data !== null) {
    const safeCopy = { ...data };
    sensitiveKeys.forEach((key) => {
      if (safeCopy[key]) {
        safeCopy[key] = `[REDACTED - ${safeCopy[key].length} chars]`;
      }
    });
    console.log(`[OAuth Debug] ${label}:`, safeCopy);
  } else {
    console.log(`[OAuth Debug] ${label}:`, data);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[OAuth Debug] === Salesforce OAuth Callback Handler Started ===');
  console.log('[OAuth Debug] Request method:', req.method);
  console.log('[OAuth Debug] Request URL:', req.url);
  console.log('[OAuth Debug] Query parameters:', req.query);
  console.log('[OAuth Debug] User Agent:', req.headers['user-agent']);
  console.log('[OAuth Debug] Referer:', req.headers.referer);

  if (req.method !== 'GET') {
    console.log('[OAuth Debug] ❌ Invalid method, returning 405');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error, state } = req.query;
  console.log('[OAuth Debug] Extracted parameters:', {
    hasCode: !!code,
    codeLength: code ? (code as string).length : 0,
    error: error || 'none',
    state: state || 'none',
  });

  if (error) {
    console.log('[OAuth Debug] ❌ OAuth error received:', error);
    return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    console.log('[OAuth Debug] ❌ No authorization code provided');
    return res.redirect('/?error=missing_code');
  }

  // Environment variable checks
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const redirectUri = process.env.SALESFORCE_REDIRECT_URI;
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';

  console.log('[OAuth Debug] Environment check:', {
    hasClientId: !!clientId,
    clientIdLength: clientId ? clientId.length : 0,
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret ? clientSecret.length : 0,
    redirectUri,
    loginUrl,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!clientId || !clientSecret || !redirectUri) {
    console.log('[OAuth Debug] ❌ Missing required environment variables');
    return res.status(500).json({ message: 'Salesforce OAuth not configured' });
  }

  try {
    console.log('[OAuth Debug] 🔄 Starting token exchange...');

    // Exchange authorization code for access token
    const tokenUrl = new URL('/services/oauth2/token', loginUrl);
    console.log('[OAuth Debug] Token URL:', tokenUrl.toString());

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code as string,
    });

    console.log('[OAuth Debug] Token request parameters:', {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code: `[REDACTED - ${(code as string).length} chars]`,
      client_secret: `[REDACTED - ${clientSecret.length} chars]`,
    });

    const tokenRequestStart = Date.now();
    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: tokenParams.toString(),
    });

    const tokenRequestDuration = Date.now() - tokenRequestStart;
    console.log('[OAuth Debug] Token request completed:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      duration: `${tokenRequestDuration}ms`,
      headers: Object.fromEntries(tokenResponse.headers.entries()),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('[OAuth Debug] ❌ Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorBody: errorText,
      });
      return res.redirect('/?error=token_exchange_failed');
    }

    const tokens: TokenResponse = await tokenResponse.json();
    logSafe('Token response received', tokens, ['access_token', 'refresh_token', 'signature']);

    console.log('[OAuth Debug] 🔄 Fetching user info...');

    // Get user info
    const userInfoStart = Date.now();
    const userInfoResponse = await fetch(tokens.id, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfoDuration = Date.now() - userInfoStart;
    console.log('[OAuth Debug] User info request completed:', {
      status: userInfoResponse.status,
      statusText: userInfoResponse.statusText,
      duration: `${userInfoDuration}ms`,
      url: tokens.id,
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.log('[OAuth Debug] ❌ User info request failed:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        errorBody: errorText,
      });
      // Continue anyway, user info is not critical
    }

    const userInfo = userInfoResponse.ok ? await userInfoResponse.json() : {};
    console.log('[OAuth Debug] User info received:', {
      hasUserInfo: Object.keys(userInfo).length > 0,
      userKeys: Object.keys(userInfo),
      organizationId: userInfo.organization_id,
      userId: userInfo.user_id,
      username: userInfo.username,
    });

    console.log('[OAuth Debug] 🔄 Setting cookies...');

    // Store tokens in httpOnly cookies (more secure than localStorage)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };

    console.log('[OAuth Debug] Cookie options:', cookieOptions);

    const cookies = [
      serialize('sf_access_token', tokens.access_token, cookieOptions),
      serialize('sf_refresh_token', tokens.refresh_token, cookieOptions),
      serialize('sf_instance_url', tokens.instance_url, cookieOptions),
      serialize('sf_user_info', JSON.stringify(userInfo), cookieOptions),
    ];

    console.log('[OAuth Debug] Setting cookies:', {
      cookieCount: cookies.length,
      cookieNames: ['sf_access_token', 'sf_refresh_token', 'sf_instance_url', 'sf_user_info'],
      accessTokenLength: tokens.access_token.length,
      refreshTokenLength: tokens.refresh_token.length,
      instanceUrl: tokens.instance_url,
      userInfoSize: JSON.stringify(userInfo).length,
    });

    res.setHeader('Set-Cookie', cookies);

    console.log('[OAuth Debug] ✅ OAuth flow completed successfully, redirecting to /dashboard');

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.log('[OAuth Debug] ❌ Unexpected error during OAuth flow:');
    console.error(error);

    if (error instanceof Error) {
      console.log('[OAuth Debug] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    res.redirect('/?error=callback_failed');
  }

  console.log('[OAuth Debug] === OAuth Callback Handler Completed ===');
}
