"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGoogle } from "@tabler/icons-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
	signInWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithPopup,
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Loader } from "lucide-react";
import {
	sendPasswordResetOTP,
	verifyPasswordResetOTP,
	createPasswordResetSession,
	updatePasswordWithToken,
} from "@/actions/auth.action";
import toast from "react-hot-toast";

type PasswordTabState = "login" | "forgot-password-email" | "forgot-password-otp" | "reset-password";

export default function SigninFormDemo() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	// Password reset state
	const [passwordTabState, setPasswordTabState] = useState<PasswordTabState>("login");
	const [resetEmail, setResetEmail] = useState("");
	const [resetOtp, setResetOtp] = useState("");
	const [resetToken, setResetToken] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showSuccessModal, setShowSuccessModal] = useState(false);

	const handleEmailPasswordSignin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		try {
			setIsLoading(true);
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			// Sync user with database
			await fetch("/api/auth/sync", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					firebaseId: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL,
				}),
			});

			toast.success("Signed in successfully!");
			router.push("/");
		} catch (err: any) {
			let errorMessage = err.message;
			if (err.code === "auth/user-not-found") {
				errorMessage = "No account found with this email. Please sign up first.";
			} else if (err.code === "auth/wrong-password") {
				errorMessage = "Incorrect password. Please try again.";
			} else if (err.code === "auth/invalid-credential") {
				errorMessage = "Invalid email or password. Please check and try again.";
			} else if (err.code === "auth/user-disabled") {
				errorMessage = "This account has been disabled. Please contact support.";
			}
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle sending OTP for password reset
	const handleSendPasswordResetOTP = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (!resetEmail) {
			setError("Please enter your email");
			return;
		}

		setIsLoading(true);
		try {
			const result = await sendPasswordResetOTP(resetEmail);

			if (result.success) {
				setPasswordTabState("forgot-password-otp");
				toast.success("OTP sent to your email!");
			} else {
				setError(result.error || "Failed to send OTP");
				toast.error(result.error || "Failed to send OTP");
			}
		} catch (error) {
			toast.error("An error occurred while sending OTP");
			setError("An error occurred while sending OTP");
		} finally {
			setIsLoading(false);
		}
	};

	// Handle verifying OTP for password reset
	const handleVerifyPasswordResetOTP = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (!resetOtp || resetOtp.length !== 6) {
			setError("Please enter a valid 6-digit OTP");
			return;
		}

		setIsLoading(true);
		try {
			const result = await verifyPasswordResetOTP(resetEmail, resetOtp);

			if (result.success) {
				// Create password reset session
				const sessionResult = await createPasswordResetSession(resetEmail, resetOtp);

				if (sessionResult.success && sessionResult.resetToken) {
					setResetToken(sessionResult.resetToken);
					setPasswordTabState("reset-password");
					toast.success("OTP verified! Please enter your new password.");
				} else {
					setError(sessionResult.error || "Failed to create reset session");
					toast.error(sessionResult.error || "Failed to create reset session");
				}
			} else {
				setError(result.error || "Invalid OTP");
				toast.error(result.error || "Invalid OTP");
			}
		} catch (error) {
			toast.error("An error occurred while verifying OTP");
			setError("An error occurred while verifying OTP");
		} finally {
			setIsLoading(false);
		}
	};

	// Handle password reset without old password
	const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (!newPassword || !confirmPassword) {
			setError("Please enter both passwords");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (newPassword.length < 6) {
			setError("Password must be at least 6 characters long");
			return;
		}

		setIsLoading(true);
		try {
			// Validate reset token and update password
			const updateResult = await updatePasswordWithToken(resetEmail, resetToken, newPassword);

			if (!updateResult.success) {
				setError(updateResult.error || "Failed to reset password");
				toast.error(updateResult.error || "Failed to reset password");
				setIsLoading(false);
				return;
			}

			// Call the API endpoint to update in Firebase
			const resetResponse = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					resetToken,
					email: resetEmail,
					newPassword,
				}),
			});

			const resetData = await resetResponse.json();

			if (!resetResponse.ok || !resetData.success) {
				setError(resetData.error || "Failed to reset password");
				toast.error(resetData.error || "Failed to reset password");
				setIsLoading(false);
				return;
			}

			// Password reset successful
			setShowSuccessModal(true);

			// Reset form
			setResetEmail("");
			setResetOtp("");
			setResetToken("");
			setNewPassword("");
			setConfirmPassword("");
			setPassword("");
			setEmail("");
			setError("");
		} catch (err: any) {
			console.error("Password reset error:", err);
			let errorMessage = "Failed to reset password";
			if (err.message) {
				errorMessage = err.message;
			}
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignin = async () => {
		setError("");
		try {
			setIsGoogleLoading(true);
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			// Sync user with database
			await fetch("/api/auth/sync", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					firebaseId: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL,
				}),
			});

			toast.success("Signed in successfully!");
			router.push("/");
		} catch (err: any) {
			let errorMessage = err.message;
			if (err.code === "auth/popup-closed-by-user") {
				errorMessage = "Sign-in was cancelled. Please try again.";
			} else if (err.code === "auth/account-exists-with-different-credential") {
				errorMessage = "An account with this email exists using a different sign-in method.";
			}
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsGoogleLoading(false);
		}
	};

	return (
		<div className="min-h-screen py-12 px-4 flex justify-center items-center bg-linear-to-br from-[#060010] via-[#0f0820] to-[#1a0033]">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="border-[#5227FF] border-2 shadow-input mx-auto w-full max-w-md rounded-2xl bg-black/80 backdrop-blur-xl p-4 md:p-8"
			>
				<h2 className="text-xl font-bold text-neutral-200">Welcome Back to PeerPulse</h2>
				<p className="mt-2 max-w-sm text-sm text-neutral-300">
					Sign in to your account to continue
				</p>

				<div className="mt-8">
					<AnimatePresence mode="wait">
						{/* Login State */}
						{passwordTabState === "login" && (
							<motion.div
								key="login"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
							>
								<form className="space-y-4" onSubmit={handleEmailPasswordSignin}>
									<LabelInputContainer className="mb-4">
										<Label htmlFor="email">Email Address</Label>
										<Input
											id="email"
											placeholder="projectmayhem@fc.com"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											disabled={isLoading || isGoogleLoading}
											required
										/>
									</LabelInputContainer>
									<LabelInputContainer className="mb-4">
										<Label htmlFor="password">Password</Label>
										<Input
											id="password"
											placeholder="••••••••"
											type="password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											disabled={isLoading || isGoogleLoading}
											required
										/>
									</LabelInputContainer>

									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className="group/btn relative flex h-10 w-full rounded-md bg-linear-to-br from-zinc-900 to-zinc-900 font-medium text-white shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center"
										type="submit"
										disabled={isLoading || isGoogleLoading}
									>
										{isLoading ? "Signing in..." : "Sign in →"}
										<BottomGradient />
									</motion.button>

									{error && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="mt-4 space-y-3"
										>
											<p className="text-sm text-red-500">{error}</p>
											<motion.button
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												type="button"
												onClick={() => {
													setPasswordTabState("forgot-password-email");
													setResetEmail(email);
													setError("");
												}}
												className="w-full text-sm text-purple-400 hover:text-purple-300 font-medium py-2 px-3 rounded-md border border-purple-500/30 hover:border-purple-500/50 transition-colors"
											>
												Forgot Password? Reset via OTP
											</motion.button>
										</motion.div>
									)}
								</form>

								<div className="my-6 flex items-center gap-4">
									<div className="h-px flex-1 bg-linear-to-r from-transparent via-neutral-700 to-transparent" />
									<span className="text-sm text-neutral-500">or</span>
									<div className="h-px flex-1 bg-linear-to-r from-transparent via-neutral-700 to-transparent" />
								</div>

								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									type="button"
									onClick={handleGoogleSignin}
									disabled={isLoading || isGoogleLoading}
									className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-zinc-900 px-4 font-medium text-white shadow-[0px_0px_1px_1px_#262626] disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<IconBrandGoogle className="h-4 w-4 text-neutral-300" />
									<span className="text-sm text-neutral-300">
										{isGoogleLoading ? "Signing in..." : "Continue with Google"}
									</span>
									<BottomGradient />
								</motion.button>
							</motion.div>
						)}

						{/* Forgot Password - Email State */}
						{passwordTabState === "forgot-password-email" && (
							<motion.div
								key="forgot-email"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
							>
								<form className="space-y-4" onSubmit={handleSendPasswordResetOTP}>
									<div className="mb-4">
										<h3 className="text-lg font-semibold text-white mb-2">Reset Your Password</h3>
										<p className="text-sm text-gray-400">
											Enter your email address and we&apos;ll send you an OTP to reset your password.
										</p>
									</div>

									<LabelInputContainer className="mb-4">
										<Label htmlFor="reset-email">Email Address</Label>
										<Input
											id="reset-email"
											placeholder="projectmayhem@fc.com"
											type="email"
											value={resetEmail}
											onChange={(e) => setResetEmail(e.target.value)}
											disabled={isLoading}
											required
										/>
									</LabelInputContainer>

									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className="group/btn relative flex h-10 w-full rounded-md bg-linear-to-br from-zinc-900 to-zinc-900 font-medium text-white shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
										type="submit"
										disabled={isLoading}
									>
										{isLoading ? (
											<>
												<Loader className="w-4 h-4 animate-spin" />
												Sending OTP...
											</>
										) : (
											"Send OTP →"
										)}
										<BottomGradient />
									</motion.button>

									{error && (
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="text-sm text-red-500"
										>
											{error}
										</motion.p>
									)}

									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										type="button"
										onClick={() => {
											setPasswordTabState("login");
											setResetEmail("");
											setError("");
										}}
										className="w-full text-sm text-purple-400 hover:text-purple-300 font-medium"
									>
										← Back to login
									</motion.button>
								</form>
							</motion.div>
						)}

						{/* Forgot Password - OTP Verification State */}
						{passwordTabState === "forgot-password-otp" && (
							<motion.div
								key="forgot-otp"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
							>
								<form className="space-y-4" onSubmit={handleVerifyPasswordResetOTP}>
									<div className="mb-4">
										<h3 className="text-lg font-semibold text-white mb-2">Verify OTP</h3>
										<p className="text-sm text-gray-400">
											We sent a 6-digit code to <span className="font-medium text-white">{resetEmail}</span>
										</p>
									</div>

									<LabelInputContainer className="mb-4">
										<Label htmlFor="reset-otp">Verification Code</Label>
										<Input
											id="reset-otp"
											type="text"
											placeholder="000000"
											value={resetOtp}
											onChange={(e) => {
												const value = e.target.value.replace(/\D/g, "").slice(0, 6);
												setResetOtp(value);
											}}
											disabled={isLoading}
											maxLength={6}
											className="text-center text-2xl tracking-widest font-mono bg-gray-900 border-gray-700 text-white placeholder-gray-600"
											required
										/>
									</LabelInputContainer>

									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className="group/btn relative flex h-10 w-full rounded-md bg-linear-to-br from-zinc-900 to-zinc-900 font-medium text-white shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
										type="submit"
										disabled={isLoading || resetOtp.length !== 6}
									>
										{isLoading ? (
											<>
												<Loader className="w-4 h-4 animate-spin" />
												Verifying...
											</>
										) : (
											"Verify OTP →"
										)}
										<BottomGradient />
									</motion.button>

									{error && (
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="text-sm text-red-500"
										>
											{error}
										</motion.p>
									)}

									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										type="button"
										onClick={() => {
											setPasswordTabState("forgot-password-email");
											setResetOtp("");
											setError("");
										}}
										className="w-full text-sm text-purple-400 hover:text-purple-300 font-medium"
									>
										← Back to email
									</motion.button>
								</form>
							</motion.div>
						)}

						{/* Reset Password State */}
						{passwordTabState === "reset-password" && (
							<motion.div
								key="reset-password"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
							>
								<form className="space-y-4" onSubmit={handleResetPassword}>
									<div className="mb-4">
										<h3 className="text-lg font-semibold text-white mb-2">Create New Password</h3>
										<p className="text-sm text-gray-400">
											Your identity has been verified. Now set a strong new password.
										</p>
									</div>

									<LabelInputContainer className="mb-4">
										<Label htmlFor="new-password">New Password</Label>
										<Input
											id="new-password"
											placeholder="••••••••"
											type="password"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											disabled={isLoading}
											required
										/>
									</LabelInputContainer>

									<LabelInputContainer className="mb-4">
										<Label htmlFor="confirm-password">Confirm Password</Label>
										<Input
											id="confirm-password"
											placeholder="••••••••"
											type="password"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											disabled={isLoading}
											required
										/>
									</LabelInputContainer>

									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className="group/btn relative flex h-10 w-full rounded-md bg-linear-to-br from-zinc-900 to-zinc-900 font-medium text-white shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center"
										type="submit"
										disabled={isLoading}
									>
										{isLoading ? "Resetting Password..." : "Reset Password →"}
										<BottomGradient />
									</motion.button>

									{error && (
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="text-sm text-red-500"
										>
											{error}
										</motion.p>
									)}
								</form>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Success Modal */}
				<AnimatePresence>
					{showSuccessModal && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
							onClick={() => {
								setShowSuccessModal(false);
								setPasswordTabState("login");
							}}
						>
							<motion.div
								initial={{ scale: 0.95, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.95, opacity: 0 }}
								className="border-[#5227FF] border-2 bg-black/90 backdrop-blur-xl rounded-2xl p-8 max-w-sm mx-4 text-center"
								onClick={(e) => e.stopPropagation()}
							>
								<div className="mb-6">
									<div className="w-16 h-16 bg-linear-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
										<svg
											className="w-8 h-8 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={3}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</div>
									<h3 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h3>
									<p className="text-gray-400 text-sm mb-4">
										Your password has been successfully updated. You can now sign in with your new password.
									</p>
								</div>

								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => {
										setShowSuccessModal(false);
										setPasswordTabState("login");
									}}
									className="w-full py-3 px-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
								>
									Back to Sign In
								</motion.button>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				<div className="my-6 h-px w-full bg-linear-to-r from-transparent via-neutral-700 to-transparent" />

				<div className="text-center text-sm text-neutral-300">
					Don&apos;t have an account?{" "}
					<Link href="/signup" className="font-medium text-neutral-200 hover:text-white">
						Create a new account
					</Link>
				</div>
			</motion.div>
		</div>
	);
}

const BottomGradient = () => (
	<>
		<span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
		<span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
	</>
);

const LabelInputContainer = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<div className={cn("flex w-full flex-col space-y-2", className)}>
		{children}
	</div>
);
