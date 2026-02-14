import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function POST(request) {
  try {
    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Handle both Cognito (new) and Firebase (legacy) users
    const userData = requestData.cognitoUser || requestData.firebaseUser;
    
    if (!userData || !userData.uid) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    console.log('[API /user] Syncing user:', userData.uid, 'Email:', userData.email);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        cognitoUserId: userData.uid,
      },
    });

    if (existingUser) {
      console.log('[API /user] User already exists:', existingUser.email);
      return NextResponse.json({ user: existingUser });
    }

    // Create new user
    const email = userData.email;
    const name = userData.displayName || "User";

    if (!email) {
      return NextResponse.json(
        { error: 'No email found for user' },
        { status: 400 }
      );
    }

    try {
      console.log('[API /user] Creating new user:', email);
      
      // Use upsert to handle both creation and updates
      const newUser = await db.user.upsert({
        where: {
          cognitoUserId: userData.uid,
        },
        update: {
          name: name,
          imageUrl: userData.photoURL || "",
          // Don't update email to avoid conflicts
        },
        create: {
          cognitoUserId: userData.uid,
          name: name,
          imageUrl: userData.photoURL || "",
          email: email,
        },
      });

      console.log('[API /user] User created successfully:', newUser.email);
      return NextResponse.json({ user: newUser });
    } catch (upsertError) {
      // If upsert fails due to email constraint, try to find by email
      if (upsertError.code === 'P2002') {
        // Check if a user with this email exists but different user ID
        const userByEmail = await db.user.findUnique({
          where: { email: email }
        });
        
        if (userByEmail && userByEmail.cognitoUserId !== userData.uid) {
          // Update the existing user's ID (migration scenario)
          console.log('[API /user] Updating existing user with new ID:', userData.uid);
          const updatedUser = await db.user.update({
            where: { email: email },
            data: {
              cognitoUserId: userData.uid,
              name: name,
              imageUrl: userData.photoURL || "",
            }
          });
          return NextResponse.json({ user: updatedUser });
        }
      }
      throw upsertError;
    }
  } catch (error) {
    // Final fallback: try to retrieve user by ID
    if (error.code === 'P2002' && requestData?.cognitoUser?.uid || requestData?.firebaseUser?.uid) {
      try {
        const userId = requestData.cognitoUser?.uid || requestData.firebaseUser?.uid;
        const existingUser = await db.user.findUnique({
          where: {
            cognitoUserId: userId,
          },
        });
        if (existingUser) {
          return NextResponse.json({ user: existingUser });
        }
      } catch (retryError) {
        // Silent fail on retry
      }
    }
    
    console.error('[API /user] Error:', error.message);
    return NextResponse.json(
      { error: `Failed to create/check user: ${error.message}` },
      { status: 500 }
    );
  }
}