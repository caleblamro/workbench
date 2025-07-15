import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const cookies = parse(req.headers.cookie || '');
  
  const accessToken = cookies.sf_access_token;
  const instanceUrl = cookies.sf_instance_url;
  const userInfo = cookies.sf_user_info;

  if (!accessToken || !instanceUrl || !userInfo) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const parsedUserInfo = JSON.parse(userInfo);
    
    res.status(200).json({
      user: parsedUserInfo,
      instanceUrl,
      isAuthenticated: true,
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid session data' });
  }
}
