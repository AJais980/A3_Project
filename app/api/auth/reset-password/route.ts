import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import prisma from "@/lib/prisma";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
	try {
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
	}
}

/**
 * Reset password endpoint
 * Supports two modes:
 * 1. With idToken (for authenticated users)
 * 2. With resetToken (for users who forgot password)
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { idToken, resetToken, email, newPassword } = body;

		if (!newPassword) {
			return NextResponse.json(
				{ success: false, error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Mode 1: Reset with ID token (authenticated user)
		if (idToken) {
			const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

			const response = await fetch(
				`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseApiKey}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						idToken,
						password: newPassword,
						returnSecureToken: true,
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				console.error("Firebase update error:", data);
				return NextResponse.json(
					{
						success: false,
						error: data.error?.message || "Failed to update password",
					},
					{ status: response.status }
				);
			}

			return NextResponse.json({
				success: true,
				message: "Password updated successfully",
			});
		}

		// Mode 2: Reset with reset token (forgot password flow)
		if (resetToken && email) {
			// Check if Firebase Admin is properly initialized
			if (!admin.apps.length || !admin.auth()) {
				console.error("Firebase Admin not properly initialized");
				return NextResponse.json(
					{ success: false, error: "Server configuration error. Please contact support." },
					{ status: 503 }
				);
			}

			// Find the user by email in our database
			const user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user || !user.firebaseId) {
				return NextResponse.json(
					{ success: false, error: "User not found" },
					{ status: 404 }
				);
			}

			// Update password in Firebase using Admin SDK
			try {
				await admin.auth().updateUser(user.firebaseId, {
					password: newPassword,
				});

				console.log("✅ Password updated successfully for user:", email);

				return NextResponse.json({
					success: true,
					message: "Password updated successfully",
				});
			} catch (firebaseError: any) {
				console.error("Firebase Admin update error:", firebaseError);
				return NextResponse.json(
					{
						success: false,
						error: firebaseError.message || "Failed to update password in Firebase"
					},
					{ status: 500 }
				);
			}
		}

		return NextResponse.json(
			{ success: false, error: "Invalid request parameters" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error resetting password:", error);
		return NextResponse.json(
			{ success: false, error: "An error occurred while resetting password" },
			{ status: 500 }
		);
	}
}

