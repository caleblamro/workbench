# Salesforce Workbench Clone

A modern Salesforce Workbench-like tool built with Next.js and Mantine UI.

## Features

- 🔐 Salesforce OAuth 2.0 Authentication
- 🎨 Modern UI with Mantine components
- 🛡️ Secure session management with httpOnly cookies
- 📱 Responsive design
- ⚡ Built with Next.js for optimal performance

## Setup Instructions

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Salesforce Connected App

1. Log in to your Salesforce org
2. Go to Setup → App Manager
3. Click "New Connected App"
4. Fill in the basic information:
   - Connected App Name: `Workbench Clone`
   - API Name: `Workbench_Clone`
   - Contact Email: Your email

5. Enable OAuth Settings:
   - ✅ Enable OAuth Settings
   - Callback URL: `http://localhost:3000/api/auth/callback`
   - Selected OAuth Scopes:
     - Access and manage your data (api)
     - Perform requests on your behalf at any time (refresh_token, offline_access)

6. Save and note down:
   - **Consumer Key** (Client ID)
   - **Consumer Secret** (Client Secret)

### 3. Environment Configuration

Update the `.env.local` file with your Salesforce app credentials:

```env
# Salesforce OAuth Configuration
SALESFORCE_CLIENT_ID=your_consumer_key_here
SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
SALESFORCE_REDIRECT_URI=http://localhost:3000/api/auth/callback
SALESFORCE_LOGIN_URL=https://login.salesforce.com
# For sandbox, use: https://test.salesforce.com

# NextAuth Secret (generate a random string)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

**Important Notes:**
- Generate a secure random string for `NEXTAUTH_SECRET` (you can use: `openssl rand -hex 32`)
- Use `https://test.salesforce.com` for sandbox orgs
- Use `https://login.salesforce.com` for production orgs

### 4. Run the Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How Salesforce OAuth Works

The OAuth 2.0 Web Server Flow implementation includes:

1. **Authorization Request**: User clicks "Connect to Salesforce" → redirected to Salesforce login
2. **User Authorization**: User logs in and grants permissions
3. **Authorization Code**: Salesforce redirects back with authorization code
4. **Token Exchange**: Backend exchanges code for access + refresh tokens
5. **Session Creation**: Tokens stored in secure httpOnly cookies
6. **API Access**: Use stored tokens for Salesforce API calls

## Security Features

- ✅ **httpOnly Cookies**: Tokens stored securely, not accessible via JavaScript
- ✅ **CSRF Protection**: State parameter validation
- ✅ **Secure Flags**: Cookies marked secure in production
- ✅ **Token Refresh**: Automatic token refresh capability
- ✅ **Session Validation**: Server-side session verification

## File Structure

```
├── pages/
│   ├── api/auth/
│   │   ├── login.ts       # OAuth initiation
│   │   ├── callback.ts    # OAuth callback handler
│   │   ├── logout.ts      # Session cleanup
│   │   └── me.ts          # Current user info
│   ├── index.tsx          # Login page
│   └── dashboard.tsx      # Main dashboard
├── components/
│   ├── LoginPage.tsx      # Login UI component
│   └── Dashboard.tsx      # Dashboard UI component
├── types/
│   └── salesforce.ts      # TypeScript types
└── .env.local             # Environment variables
```

## Next Steps

1. **SOQL Query Tool**: Add a component for running SOQL queries
2. **Object Inspector**: Browse Salesforce objects and their fields
3. **REST API Explorer**: Test Salesforce REST API endpoints
4. **Data Import/Export**: Bulk data operations
5. **Apex Code Runner**: Execute anonymous Apex code

## Troubleshooting

### Common Issues

1. **"Salesforce OAuth not configured"**
   - Check that all environment variables are set correctly
   - Ensure no extra spaces in the `.env.local` file

2. **"redirect_uri_mismatch"**
   - Verify the callback URL in your Connected App matches exactly
   - Check for trailing slashes or case sensitivity

3. **"invalid_client_id"**
   - Double-check your Consumer Key from the Connected App
   - Ensure you're using the correct Salesforce URL (login vs test)

4. **Connection refused**
   - Make sure your development server is running on port 3000
   - Check firewall settings

### Debug Mode

To see detailed OAuth flow logs, check the browser network tab and server console output.

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details.
