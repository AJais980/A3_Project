"use client";

import { useState } from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/lib/useAuth";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, X, Send } from "lucide-react";
import { Button } from "./ui/button";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import DynamicPDFSlider from "./DynamicPDFSlider";
import CodeBlock from "./CodeBlock";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPostCreated?: (newPost: any) => void;
};

export default function CreatePostModal({ open, onOpenChange, onPostCreated }: Props) {
	const { user } = useAuth();
	const [content, setContent] = useState("");
	const [fileUrl, setFileUrl] = useState("");
	const [fileType, setFileType] = useState<"image" | "pdf" | "code" | "">("");
	const [fileName, setFileName] = useState("");
	const [fileExtension, setFileExtension] = useState("");
	const [isPosting, setIsPosting] = useState(false);
	const [showFileUpload, setShowFileUpload] = useState(false);

	const handleSubmit = async () => {
		if (!content.trim() && !fileUrl) {
			toast.error("Please add some content or a file");
			return;
		}

		if (!user?.uid) {
			toast.error("Please sign in to create a post");
			return;
		}

		setIsPosting(true);
		try {
			const result = await createPost(content.trim(), fileUrl, user.uid, fileType, fileName, fileExtension);

			if (result?.success) {
				// Update the UI with the new post
				if (onPostCreated) {
					onPostCreated(result.post);
				}

				// Clear the form and close modal
				setContent("");
				setFileUrl("");
				setFileType("");
				setFileName("");
				setFileExtension("");
				setShowFileUpload(false);
				onOpenChange(false);
				toast.success("Post created successfully! 🎉");
			} else {
				console.error("Post creation failed:", result?.error);
				toast.error(result?.error || "Failed to create post. Please try again.");
			}
		} catch (error) {
			console.error("Error creating post:", error);
			toast.error("Failed to create post. Please try again.");
		} finally {
			setIsPosting(false);
		}
	};

	const handleClose = () => {
		if (isPosting) return;

		// Confirm if there's content
		if (content.trim() || fileUrl) {
			if (confirm("Discard your post?")) {
				setContent("");
				setFileUrl("");
				setFileType("");
				setFileName("");
				setFileExtension("");
				setShowFileUpload(false);
				onOpenChange(false);
			}
		} else {
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white p-0 gap-0 max-h-[90vh] overflow-hidden">
				{/* Header */}
				<DialogHeader className="px-6 py-4 border-b border-gray-800 pr-14">
					<DialogTitle className="text-xl font-semibold text-white">Create New Post</DialogTitle>
				</DialogHeader>

				{/* Content */}
				<div className="overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
					<div className="p-6 space-y-4">
						{/* User Info */}
						<div className="flex items-center space-x-3">
							<Avatar className="w-12 h-12 ring-2 ring-purple-500/50">
								<AvatarImage src={user?.photoURL || "./avatar.png"} />
							</Avatar>
							<div>
								<p className="font-semibold text-white">{user?.displayName || "User"}</p>
								<p className="text-sm text-gray-400">@{user?.email?.split('@')[0]}</p>
							</div>
						</div>

						{/* Content Input */}
						<div>
							<Textarea
								placeholder="What's on your mind? Share your work, ideas, or ask for feedback..."
								className="min-h-37.5 resize-none bg-gray-800/50 border-gray-700 focus-visible:ring-purple-500 focus-visible:border-purple-500 text-base text-white placeholder-gray-400"
								value={content}
								onChange={(e) => setContent(e.target.value)}
								disabled={isPosting}
								autoFocus
							/>
							<div className="flex justify-end mt-1">
								<span className={`text-xs ${content.length > 500 ? 'text-red-400' : 'text-gray-500'}`}>
									{content.length} / 500
								</span>
							</div>
						</div>

						{/* File Upload Section */}
						<AnimatePresence>
							{(showFileUpload || fileUrl) && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.2 }}
									className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 overflow-hidden"
								>
									{fileType === "pdf" && fileUrl ? (
										<div className="space-y-2">
											<div className="flex items-center justify-between mb-2">
												<div className="text-sm text-gray-400">PDF Preview:</div>
												<button
													onClick={() => {
														setFileUrl("");
														setFileType("");
														setFileName("");
														setFileExtension("");
														setShowFileUpload(false);
													}}
													className="text-gray-400 hover:text-red-400 transition-colors"
												>
													<X className="w-4 h-4" />
												</button>
											</div>
											<DynamicPDFSlider fileUrl={fileUrl} className="max-h-96" />
										</div>
									) : fileType === "code" && fileUrl ? (
										<div className="space-y-2">
											<div className="flex items-center justify-between mb-2">
												<div className="text-sm text-gray-400">Code Preview:</div>
												<button
													onClick={() => {
														setFileUrl("");
														setFileType("");
														setFileName("");
														setFileExtension("");
														setShowFileUpload(false);
													}}
													className="text-gray-400 hover:text-red-400 transition-colors"
												>
													<X className="w-4 h-4" />
												</button>
											</div>
											<CodeBlock
												fileUrl={fileUrl}
												fileName={fileName}
												fileExtension={fileExtension}
											/>
										</div>
									) : (
										<div>
											<div className="flex items-center justify-between mb-2">
												<div className="text-sm text-gray-400">Attach a file:</div>
												{fileUrl && (
													<button
														onClick={() => {
															setFileUrl("");
															setFileType("");
															setFileName("");
															setFileExtension("");
															setShowFileUpload(false);
														}}
														className="text-gray-400 hover:text-red-400 transition-colors"
													>
														<X className="w-4 h-4" />
													</button>
												)}
											</div>
											<ImageUpload
												endpoint="postMedia"
												value={fileUrl}
												onChange={(url, type, name, extension, category) => {
													setFileUrl(url);
													setFileName(name || "");
													setFileExtension(extension || "");

													if (category === "code") {
														setFileType("code");
													} else if (type?.startsWith('application/pdf')) {
														setFileType("pdf");
													} else {
														setFileType("image");
													}

													if (!url) setShowFileUpload(false);
												}}
											/>
										</div>
									)}
								</motion.div>
							)}
						</AnimatePresence>

						{/* Attach File Button */}
						{!showFileUpload && !fileUrl && (
							<Button
								type="button"
								variant="outline"
								className="w-full border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white hover:border-purple-500 transition-all"
								onClick={() => setShowFileUpload(true)}
								disabled={isPosting}
							>
								<ImageIcon className="w-4 h-4 mr-2" />
								Attach File (Image, PDF, or Code)
							</Button>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50">
					<div className="flex items-center justify-between">
						<div className="text-sm text-gray-400">
							{fileUrl && (
								<span className="flex items-center space-x-1">
									<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
									<span>File attached</span>
								</span>
							)}
						</div>
						<div className="flex items-center space-x-3">
							<Button
								variant="ghost"
								className="text-gray-400 hover:text-white hover:bg-gray-800"
								onClick={handleClose}
								disabled={isPosting}
							>
								Cancel
							</Button>
							<Button
								className="bg-purple-600 hover:bg-purple-700 text-white px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
								onClick={handleSubmit}
								disabled={(!content.trim() && !fileUrl) || isPosting || content.length > 500}
							>
								{isPosting ? (
									<div className="flex items-center space-x-2">
										<Loader2Icon className="w-4 h-4 animate-spin" />
										<span>Posting...</span>
									</div>
								) : (
									<div className="flex items-center space-x-2">
										<Send className="w-4 h-4" />
										<span>Post</span>
									</div>
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
