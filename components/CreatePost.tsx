"use client";

import { useState } from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/lib/useAuth";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { Button } from "./ui/button";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import DynamicPDFSlider from "./DynamicPDFSlider";
import CodeBlock from "./CodeBlock";

type Props = {
	onPostCreated?: (newPost: any) => void;
};

function CreatePost({ onPostCreated }: Props) {
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

				// Clear the form
				setContent("");
				setFileUrl("");
				setFileType("");
				setFileName("");
				setFileExtension("");
				setShowFileUpload(false);
				toast.success("Post created successfully");
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

	return (
		<div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 overflow-hidden max-w-2xl mx-auto">
			<div className="p-6">
				<div className="space-y-4">
					<div className="flex space-x-4">
						<Avatar className="w-10 h-10 ring-2 ring-gray-700">
							<AvatarImage src={user?.photoURL || "./avatar.png"} />
						</Avatar>
						<Textarea
							placeholder="What's on your mind?"
							className="min-h-25 resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-base text-white placeholder-gray-400"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							disabled={isPosting}
						/>
					</div>

					{(showFileUpload || fileUrl) && (
						<div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
							{fileType === "pdf" && fileUrl ? (
								<div className="space-y-2">
									<div className="text-sm text-gray-400 mb-2">PDF Preview:</div>
									<DynamicPDFSlider fileUrl={fileUrl} className="max-h-96" />
								</div>
							) : fileType === "code" && fileUrl ? (
								<div className="space-y-2">
									<div className="text-sm text-gray-400 mb-2">Code Preview:</div>
									<CodeBlock
										fileUrl={fileUrl}
										fileName={fileName}
										fileExtension={fileExtension}
									/>
								</div>
							) : (
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
							)}
						</div>
					)}

					<div className="flex items-center justify-between border-t border-gray-800 pt-4">
						<div className="flex space-x-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
								onClick={() => setShowFileUpload(!showFileUpload)}
								disabled={isPosting}
							>
								<ImageIcon className="w-4 h-4 mr-2" />
								Attach File
							</Button>
						</div>
						<Button
							className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
							onClick={handleSubmit}
							disabled={(!content.trim() && !fileUrl) || isPosting}
						>
							{isPosting ? (
								<div className="flex items-center space-x-2">
									<Loader2Icon className="w-4 h-4 animate-spin" />
									<span>Posting...</span>
								</div>
							) : (
								<div className="flex items-center space-x-2">
									<SendIcon className="w-4 h-4" />
									<span>Post</span>
								</div>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
export default CreatePost;
