"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOTPToEmail } from "@/actions/auth.action";
import toast from "react-hot-toast";

interface EmailVerificationStepProps {
	onEmailVerified: (email: string) => void;
	loading?: boolean;
	allowedDomain?: string;
}

export default function EmailVerificationStep({
	onEmailVerified,
	loading = false,
	allowedDomain,
}: EmailVerificationStepProps) {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSendOTP = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email || !email.includes("@")) {
			toast.error("Please enter a valid email address");
			return;
		}

		// Validate domain if allowedDomain is specified
		if (allowedDomain) {
			const emailDomain = email.split("@")[1]?.toLowerCase();
			if (emailDomain !== allowedDomain.toLowerCase()) {
				toast.error(`Please use your institutional email (@${allowedDomain})`);
				return;
			}
		}

		setIsLoading(true);
		try {
			const result = await sendOTPToEmail(email);

			if (result.success) {
				setSent(true);
				toast.success("OTP sent to your email!");
				onEmailVerified(email);
			} else {
				toast.error(result.error || "Failed to send OTP");
			}
		} catch (error) {
			toast.error("An error occurred while sending OTP");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold text-white">Verify Your Email</h3>

			{!sent ? (
				<form onSubmit={handleSendOTP} className="space-y-4">
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
						<Label htmlFor="email" className="text-gray-300">
							Email Address
						</Label>
						<div className="relative mt-2">
							<Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
							<Input
								id="email"
								type="email"
								placeholder={allowedDomain ? `your.email@${allowedDomain}` : "your.email@institution.com"}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isLoading || loading}
								className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
								required
							/>
						</div>
						<p className="text-xs text-gray-400 mt-2">
							{allowedDomain
								? `Use your institutional email ending with @${allowedDomain}`
								: "We'll send a verification code to this email"}
						</p>
					</motion.div>

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						type="submit"
						disabled={isLoading || loading}
						className="w-full py-2.5 px-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{isLoading || loading ? (
							<>
								<Loader className="w-4 h-4 animate-spin" />
								Sending...
							</>
						) : (
							"Send OTP"
						)}
					</motion.button>
				</form>
			) : (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="flex flex-col items-center space-y-4 py-8"
				>
					<motion.div
						animate={{ scale: [1, 1.1, 1] }}
						transition={{ duration: 2, repeat: Infinity }}
					>
						<div className="p-3 rounded-full bg-linear-to-br from-purple-500/20 to-pink-500/20">
							<CheckCircle className="w-8 h-8 text-green-400" />
						</div>
					</motion.div>
					<div className="text-center">
						<p className="text-white font-medium">OTP Sent Successfully!</p>
						<p className="text-gray-400 text-sm mt-1">Check your email for the verification code</p>
					</div>
				</motion.div>
			)}
		</div>
	);
}
