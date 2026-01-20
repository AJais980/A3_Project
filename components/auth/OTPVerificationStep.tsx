"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyOTPCode } from "@/actions/auth.action";
import toast from "react-hot-toast";

interface OTPVerificationStepProps {
	email: string;
	onOTPVerified: () => void;
	loading?: boolean;
}

export default function OTPVerificationStep({
	email,
	onOTPVerified,
	loading = false,
}: OTPVerificationStepProps) {
	const [otp, setOtp] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleVerifyOTP = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!otp || otp.length !== 6) {
			toast.error("Please enter a valid 6-digit OTP");
			return;
		}

		setIsLoading(true);
		try {
			const result = await verifyOTPCode(email, otp);

			if (result.success) {
				toast.success("Email verified successfully!");
				onOTPVerified();
			} else {
				toast.error(result.error || "Invalid OTP");
				setOtp("");
			}
		} catch (error) {
			toast.error("An error occurred while verifying OTP");
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "").slice(0, 6);
		setOtp(value);
	};

	return (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold text-white">Enter Verification Code</h3>

			<form onSubmit={handleVerifyOTP} className="space-y-4">
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
					<Label htmlFor="otp" className="text-gray-300">
						Verification Code
					</Label>
					<p className="text-xs text-gray-400 mb-2">
						We sent a 6-digit code to <span className="font-medium text-white">{email}</span>
					</p>
					<Input
						id="otp"
						type="text"
						placeholder="000000"
						value={otp}
						onChange={handleInputChange}
						disabled={isLoading || loading}
						maxLength={6}
						className="text-center text-2xl tracking-widest font-mono bg-gray-900 border-gray-700 text-white placeholder-gray-600"
						required
					/>
				</motion.div>

				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					type="submit"
					disabled={isLoading || loading || otp.length !== 6}
					className="w-full py-2.5 px-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{isLoading || loading ? (
						<>
							<Loader className="w-4 h-4 animate-spin" />
							Verifying...
						</>
					) : (
						"Verify Code"
					)}
				</motion.button>

				<p className="text-xs text-gray-400 text-center">
					Didn't receive the code?{" "}
					<button
						type="button"
						className="text-purple-400 hover:text-purple-300 font-medium"
						disabled={isLoading || loading}
					>
						Resend
					</button>
				</p>
			</form>
		</div>
	);
}
