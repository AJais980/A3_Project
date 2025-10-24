"use client";
import React, { useState } from "react";
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

export default function SignupFormDemo() {
	const router = useRouter();
	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			// Sync user with database
			await fetch('/api/auth/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					firebaseId: user.uid,
					email: user.email,
					displayName: `${firstname} ${lastname}`,
					photoURL: user.photoURL,
				}),
			});

			router.push("/");
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleGoogleSignup = async () => {
		setError("");
		try {
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			// Sync user with database
			await fetch('/api/auth/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					firebaseId: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL,
				}),
			});

			router.push("/");
		} catch (err: any) {
			setError(err.message);
		}
	};

	return (
		<div className="min-h-screen py-12 px-4 flex justify-center items-center bg-[#060010]">
			<div className="border-[#5227FF] border-2 shadow-input mx-auto w-full max-w-md rounded-2xl bg-black p-4 md:p-8">
				<h2 className="text-xl font-bold text-neutral-200">
					Welcome to PeerPulse
				</h2>
				<p className="mt-2 max-w-sm text-sm text-neutral-300">
					Create an account below
				</p>

				<form className="my-12 py-4" onSubmit={handleSubmit}>
					<div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
						<LabelInputContainer>
							<Label htmlFor="firstname">First name</Label>
							<Input
								id="firstname"
								placeholder="Tyler"
								type="text"
								value={firstname}
								onChange={(e) => setFirstname(e.target.value)}
								required
							/>
						</LabelInputContainer>
						<LabelInputContainer>
							<Label htmlFor="lastname">Last name</Label>
							<Input
								id="lastname"
								placeholder="Durden"
								type="text"
								value={lastname}
								onChange={(e) => setLastname(e.target.value)}
								required
							/>
						</LabelInputContainer>
					</div>
					<LabelInputContainer className="mb-4">
						<Label htmlFor="email">Email Address</Label>
						<Input
							id="email"
							placeholder="projectmayhem@fc.com"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</LabelInputContainer>
					<LabelInputContainer className="mb-8">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							placeholder="••••••••"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</LabelInputContainer>

					<button
						className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-zinc-900 to-zinc-900 font-medium text-white shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
						type="submit"
					>
						Sign up &rarr;
						<BottomGradient />
					</button>

					{error && (
						<p className="mt-4 text-sm text-red-500">{error}</p>
					)}

					<div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

					<div className="flex flex-col space-y-4">
						<button
							className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-zinc-900 px-4 font-medium text-black shadow-[0px_0px_1px_1px_#262626]"
							type="button"
							onClick={handleGoogleSignup}
						>
							<IconBrandGoogle className="h-4 w-4 text-neutral-300" />
							<span className="text-sm text-neutral-300">
								Sign up with Google
							</span>
							<BottomGradient />
						</button>

						<div className="text-center text-sm text-neutral-300">
							Already have an account?{" "}
							<Link href="/signin" className="font-medium text-neutral-200 hover:text-white">
								Sign in
							</Link>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

const BottomGradient = () => (
	<>
		<span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
		<span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
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
