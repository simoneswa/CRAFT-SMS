import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDFFromElement = async (
  elementId: string, 
  filename: string,
  onProgress?: (status: string) => void
): Promise<void> => {
  try {
    if (onProgress) onProgress('Preparing document...');
    
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    // Briefly make the hidden template visible but absolutely positioned off-screen 
    // so html2canvas can read it properly, if it's hidden by CSS.
    // Assuming the element uses a specific class we toggle, or we just render it off-screen natively.
    
    if (onProgress) onProgress('Rendering image...');
    
    // --- PDF STRESS TEST SAFEGUARDS ---
    // 1. Cap scale to 2 max regardless of devicePixelRatio (prevents OOM on high-DPI screens)
    // 2. useCORS=true allows cross-origin school logo images
    // 3. onclone lets us strip any @font-face issues from the hidden clone
    // 4. imageTimeout: 5000 prevents hangs on slow/large logo fetches
    const canvas = await html2canvas(element, {
      scale: Math.min(2, window.devicePixelRatio || 2),
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 5000, // Don't hang forever on high-res logos
      onclone: (clonedDoc) => {
        // Ensure the cloned element is fully visible for rendering
        const clonedEl = clonedDoc.getElementById(elementId)
        if (clonedEl) {
          clonedEl.style.position = 'static'
          clonedEl.style.visibility = 'visible'
        }
      }
    }).catch((canvasErr) => {
      console.error('[pdfGenerator] html2canvas error:', canvasErr)
      throw new Error('Failed to render receipt image. The school logo may be too large or inaccessible.')
    });

    if (onProgress) onProgress('Generating PDF...');

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // A4 size in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
    
    if (onProgress) onProgress('Done');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
