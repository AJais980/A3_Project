import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Try to initialize with service account from environment
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    // Continue anyway - the function will fail gracefully if admin isn't initialized
  }
}

/**
 * DELETE /api/auth/delete-firebase-user
 * 
 * Deletes a Firebase user account by their UID
 * Requires: firebaseUid in request body
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseUid } = await request.json();

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is properly initialized
    if (!admin.apps.length || !admin.auth()) {
      console.warn("⚠️ Firebase Admin not properly initialized. Skipping Firebase user deletion.");
      return NextResponse.json(
        { 
          warning: "Firebase Admin not initialized. User remains in Firebase.",
          hint: "Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env"
        },
        { status: 503 }
      );
    }

    // Delete the Firebase user
    await admin.auth().deleteUser(firebaseUid);

    console.log("✅ Firebase user deleted successfully:", firebaseUid);
    return NextResponse.json(
      { success: true, message: "Firebase user deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error deleting Firebase user:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "Firebase user not found. May have been deleted already." },
        { status: 404 }
      );
    }

    if (error.message?.includes("service account")) {
      return NextResponse.json(
        { 
          error: "Firebase service account not configured",
          hint: "Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete Firebase user", details: error.message },
      { status: 500 }
    );
  }
}
