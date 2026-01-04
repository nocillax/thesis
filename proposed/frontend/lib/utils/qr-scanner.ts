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

    // Try multiple scales to improve detection on different systems (especially macOS Retina displays)
    const scales = [4.0, 3.0, 2.5, 2.0, 1.5, 1.0];

    console.log("[QR Scanner] Starting PDF scan with multiple scales...");

    for (const scale of scales) {
      console.log(`[QR Scanner] Trying scale: ${scale}`);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        throw new Error("Could not get canvas context");
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      console.log(`[QR Scanner] Canvas size: ${canvas.width}x${canvas.height}`);

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Try with multiple inversion attempts for better cross-platform compatibility
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (qrCode && qrCode.data) {
        console.log(
          `[QR Scanner] ✓ QR code found at scale ${scale}:`,
          qrCode.data
        );
        return qrCode.data;
      }
      console.log(`[QR Scanner] ✗ No QR code found at scale ${scale}`);
    }

    console.error(
      "[QR Scanner] Failed to find QR code after trying all scales"
    );
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
          const context = canvas.getContext("2d", { willReadFrequently: true });

          if (!context) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          console.log(
            `[QR Scanner] Image size: ${canvas.width}x${canvas.height}`
          );

          context.drawImage(img, 0, 0);

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          // Try with multiple inversion attempts for better cross-platform compatibility
          const qrCode = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            {
              inversionAttempts: "attemptBoth",
            }
          );

          if (qrCode && qrCode.data) {
            console.log("[QR Scanner] ✓ QR code found in image:", qrCode.data);
            resolve(qrCode.data);
          } else {
            console.warn("[QR Scanner] ✗ No QR code found in image");
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
