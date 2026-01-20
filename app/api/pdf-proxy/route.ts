import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const url = searchParams.get('url');

		if (!url) {
			return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
		}

		// Validate URL format
		try {
			new URL(url);
		} catch {
			return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
		}

		// Fetch the PDF from the external URL with timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'application/pdf,*/*',
			},
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Get content type - some servers don't set it correctly
		const contentType = response.headers.get('content-type');

		// Be more lenient with content type checking - some servers return wrong type
		// Only reject if it's clearly not a PDF (like HTML error pages)
		if (contentType && contentType.includes('text/html')) {
			return NextResponse.json({ error: 'URL does not point to a PDF file' }, { status: 400 });
		}

		// Get the PDF data
		const pdfBuffer = await response.arrayBuffer();

		// Basic PDF validation - check magic bytes
		const bytes = new Uint8Array(pdfBuffer.slice(0, 5));
		const header = String.fromCharCode(...bytes);
		if (!header.startsWith('%PDF-')) {
			return NextResponse.json({ error: 'URL does not point to a valid PDF file' }, { status: 400 });
		}

		// Return the PDF with proper headers
		return new NextResponse(pdfBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Length': pdfBuffer.byteLength.toString(),
				'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	} catch (error) {
		console.error('PDF Proxy Error:', error);

		let errorMessage = 'Failed to fetch PDF';
		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				errorMessage = 'Request timeout - PDF took too long to load';
			} else {
				errorMessage = error.message;
			}
		}

		return NextResponse.json(
			{ error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}