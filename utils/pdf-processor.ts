export async function convertPdfToImages(file: File): Promise<string[]> {
	try {
		// Dynamically import PDF.js legacy build for better compatibility
		const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
		
		// Configure PDF.js worker for browser environment
		if (typeof window !== 'undefined') {
			const workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
			pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
		}

		// Convert file to ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();

		// Load PDF document
		const loadingTask = pdfjsLib.getDocument({
			data: arrayBuffer,
		});
		const pdf = await loadingTask.promise;

		const images: string[] = [];

		// Process each page
		for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
			const page = await pdf.getPage(pageNum);

			// Set scale for higher quality (2x)
			const scale = 2.0;
			const viewport = page.getViewport({ scale });

			// Create canvas
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');

			if (!context) {
				throw new Error('Could not get canvas context');
			}

			canvas.height = viewport.height;
			canvas.width = viewport.width;

			// Render PDF page to canvas
			const renderContext = {
				canvasContext: context,
				viewport: viewport,
			};

			await page.render(renderContext).promise;

			// Convert canvas to image data URL
			const imageDataUrl = canvas.toDataURL('image/png');
			images.push(imageDataUrl);
		}

		return images;
	} catch (error) {
		console.error('Error converting PDF to images:', error);
		throw new Error('Failed to convert PDF to images');
	}
}

export function isPdfFile(file: File): boolean {
	return (
		file.type === "application/pdf" ||
		file.name.toLowerCase().endsWith(".pdf")
	);
}
