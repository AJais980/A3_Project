'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
	// Use local worker file from public folder for reliability
	pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFSliderProps {
	fileUrl: string;
	className?: string;
}

interface PageImage {
	pageNumber: number;
	imageUrl: string;
	width: number;
	height: number;
}

const PDFSlider: React.FC<PDFSliderProps> = ({ fileUrl, className = '' }) => {
	const [pageImages, setPageImages] = useState<PageImage[]>([]);
	const [totalPages, setTotalPages] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [loadingProgress, setLoadingProgress] = useState(0);
	const swiperRef = useRef<any>(null);

	// Helper function to determine if URL is external
	const isExternalUrl = (url: string): boolean => {
		return url.startsWith('http://') || url.startsWith('https://');
	};

	// Helper function to get the PDF URL (proxy for external URLs)
	const getPdfUrl = (url: string): string => {
		if (isExternalUrl(url)) {
			return `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
		}
		return url; // Local URL
	};

	useEffect(() => {
		loadPdfAsImages();
	}, [fileUrl]);

	const loadPdfAsImages = async () => {
		try {
			setIsLoading(true);
			setError('');
			setLoadingProgress(0);

			// Get the appropriate URL (proxy for external URLs)
			const pdfUrl = getPdfUrl(fileUrl);

			// Fetch the PDF as array buffer for better compatibility
			let pdfData: ArrayBuffer;

			try {
				const response = await fetch(pdfUrl);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				pdfData = await response.arrayBuffer();
			} catch (fetchError) {
				console.error('Error fetching PDF:', fetchError);
				throw new Error('Failed to fetch PDF data');
			}

			// Load the PDF document using data instead of URL
			const loadingTask = pdfjsLib.getDocument({
				data: pdfData,
				// Disable streaming for better compatibility
				disableStream: true,
				disableAutoFetch: true,
			});

			// Load the PDF document
			const pdf = await loadingTask.promise;
			setTotalPages(pdf.numPages);

			const images: PageImage[] = [];

			// Convert each page to an image
			for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
				const page = await pdf.getPage(pageNum);

				// Set up the canvas with high DPI for crisp images
				const scale = 2.0; // Higher scale for better quality
				const viewport = page.getViewport({ scale });

				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d');

				canvas.height = viewport.height;
				canvas.width = viewport.width;

				// Render the page to canvas
				const renderContext = {
					canvasContext: context!,
					viewport: viewport,
					canvas: canvas,
				};

				await page.render(renderContext).promise;

				// Convert canvas to blob URL
				const imageUrl = canvas.toDataURL('image/jpeg', 0.9);

				images.push({
					pageNumber: pageNum,
					imageUrl,
					width: viewport.width,
					height: viewport.height,
				});

				// Update loading progress
				setLoadingProgress(Math.round((pageNum / pdf.numPages) * 100));
			}

			setPageImages(images);
			setIsLoading(false);
		} catch (err) {
			console.error('Error loading PDF:', err);

			// More specific error messages
			let errorMessage = 'Failed to load PDF. Please try again.';

			if (err instanceof Error) {
				if (err.message.includes('CORS')) {
					errorMessage = 'PDF could not be loaded due to CORS restrictions.';
				} else if (err.message.includes('Network')) {
					errorMessage = 'Network error while loading PDF. Please check your connection.';
				} else if (err.message.includes('InvalidPDFException')) {
					errorMessage = 'The file is not a valid PDF document.';
				} else if (err.message.includes('404')) {
					errorMessage = 'PDF file not found. Please check the URL.';
				}
			}

			if (isExternalUrl(fileUrl)) {
				errorMessage += ' External PDFs may have CORS restrictions.';
			}

			setError(errorMessage);
			setIsLoading(false);
		}
	}; if (error) {
		return (
			<div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
				<div className="text-center">
					<div className="text-red-500 text-4xl mb-4">📄</div>
					<h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to load PDF</h3>
					<p className="text-gray-600">{error}</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
					<p className="text-gray-600 text-sm mb-2">Loading PDF...</p>
					<div className="w-32 bg-gray-200 rounded-full h-1">
						<div
							className="bg-blue-600 h-1 rounded-full transition-all duration-300"
							style={{ width: `${loadingProgress}%` }}
						></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
			{/* Compact Header - Just page indicator */}
			<div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
				<div className="flex items-center space-x-2">
					<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<span className="text-sm text-gray-600">{currentPage} of {totalPages}</span>
				</div>
			</div>

			{/* Compact PDF Slider */}
			<div className="relative bg-white">
				<Swiper
					ref={swiperRef}
					modules={[Navigation, Pagination, Zoom]}
					spaceBetween={0}
					slidesPerView={1}
					navigation={{
						nextEl: '.swiper-button-next-custom',
						prevEl: '.swiper-button-prev-custom',
					}}
					pagination={{
						clickable: true,
						bulletClass: 'swiper-pagination-bullet-custom',
						bulletActiveClass: 'swiper-pagination-bullet-active-custom',
					}}
					zoom={{
						maxRatio: 2,
						minRatio: 1,
					}}
					onSlideChange={(swiper) => setCurrentPage(swiper.activeIndex + 1)}
					className="pdf-swiper-compact"
					style={{ height: '400px' }}
				>
					{pageImages.map((page) => (
						<SwiperSlide key={page.pageNumber} className="flex items-center justify-center p-2">
							<div className="swiper-zoom-container">
								<img
									src={page.imageUrl}
									alt={`Page ${page.pageNumber}`}
									className="max-w-full max-h-full object-contain rounded shadow-sm"
									style={{ maxHeight: '380px' }}
								/>
							</div>
						</SwiperSlide>
					))}
				</Swiper>

				{/* Navigation Buttons - Always rendered but conditionally visible */}
				<button
					className={`swiper-button-prev-custom absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 md:block hidden ${totalPages <= 1 || currentPage <= 1 ? 'md:hidden' : ''
						}`}
					aria-label="Previous page"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>

				<button
					className={`swiper-button-next-custom absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 md:block hidden ${totalPages <= 1 || currentPage >= totalPages ? 'md:hidden' : ''
						}`}
					aria-label="Next page"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>
		</div>
	);
};

export default PDFSlider;
