/**
 * Debug endpoint to check available environment variables
 * REMOVE THIS IN PRODUCTION!
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envVars = {
      // Check all possible project ID sources
      GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || 'NOT SET',
      GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || 'NOT SET',
      GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || 'NOT SET',
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || 'NOT SET',
      GCP_PROJECT: process.env.GCP_PROJECT || 'NOT SET',
      
      // Firebase config
      FIREBASE_CONFIG: process.env.FIREBASE_CONFIG || 'NOT SET',
      FIREBASE_CONFIG_PARSED: process.env.FIREBASE_CONFIG ? 
        JSON.parse(process.env.FIREBASE_CONFIG) : 'NOT SET',
      
      // NEXT_PUBLIC vars
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET',
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'NOT SET',
      
      // Region
      GOOGLE_CLOUD_REGION: process.env.GOOGLE_CLOUD_REGION || 'NOT SET',
      
      // All env vars that contain PROJECT or FIREBASE
      ALL_PROJECT_VARS: Object.keys(process.env)
        .filter(k => k.includes('PROJECT') || k.includes('FIREBASE') || k.includes('BACKEND'))
        .reduce((acc, key) => {
          acc[key] = process.env[key];
          return acc;
        }, {})
    };

    return NextResponse.json(envVars, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
