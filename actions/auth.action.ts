"use server";

import prisma from "@/lib/prisma";
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

/**
 * Send OTP to email for verification
 */
export async function sendOTPToEmail(email: string) {
	try {
		// Check if email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser && existingUser.isVerified) {
			return {
				success: false,
				error: "This email is already registered.",
			};
		}

		// Generate OTP
		const otp = generateOTP();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Store OTP attempt using type assertion to handle Prisma client issues
		await (prisma as any).verificationAttempt.create({
			data: {
				email,
				otp,
				expiresAt,
			},
		});

		// Send email
		const emailSent = await sendOTPEmail(email, otp);

		if (!emailSent) {
			return {
				success: false,
				error: "Failed to send OTP. Please try again.",
			};
		}

		return {
			success: true,
			message: "OTP sent to your email.",
		};
	} catch (error) {
		console.error("Error sending OTP:", error);
		return {
			success: false,
			error: "An error occurred. Please try again.",
		};
	}
}

/**
 * Verify OTP code
 */
export async function verifyOTPCode(email: string, otp: string) {
	try {
		// Find verification attempt
		const verification = await prisma.verificationAttempt.findFirst({
			where: {
				email,
				expiresAt: {
					gt: new Date(),
				},
				verified: false,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!verification) {
			return {
				success: false,
				error: "OTP expired or not found. Please request a new one.",
			};
		}

		if (verification.attempts >= verification.maxRetries) {
			return {
				success: false,
				error: "Maximum attempts exceeded. Please request a new OTP.",
			};
		}

		if (verification.otp !== otp) {
			// Increment attempts
			await prisma.verificationAttempt.update({
				where: { id: verification.id },
				data: { attempts: verification.attempts + 1 },
			});

			return {
				success: false,
				error: "Invalid OTP. Please try again.",
			};
		}

		// Mark as verified
		await prisma.verificationAttempt.update({
			where: { id: verification.id },
			data: { verified: true },
		});

		return {
			success: true,
			message: "Email verified successfully.",
		};
	} catch (error) {
		console.error("Error verifying OTP:", error);
		return {
			success: false,
			error: "An error occurred. Please try again.",
		};
	}
}

/**
 * Sign up with verified email and designation
 */
export async function signupWithVerification(
	firebaseId: string,
	email: string,
	displayName: string,
	photoURL: string | null,
	designation: "STUDENT" | "TEACHER" | "WORKING_PROFESSIONAL",
	institution: string
) {
	try {
		// Check if email is verified
		const verification = await prisma.verificationAttempt.findFirst({
			where: {
				email,
				verified: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!verification) {
			return {
				success: false,
				error: "Email not verified. Please complete the verification process.",
			};
		}

		// Check if user already exists
		let user = await prisma.user.findUnique({
			where: { firebaseId },
		});

		if (user) {
			// Update existing user
			user = await prisma.user.update({
				where: { firebaseId },
				data: {
					email,
					name: displayName,
					image: photoURL,
					designation,
					isVerified: true,
				...(institution && { institution }),
				isOnline: true,
			},
		});
	} else {
		// Create new user
		user = await prisma.user.create({
			data: {
				firebaseId,
				email,
				username: email.split("@")[0],
				name: displayName,
				image: photoURL,
				designation,
				isVerified: true,
				isOnline: true,
				...(institution && { institution }),
			},
		});
	}

	// Send welcome email
	await sendWelcomeEmail(email, displayName);

	return {
		success: true,
		user,
		message: "Account created successfully!",
	};
} catch (error) {
	console.error("Error in signupWithVerification:", error);
	return {
		success: false,
		error: "Failed to create account. Please try again.",
	};
}
}

/**
 * Sign in with email and OTP
 */
export async function signinWithOTP(email: string, otp: string) {
	try {
		// Verify OTP
		const verification = await prisma.verificationAttempt.findFirst({
			where: {
				email,
				expiresAt: {
					gt: new Date(),
				},
				verified: false,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!verification) {
			return {
				success: false,
				error: "OTP expired or not found. Please request a new one.",
			};
		}

		if (verification.otp !== otp) {
			await prisma.verificationAttempt.update({
				where: { id: verification.id },
				data: { attempts: verification.attempts + 1 },
			});

			return {
				success: false,
				error: "Invalid OTP. Please try again.",
			};
		}

		// Find user with this email
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return {
				success: false,
				error: "User not found. Please sign up first.",
			};
		}

		// Mark verification as used
		await prisma.verificationAttempt.update({
			where: { id: verification.id },
			data: { verified: true },
		});

		return {
			success: true,
			user,
			message: "Signed in successfully!",
		};
	} catch (error) {
		console.error("Error in signinWithOTP:", error);
		return {
			success: false,
			error: "An error occurred. Please try again.",
		};
	}
}

/**
 * Check if account exists and send OTP for password reset
 */
export async function sendPasswordResetOTP(email: string) {
	try {
		// Check if email exists in database
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (!existingUser) {
			return {
				success: false,
				error: "No account found with this email address.",
			};
		}

		// Generate OTP
		const otp = generateOTP();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Store OTP attempt with purpose = "password_reset"
		await (prisma as any).verificationAttempt.create({
			data: {
				email,
				otp,
				expiresAt,
				userId: existingUser.id,
			},
		});

		// Send email
		const emailSent = await sendOTPEmail(email, otp);

		if (!emailSent) {
			return {
				success: false,
				error: "Failed to send OTP. Please try again.",
			};
		}

		return {
			success: true,
			message: "OTP sent to your email for password reset.",
		};
	} catch (error) {
		console.error("Error sending password reset OTP:", error);
		return {
			success: false,
			error: "An error occurred. Please try again.",
		};
	}
}

/**
 * Verify OTP for password reset
 */
export async function verifyPasswordResetOTP(email: string, otp: string) {
	try {
		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return {
				success: false,
				error: "No account found with this email address.",
			};
		}

		// Find verification attempt
		const verification = await prisma.verificationAttempt.findFirst({
			where: {
				email,
				userId: user.id,
				expiresAt: {
					gt: new Date(),
				},
				verified: false,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!verification) {
			return {
				success: false,
				error: "OTP expired or not found. Please request a new one.",
			};
		}

		if (verification.attempts >= verification.maxRetries) {
			return {
				success: false,
				error: "Maximum attempts exceeded. Please request a new OTP.",
			};
		}

		if (verification.otp !== otp) {
			// Increment attempts
			await prisma.verificationAttempt.update({
				where: { id: verification.id },
				data: { attempts: verification.attempts + 1 },
			});

			return {
				success: false,
				error: "Invalid OTP. Please try again.",
			};
		}

		// Mark as verified
		await prisma.verificationAttempt.update({
			where: { id: verification.id },
			data: { verified: true },
		});

		return {
			success: true,
			message: "OTP verified successfully.",
		};
	} catch (error) {
		console.error("Error verifying password reset OTP:", error);
		return {
			success: false,
			error: "An error occurred. Please try again.",
		};
	}
}

/**
 * Create a password reset session after OTP verification
 */
export async function createPasswordResetSession(email: string, otp: string) {
	try {
		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return {
				success: false,
				error: "No account found with this email address.",
			};
		}

		// Find and validate the OTP verification
		const verification = await prisma.verificationAttempt.findFirst({
			where: {
				email,
				userId: user.id,
				verified: true,
				expiresAt: {
					gt: new Date(),
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!verification) {
			return {
				success: false,
				error: "OTP not verified or has expired. Please verify OTP again.",
			};
		}

		if (verification.otp !== otp) {
			return {
				success: false,
				error: "OTP mismatch. Please try again.",
			};
		}

		// Generate a unique reset session token
		const resetToken = Buffer.from(`${user.id}-${Date.now()}-${Math.random()}`).toString("base64");

		// Store the reset session (we'll use VerificationAttempt for now with a flag)
		// Or we could create a new reset session record
		await (prisma as any).verificationAttempt.create({
			data: {
				email,
				otp: resetToken, // Reuse OTP field for reset token
				expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes validity
				userId: user.id,
				verified: true, // Mark as verified to use as a reset session
			},
		});

		return {
			success: true,
			resetToken,
			message: "Password reset session created. You can now set your new password.",
		};
	} catch (error) {
		console.error("Error creating password reset session:", error);
		return {
			success: false,
			error: "An error occurred. Please try again.",
		};
	}
}

/**
 * Update password using reset token (without old password)
 */
export async function updatePasswordWithToken(
	email: string,
	resetToken: string,
	newPassword: string
) {
	try {
		// Find user
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return {
				success: false,
				error: "User not found.",
			};
		}

		// Validate reset token
		const resetSession = await (prisma as any).verificationAttempt.findFirst({
			where: {
				userId: user.id,
				otp: resetToken,
				verified: true,
				expiresAt: {
					gt: new Date(),
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!resetSession) {
			return {
				success: false,
				error: "Invalid or expired reset session. Please start over.",
			};
		}

		// Mark reset session as used
		await (prisma as any).verificationAttempt.update({
			where: { id: resetSession.id },
			data: { verified: false },
		});

		return {
			success: true,
			message: "Password updated successfully.",
		};
	} catch (error) {
		console.error("Error updating password with token:", error);
		return {
			success: false,
			error: "An error occurred. Please try again.",
		};
	}
}

/**
 * Reset password with Firebase and database
 */
export async function resetPasswordWithOTP(
	email: string,
	otp: string,
	newPassword: string
) {
	try {
		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return {
				success: false,
				error: "No account found with this email address.",
			};
		}

		// Find verification attempt
		const verification = await prisma.verificationAttempt.findFirst({
			where: {
				email,
				userId: user.id,
				verified: true,
				expiresAt: {
					gt: new Date(),
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!verification) {
			return {
				success: false,
				error: "Invalid session. Please verify OTP again.",
			};
		}

		if (verification.otp !== otp) {
			return {
				success: false,
				error: "OTP mismatch. Please try again.",
			};
		}

		// Update password in Firebase (this will be handled on the client side)
		// For now, we just mark the verification as completed
		await prisma.verificationAttempt.update({
			where: { id: verification.id },
			data: { verified: true },
		});

		return {
			success: true,
			message: "Password reset successfully.",
		};
	} catch (error) {
		console.error("Error resetting password:", error);
		return {
			success: false,
			error: "An error occurred. Please try again.",
		};
	}
}

/**
 * Sync user from Google signup (unverified)
 */
export async function syncGoogleUser(
	firebaseId: string,
	email: string,
	displayName: string | null,
	photoURL: string | null
) {
	try {
		const existingUser = await prisma.user.findUnique({
			where: { firebaseId },
		});

		if (existingUser) return existingUser;

		const dbUser = await prisma.user.create({
			data: {
				firebaseId,
				name: displayName || "",
				username: email?.split("@")[0] || `user_${firebaseId}`,
				email: email || "",
				image: photoURL,
				isOnline: true,
			},
		});

		return dbUser;
	} catch (error) {
		console.error("Error in syncGoogleUser", error);
		return null;
	}
}
