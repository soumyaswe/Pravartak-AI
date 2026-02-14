import { CookieStorage } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

// Check if Cognito is configured
export const isCognitoConfigured = () => {
  const isConfigured = !!(
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID &&
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
  );
  
  console.log('[Cognito Config] Environment check:', {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    isConfigured
  });
  
  return isConfigured;
};

/*
 * AWS Cognito OAuth Configuration Checklist:
 * 
 * 1. In AWS Cognito User Pool → App Integration → App clients:
 *    - Enable "ALLOW_USER_PASSWORD_AUTH"
 *    - Enable "ALLOW_REFRESH_TOKEN_AUTH"
 *    - Enable "ALLOW_USER_SRP_AUTH"
 * 
 * 2. In App client → Hosted UI:
 *    - Add Allowed callback URLs: http://localhost:3000 (and your production URL)
 *    - Add Allowed sign-out URLs: http://localhost:3000 (and your production URL)
 *    - OAuth 2.0 grant types: Select "Authorization code grant"
 *    - OpenID Connect scopes: Select "openid", "email", "profile"
 * 
 * 3. In User Pool → App Integration → Identity providers:
 *    - Add "Google" as an identity provider
 *    - Configure Google OAuth credentials from Google Cloud Console
 *    - Map attributes: email → email, name → name
 * 
 * 4. Environment variables required:
 *    - NEXT_PUBLIC_COGNITO_USER_POOL_ID
 *    - NEXT_PUBLIC_COGNITO_CLIENT_ID
 *    - NEXT_PUBLIC_COGNITO_DOMAIN (format: your-domain.auth.region.amazoncognito.com)
 *    - NEXT_PUBLIC_APP_URL
 */

export const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
          redirectSignOut: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
          responseType: 'code',
        },
        email: true,
        username: false,
      },
    },
  },
  ssr: true,
};

cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());