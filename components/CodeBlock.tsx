"use client";

import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from "lucide-react";
import {
	SiJavascript,
	SiTypescript,
	SiPython,
	SiHtml5,
	SiCss3,
	SiReact,
	SiJson,
	SiPhp,
	SiCplusplus,
	SiRust,
	SiGo,
	SiSwift,
	SiKotlin,
	SiRuby,
	SiSharp,
	SiDart,
	SiScala,
	SiR
} from 'react-icons/si';
import { VscFile, VscCode } from 'react-icons/vsc';
import { cn } from "@/lib/utils";

// Function to get file icon based on language or file extension
const getFileIcon = (language: string, filename?: string) => {
	const iconProps = { size: 16, className: "text-current" };

	// Check file extension first if filename is provided
	if (filename) {
		const ext = filename.split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'js': return <SiJavascript {...iconProps} className="text-yellow-400" />;
			case 'ts': return <SiTypescript {...iconProps} className="text-blue-400" />;
			case 'tsx': case 'jsx': return <SiReact {...iconProps} className="text-cyan-400" />;
			case 'py': return <SiPython {...iconProps} className="text-blue-300" />;
			case 'java': return <VscCode {...iconProps} className="text-red-500" />;
			case 'html': return <SiHtml5 {...iconProps} className="text-orange-400" />;
			case 'css': return <SiCss3 {...iconProps} className="text-blue-500" />;
			case 'json': return <SiJson {...iconProps} className="text-yellow-300" />;
			case 'php': return <SiPhp {...iconProps} className="text-purple-400" />;
			case 'cpp': case 'c': return <SiCplusplus {...iconProps} className="text-blue-600" />;
			case 'cs': return <SiSharp {...iconProps} className="text-purple-600" />;
			case 'rs': return <SiRust {...iconProps} className="text-orange-600" />;
			case 'go': return <SiGo {...iconProps} className="text-cyan-300" />;
			case 'swift': return <SiSwift {...iconProps} className="text-orange-500" />;
			case 'kt': return <SiKotlin {...iconProps} className="text-purple-500" />;
			case 'rb': return <SiRuby {...iconProps} className="text-red-400" />;
			case 'dart': return <SiDart {...iconProps} className="text-blue-400" />;
			case 'scala': return <SiScala {...iconProps} className="text-red-600" />;
			case 'r': return <SiR {...iconProps} className="text-blue-700" />;
			case 'xml': return <VscCode {...iconProps} className="text-orange-300" />;
			case 'sql': return <VscCode {...iconProps} className="text-blue-400" />;
			case 'sh': case 'bat': return <VscCode {...iconProps} className="text-green-400" />;
		}
	}

	// Fallback to language-based icons
	switch (language.toLowerCase()) {
		case 'javascript': case 'js': return <SiJavascript {...iconProps} className="text-yellow-400" />;
		case 'typescript': case 'ts': return <SiTypescript {...iconProps} className="text-blue-400" />;
		case 'jsx': case 'tsx': case 'react': return <SiReact {...iconProps} className="text-cyan-400" />;
		case 'python': case 'py': return <SiPython {...iconProps} className="text-blue-300" />;
		case 'java': return <VscCode {...iconProps} className="text-red-500" />;
		case 'html': return <SiHtml5 {...iconProps} className="text-orange-400" />;
		case 'css': return <SiCss3 {...iconProps} className="text-blue-500" />;
		case 'json': return <SiJson {...iconProps} className="text-yellow-300" />;
		case 'php': return <SiPhp {...iconProps} className="text-purple-400" />;
		case 'cpp': case 'c++': case 'c': return <SiCplusplus {...iconProps} className="text-blue-600" />;
		case 'csharp': case 'cs': case 'c#': return <SiSharp {...iconProps} className="text-purple-600" />;
		case 'rust': case 'rs': return <SiRust {...iconProps} className="text-orange-600" />;
		case 'go': case 'golang': return <SiGo {...iconProps} className="text-cyan-300" />;
		case 'swift': return <SiSwift {...iconProps} className="text-orange-500" />;
		case 'kotlin': case 'kt': return <SiKotlin {...iconProps} className="text-purple-500" />;
		case 'ruby': case 'rb': return <SiRuby {...iconProps} className="text-red-400" />;
		case 'dart': return <SiDart {...iconProps} className="text-blue-400" />;
		case 'scala': return <SiScala {...iconProps} className="text-red-600" />;
		case 'r': return <SiR {...iconProps} className="text-blue-700" />;
		case 'xml': return <VscCode {...iconProps} className="text-orange-300" />;
		case 'sql': return <VscCode {...iconProps} className="text-blue-400" />;
		case 'shell': case 'bash': case 'sh': case 'bat': return <VscCode {...iconProps} className="text-green-400" />;
		default: return <VscFile {...iconProps} className="text-gray-400" />;
	}
};

interface CodeBlockProps {
	fileUrl: string;
	fileName?: string;
	fileExtension?: string;
	theme?: 'dark' | 'light';
	showLineNumbers?: boolean;
	maxLines?: number;
	className?: string;
}

// Language mapping for syntax highlighting
const getLanguageFromExtension = (extension: string): string => {
	const languageMap: { [key: string]: string } = {
		'js': 'javascript',
		'jsx': 'jsx',
		'ts': 'typescript',
		'tsx': 'tsx',
		'py': 'python',
		'java': 'java',
		'cpp': 'cpp',
		'c': 'c',
		'cs': 'csharp',
		'html': 'html',
		'css': 'css',
		'json': 'json',
		'php': 'php',
		'go': 'go',
		'rs': 'rust',
		'kt': 'kotlin',
		'swift': 'swift',
		'rb': 'ruby',
		'dart': 'dart',
		'scala': 'scala',
		'r': 'r',
		'xml': 'xml',
		'sql': 'sql',
		'sh': 'bash',
		'bat': 'batch',
	};
	return languageMap[extension.toLowerCase()] || 'text';
};

function CodeBlock({
	fileUrl,
	fileName,
	fileExtension,
	theme = 'dark',
	showLineNumbers = true,
	maxLines = 25,
	className
}: CodeBlockProps) {
	const [code, setCode] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const [copied, setCopied] = useState(false);

	// Extract filename and extension from URL if not provided
	const getFileInfoFromUrl = (url: string) => {
		try {
			const urlParams = new URLSearchParams(url.split('?')[1]);
			const urlFileName = urlParams.get('x-ut-file-name') || 'code';
			const fileExt = urlFileName.split('.').pop() || 'txt';
			return { name: urlFileName, extension: fileExt };
		} catch (error) {
			return { name: 'code', extension: 'txt' };
		}
	};

	const fileInfo = getFileInfoFromUrl(fileUrl);
	const displayFileName = fileName || fileInfo.name;
	const displayExtension = fileExtension || fileInfo.extension;
	const language = getLanguageFromExtension(displayExtension);

	useEffect(() => {
		const fetchCode = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(fileUrl);
				const content = await response.text();
				setCode(content);
			} catch (error) {
				console.error("Error fetching code:", error);
				setCode("Error loading code content");
			} finally {
				setIsLoading(false);
			}
		};

		if (fileUrl) {
			fetchCode();
		}
	}, [fileUrl]);

	const copyToClipboard = async () => {
		try {
			// First try modern clipboard API
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(code);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} else {
				// Fallback method for older browsers or non-secure contexts
				const textArea = document.createElement('textarea');
				textArea.value = code;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();

				try {
					document.execCommand('copy');
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				} catch (fallbackError) {
					console.error("Fallback copy failed:", fallbackError);
					// You could show a toast notification here
				} finally {
					document.body.removeChild(textArea);
				}
			}
		} catch (error) {
			console.error("Failed to copy code:", error);
			// You could show a toast notification here
		}
	};

	if (isLoading) {
		return (
			<div className={cn(
				"rounded-lg border p-6",
				theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
			)}>
				<div className="flex items-center gap-3 mb-4">
					<div className={cn(
						"w-4 h-4 rounded animate-spin border-2",
						theme === 'dark' ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-600'
					)}></div>
					<span className={cn(
						"text-sm",
						theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
					)}>
						Loading code...
					</span>
				</div>
			</div>
		);
	}

	const codeLines = code.split('\n');
	const shouldScroll = codeLines.length > maxLines;
	const lineHeight = 21;
	const maxHeight = maxLines * lineHeight;

	return (
		<div className={cn(
			"group relative rounded-lg border overflow-hidden",
			theme === 'dark'
				? 'bg-gray-900 border-gray-700'
				: 'bg-white border-gray-200',
			className
		)}>
			{/* Header with filename and copy button */}
			<div className={cn(
				"flex items-center justify-between px-4 py-3 border-b",
				theme === 'dark'
					? 'bg-gray-800 border-gray-700 text-gray-200'
					: 'bg-gray-50 border-gray-200 text-gray-700'
			)}>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						{getFileIcon(language, displayFileName)}
						<span className="text-sm font-medium">{displayFileName}</span>
					</div>
				</div>

				<button
					onClick={copyToClipboard}
					className={cn(
						"flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
						theme === 'dark'
							? 'hover:bg-gray-700 text-gray-300 hover:text-white'
							: 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
					)}
					aria-label="Copy code"
				>
					{copied ? (
						<>
							<Check size={14} />
							Copied!
						</>
					) : (
						<>
							<Copy size={14} />
							Copy
						</>
					)}
				</button>
			</div>

			{/* Code content */}
			<div
				className={cn(
					"relative overflow-auto",
					theme === 'dark' && "code-scrollbar",
					theme === 'light' && "code-scrollbar-light"
				)}
				style={{
					maxHeight: shouldScroll ? `${maxHeight}px` : 'none'
				}}
			>
				<SyntaxHighlighter
					language={language}
					style={oneDark}
					showLineNumbers={showLineNumbers}
					customStyle={{
						margin: 0,
						background: 'transparent',
						fontSize: '14px',
						lineHeight: '1.5',
						padding: '16px',
						width: 'max-content',
						minWidth: '100%'
					}}
					codeTagProps={{
						style: {
							fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
						}
					}}
				>
					{code}
				</SyntaxHighlighter>
			</div>
		</div>
	);
}

export default CodeBlock;