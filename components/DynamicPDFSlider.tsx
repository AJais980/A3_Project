'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import PDFSlider to avoid SSR issues
const PDFSlider = dynamic(() => import('./PDFSlider'), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
				<p className="text-gray-600">Loading PDF Slider...</p>
			</div>
		</div>
	),
});

interface DynamicPDFSliderProps {
	fileUrl: string;
	className?: string;
}

const DynamicPDFSlider: React.FC<DynamicPDFSliderProps> = (props) => {
	return <PDFSlider {...props} />;
};

export default DynamicPDFSlider;
