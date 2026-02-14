import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

/**
 * Configure Amplify for client-side usage
 * Import this in your root layout or _app file
 */
export function configureAmplify() {
  Amplify.configure(outputs, {
    ssr: true // Enable SSR support for Next.js
  });
}
