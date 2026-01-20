"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGoogle } from "@tabler/icons-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import {
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft } from "lucide-react";
import DesignationSelector from "@/components/auth/DesignationSelector";
import InstitutionSelector from "@/components/auth/InstitutionSelector";
import EmailVerificationStep from "@/components/auth/EmailVerificationStep";
import OTPVerificationStep from "@/components/auth/OTPVerificationStep";
import { signupWithVerification, syncGoogleUser } from "@/actions/auth.action";
import toast from "react-hot-toast";

type SignupStep =
	| "method"
	| "designation"
	| "institution"
	| "email"
	| "otp"
	| "details"
	| "success";

export default function SignupFormDemo() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState<SignupStep>("method");
	const [designation, setDesignation] =
		useState<"STUDENT" | "TEACHER" | "WORKING_PROFESSIONAL">();
	const [institution, setInstitution] = useState("");
	const [institutionDomain, setInstitutionDomain] = useState("");
	const [email, setEmail] = useState("");
	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// Track which method user selected
	const [signupMethod, setSignupMethod] = useState<"verified" | "unverified">();

	const handleGoogleSignup = async () => {
		setError("");
		try {
			setIsLoading(true);
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			// Email is required for account creation
			if (!user.email) {
				toast.error("Email is required. Please use an account with an email.");
				return;
			}

			// Sync user with database (unverified)
			const dbUser = await syncGoogleUser(
				user.uid,
				user.email,
				user.displayName,
				user.photoURL
			);

			if (dbUser) {
				toast.success("Account created successfully!");
				router.push("/");
			} else {
				toast.error("Failed to create account");
			}
		} catch (err: any) {
			setError(err.message);
			toast.error(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifiedSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (!firstname || !lastname || !password) {
			setError("Please fill in all required fields");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		setIsLoading(true);
		try {
			// Create Firebase user with email/password
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			// Signup with verification
			const result = await signupWithVerification(
				user.uid,
				email,
				`${firstname} ${lastname}`,
				user.photoURL,
				designation!,
				institution
			);

			if (result.success) {
				toast.success("Account created successfully!");
				setCurrentStep("success");
				setTimeout(() => router.push("/"), 2000);
			} else {
				setError(result.error || "Signup failed");
				toast.error(result.error || "Signup failed");
			}
		} catch (err: any) {
			setError(err.message);
			toast.error(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUnverifiedSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (!firstname || !lastname || !password) {
			setError("Please fill in all required fields");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		setIsLoading(true);
		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
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
					displayName: `${firstname} ${lastname}`,
					photoURL: user.photoURL,
					isVerified: false,
				}),
			});

			toast.success("Account created successfully!");
			router.push("/");
		} catch (err: any) {
			setError(err.message);
			toast.error(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen py-12 px-4 flex justify-center items-center bg-linear-to-br from-[#060010] via-[#0f0820] to-[#1a0033]">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="border-[#5227FF] border-2 shadow-input mx-auto w-full max-w-md rounded-2xl bg-black/80 backdrop-blur-xl p-4 md:p-8"
			>
				{/* Header with back button */}
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-xl font-bold text-neutral-200">Join PeerPulse</h2>
						<p className="mt-1 max-w-sm text-xs text-neutral-400">
							{currentStep === "method" && "Choose how to get started"}
							{currentStep === "designation" && "Select your role"}
							{currentStep === "institution" && "Choose your institution"}
							{currentStep === "email" && "Verify your email"}
							{currentStep === "otp" && "Enter verification code"}
							{currentStep === "details" && "Complete your profile"}
							{currentStep === "success" && "All set!"}
						</p>
					</div>
					{currentStep !== "method" && currentStep !== "success" && (
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => {
								if (
									currentStep === "designation" ||
									currentStep === "details"
								) {
									setCurrentStep("method");
									setSignupMethod(undefined);
								} else if (currentStep === "institution") {
									setCurrentStep("designation");
								} else if (currentStep === "email") {
									setCurrentStep("institution");
								} else if (currentStep === "otp") {
									setCurrentStep("email");
								}
							}}
							className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
						>
							<ChevronLeft className="w-5 h-5 text-gray-400" />
						</motion.button>
					)}
				</div>

				<AnimatePresence mode="wait">
					{/* STEP 1: Choose Method */}
					{currentStep === "method" && (
						<motion.div
							key="method"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-4"
						>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => {
									setSignupMethod("verified");
									setCurrentStep("designation");
								}}
								className="w-full p-4 rounded-xl border-2 border-gray-700 bg-gray-900/50 hover:bg-gray-800/70 hover:border-purple-500/50 transition-all duration-300 text-left group"
							>
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-semibold text-white">
											Get Verified
										</h3>
										<p className="text-xs text-gray-400 mt-1">
											Prove your designation with email verification
										</p>
									</div>
									<ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-500 transition-colors" />
								</div>
							</motion.button>

							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => {
									setSignupMethod("unverified");
									setCurrentStep("details");
									setEmail("");
									setFirstname("");
									setLastname("");
									setPassword("");
								}}
								className="w-full p-4 rounded-xl border-2 border-gray-700 bg-gray-900/50 hover:bg-gray-800/70 hover:border-purple-500/50 transition-all duration-300 text-left group"
							>
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-semibold text-white">
											Quick Signup
										</h3>
										<p className="text-xs text-gray-400 mt-1">
											Use email & password or Google
										</p>
									</div>
									<ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-500 transition-colors" />
								</div>
							</motion.button>

							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-700" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="px-2 bg-black text-gray-500">
										Or continue with
									</span>
								</div>
							</div>

							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								type="button"
								onClick={handleGoogleSignup}
								disabled={isLoading}
								className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-lg bg-zinc-900 px-4 font-medium text-white shadow-[0px_0px_1px_1px_#262626] disabled:opacity-50"
							>
								<IconBrandGoogle className="h-4 w-4 text-neutral-300" />
								<span className="text-sm text-neutral-300">
									Sign up with Google
								</span>
							</motion.button>

							<div className="text-center text-sm text-neutral-300 mt-6">
								Already have an account?{" "}
								<Link
									href="/signin"
									className="font-medium text-neutral-200 hover:text-white"
								>
									Sign in
								</Link>
							</div>
						</motion.div>
					)}

					{/* STEP 2: Designation */}
					{currentStep === "designation" && (
						<motion.div
							key="designation"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-6"
						>
							<DesignationSelector
								onSelect={setDesignation}
								selected={designation}
							/>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => setCurrentStep("institution")}
								disabled={!designation}
								className="w-full py-2.5 px-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Continue
							</motion.button>
						</motion.div>
					)}

					{/* STEP 3: Institution */}
					{currentStep === "institution" && designation && (
						<motion.div
							key="institution"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-6"
						>
							<InstitutionSelector
								designation={designation}
								onSelect={(name, domain) => {
									setInstitution(name);
									setInstitutionDomain(domain);
								}}
								selected={institution}
							/>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => setCurrentStep("email")}
								disabled={!institution}
								className="w-full py-2.5 px-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Continue
							</motion.button>
						</motion.div>
					)}

					{/* STEP 4: Email Verification */}
					{currentStep === "email" && (
						<motion.div
							key="email"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<EmailVerificationStep
								onEmailVerified={(verifiedEmail) => {
									setEmail(verifiedEmail);
									setCurrentStep("otp");
								}}
								loading={isLoading}
								allowedDomain={institutionDomain}
							/>
						</motion.div>
					)}

					{/* STEP 5: OTP Verification */}
					{currentStep === "otp" && (
						<motion.div
							key="otp"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<OTPVerificationStep
								email={email}
								onOTPVerified={() => setCurrentStep("details")}
								loading={isLoading}
							/>
						</motion.div>
					)}

					{/* STEP 6: Details (for verified) */}
					{currentStep === "details" && signupMethod === "verified" && (
						<motion.form
							key="details-verified"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-4"
							onSubmit={handleVerifiedSubmit}
						>
							<div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
								<LabelInputContainer>
									<Label htmlFor="firstname">
										First name
									</Label>
									<Input
										id="firstname"
										placeholder="John"
										type="text"
										value={firstname}
										onChange={(e) =>
											setFirstname(e.target.value)
										}
										disabled={isLoading}
										required
									/>
								</LabelInputContainer>
								<LabelInputContainer>
									<Label htmlFor="lastname">
										Last name
									</Label>
									<Input
										id="lastname"
										placeholder="Doe"
										type="text"
										value={lastname}
										onChange={(e) =>
											setLastname(e.target.value)
										}
										disabled={isLoading}
										required
									/>
								</LabelInputContainer>
							</div>

							<LabelInputContainer className="mb-8">
								<Label htmlFor="password">
									Password
								</Label>
								<Input
									id="password"
									placeholder="••••••••"
									type="password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									disabled={isLoading}
									required
								/>
							</LabelInputContainer>

							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-zinc-900 to-zinc-900 font-medium text-white shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed"
								type="submit"
								disabled={isLoading}
							>
								{isLoading ? "Creating account..." : "Sign up →"}
								<BottomGradient />
							</motion.button>

							{error && (
								<motion.p
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="mt-4 text-sm text-red-500"
								>
									{error}
								</motion.p>
							)}
						</motion.form>
					)}

					{/* STEP 6: Details (for unverified) */}
					{currentStep === "details" && signupMethod === "unverified" && (
						<motion.div
							key="details-unverified"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-4"
						>
							<form className="space-y-4" onSubmit={handleUnverifiedSubmit}>
								<div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
									<LabelInputContainer>
										<Label htmlFor="firstname">
											First name
										</Label>
										<Input
											id="firstname"
											placeholder="John"
											type="text"
											value={firstname}
											onChange={(e) =>
												setFirstname(e.target.value)
											}
											disabled={isLoading}
											required
										/>
									</LabelInputContainer>
									<LabelInputContainer>
										<Label htmlFor="lastname">
											Last name
										</Label>
										<Input
											id="lastname"
											placeholder="Doe"
											type="text"
											value={lastname}
											onChange={(e) =>
												setLastname(e.target.value)
											}
											disabled={isLoading}
											required
										/>
									</LabelInputContainer>
								</div>

								<LabelInputContainer className="mb-4">
									<Label htmlFor="email-unreg">
										Email Address
									</Label>
									<Input
										id="email-unreg"
										placeholder="john@example.com"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={isLoading}
										required
									/>
								</LabelInputContainer>

								<LabelInputContainer className="mb-8">
									<Label htmlFor="password-unreg">
										Password
									</Label>
									<Input
										id="password-unreg"
										placeholder="••••••••"
										type="password"
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										disabled={isLoading}
										required
									/>
								</LabelInputContainer>

								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-zinc-900 to-zinc-900 font-medium text-white shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed"
									type="submit"
									disabled={isLoading}
								>
									{isLoading
										? "Creating account..."
										: "Sign up →"}
									<BottomGradient />
								</motion.button>

								{error && (
									<motion.p
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="mt-4 text-sm text-red-500"
									>
										{error}
									</motion.p>
								)}
							</form>

							<div className="my-6 h-px w-full bg-linear-to-r from-transparent via-neutral-700 to-transparent" />

							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								type="button"
								onClick={handleGoogleSignup}
								disabled={isLoading}
								className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-lg bg-zinc-900 px-4 font-medium text-white shadow-[0px_0px_1px_1px_#262626] disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<IconBrandGoogle className="h-4 w-4 text-neutral-300" />
								<span className="text-sm text-neutral-300">
									Or continue with Google
								</span>
							</motion.button>

							<div className="text-center text-sm text-neutral-300 mt-4">
								Already have an account?{" "}
								<Link
									href="/signin"
									className="font-medium text-neutral-200 hover:text-white"
								>
									Sign in
								</Link>
							</div>
						</motion.div>
					)}

					{/* Success State */}
					{currentStep === "success" && (
						<motion.div
							key="success"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							className="flex flex-col items-center justify-center space-y-4 py-12"
						>
							<motion.div
								animate={{ scale: [1, 1.1, 1] }}
								transition={{ duration: 2, repeat: Infinity }}
								className="p-4 rounded-full bg-linear-to-br from-purple-500/20 to-pink-500/20"
							>
								<svg
									className="w-12 h-12 text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</motion.div>
							<div className="text-center">
								<h3 className="text-xl font-bold text-white">
									Account Created!
								</h3>
								<p className="text-gray-400 text-sm mt-2">
									Redirecting you to explore PeerPulse...
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
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
