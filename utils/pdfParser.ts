import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs';

// Set worker source for the PDF.js library
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs';

/**
 * Parses a PDF file and extracts its text content.
 * @param file The PDF file to parse.
 * @param onProgress A callback to report parsing progress (0-100).
 * @returns A promise that resolves with the extracted text.
 */
export const parsePdfText = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';
    const numPages = pdf.numPages;
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // @ts-ignore
        text += content.items.map((item: any) => item.str).join(' ');
        text += '\n'; // Add newline after each page
        onProgress(Math.round((i / numPages) * 100));
    }
    return text;
};
