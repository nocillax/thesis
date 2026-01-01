import jsQR from "jsqr";

/**
 * Extract QR code from a PDF file
 * @param file - PDF file to scan
 * @returns Certificate hash from QR code or null
 */
export async function extractQRFromPDF(file: File): Promise<string | null> {
  try {
    // Dynamically import pdfjs-dist only on client-side to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source for PDF.js - use local file from public folder
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Scan first page only (certificate should be single page)
    const page = await pdf.getPage(1);

    // Render page to canvas
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better QR detection
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    // Get image data from canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (qrCode && qrCode.data) {
      return qrCode.data;
    }

    return null;
  } catch (error) {
    console.error("Error extracting QR from PDF:", error);
    return null;
  }
}

/**
 * Extract QR code from an image file
 * @param file - Image file to scan
 * @returns Certificate hash from QR code or null
 */
export async function extractQRFromImage(file: File): Promise<string | null> {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          context.drawImage(img, 0, 0);

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          const qrCode = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            {
              inversionAttempts: "dontInvert",
            }
          );

          if (qrCode && qrCode.data) {
            resolve(qrCode.data);
          } else {
            resolve(null);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Error extracting QR from image:", error);
    return null;
  }
}

/**
 * Detect file type and extract QR code accordingly
 * @param file - PDF or image file
 * @returns Certificate hash from QR code or null
 */
export async function extractQRFromFile(file: File): Promise<string | null> {
  const fileType = file.type.toLowerCase();

  if (fileType === "application/pdf") {
    return extractQRFromPDF(file);
  } else if (fileType.startsWith("image/")) {
    return extractQRFromImage(file);
  } else {
    throw new Error(
      "Unsupported file type. Please upload a PDF or image file."
    );
  }
}
