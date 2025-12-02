// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// import * as fs from 'fs';
// import * as path from 'path';

// async function createCertificateTemplate() {
//   // Create a new PDF document in landscape A4 (297mm x 210mm)
//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape in points

//   const { width, height } = page.getSize();

//   // Load fonts
//   const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
//   const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
//   const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//   const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

//   // Draw borders
//   page.drawRectangle({
//     x: 30,
//     y: 30,
//     width: width - 60,
//     height: height - 60,
//     borderColor: rgb(0.2, 0.2, 0.6),
//     borderWidth: 8,
//   });

//   page.drawRectangle({
//     x: 40,
//     y: 40,
//     width: width - 80,
//     height: height - 80,
//     borderColor: rgb(0.3, 0.3, 0.7),
//     borderWidth: 4,
//   });

//   // Corner decorations
//   const cornerSize = 50;
//   // Top-left
//   page.drawLine({
//     start: { x: 60, y: height - 60 },
//     end: { x: 60 + cornerSize, y: height - 60 },
//     thickness: 3,
//     color: rgb(0.2, 0.2, 0.6),
//   });
//   page.drawLine({
//     start: { x: 60, y: height - 60 },
//     end: { x: 60, y: height - 60 - cornerSize },
//     thickness: 3,
//     color: rgb(0.2, 0.2, 0.6),
//   });

//   // Top-right
//   page.drawLine({
//     start: { x: width - 60, y: height - 60 },
//     end: { x: width - 60 - cornerSize, y: height - 60 },
//     thickness: 3,
//     color: rgb(0.2, 0.2, 0.6),
//   });
//   page.drawLine({
//     start: { x: width - 60, y: height - 60 },
//     end: { x: width - 60, y: height - 60 - cornerSize },
//     thickness: 3,
//     color: rgb(0.2, 0.2, 0.6),
//   });

//   // Bottom-left
//   page.drawLine({
//     start: { x: 60, y: 60 },
//     end: { x: 60 + cornerSize, y: 60 },
//     thickness: 3,
//     color: rgb(0.2, 0.2, 0.6),
//   });
//   page.drawLine({
//     start: { x: 60, y: 60 },
//     end: { x: 60, y: 60 + cornerSize },
//     thickness: 3,
//     color: rgb(0.2, 0.2, 0.6),
//   });

//   // Bottom-right
//   page.drawLine({
//     start: { x: width - 60, y: 60 },
//     end: { x: width - 60 - cornerSize, y: 60 },
//     thickness: 3,
//     color: rgb(0.2, 0.2, 0.6),
//   });
//   page.drawLine({
//     start: { x: width - 60, y: 60 },
//     end: { x: width - 60, y: 60 + cornerSize },
//     thickness: 3,
//     color: rgb(0.2, 0.2, 0.6),
//   });

//   // Title
//   page.drawText('CERTIFICATE OF ACHIEVEMENT', {
//     x: width / 2 - 250,
//     y: height - 120,
//     size: 36,
//     font: timesRomanBold,
//     color: rgb(0.2, 0.2, 0.6),
//   });

//   // Subtitle
//   page.drawText('This is to certify that', {
//     x: width / 2 - 100,
//     y: height - 170,
//     size: 16,
//     font: timesRoman,
//     color: rgb(0.4, 0.4, 0.4),
//   });

//   // Underline for name (where student name will go)
//   page.drawLine({
//     start: { x: width / 2 - 250, y: height - 240 },
//     end: { x: width / 2 + 250, y: height - 240 },
//     thickness: 3,
//     color: rgb(0.3, 0.3, 0.7),
//   });

//   // Achievement text
//   page.drawText('has successfully completed the requirements for', {
//     x: width / 2 - 200,
//     y: height - 280,
//     size: 16,
//     font: helvetica,
//     color: rgb(0, 0, 0),
//   });

//   // Details section labels (Student ID, CGPA, Date)
//   const detailsY = height - 430;

//   // Student ID label
//   page.drawText('STUDENT ID', {
//     x: 150,
//     y: detailsY,
//     size: 10,
//     font: helvetica,
//     color: rgb(0.5, 0.5, 0.5),
//   });

//   // CGPA label
//   page.drawText('CGPA', {
//     x: width / 2 - 30,
//     y: detailsY,
//     size: 10,
//     font: helvetica,
//     color: rgb(0.5, 0.5, 0.5),
//   });

//   // Date Issued label
//   page.drawText('DATE ISSUED', {
//     x: width - 250,
//     y: detailsY,
//     size: 10,
//     font: helvetica,
//     color: rgb(0.5, 0.5, 0.5),
//   });

//   // Footer section
//   const footerY = 140;

//   // Issuing authority
//   page.drawLine({
//     start: { x: 100, y: footerY },
//     end: { x: 280, y: footerY },
//     thickness: 2,
//     color: rgb(0, 0, 0),
//   });
//   page.drawText('Issuing Authority', {
//     x: 100,
//     y: footerY - 45,
//     size: 10,
//     font: helvetica,
//     color: rgb(0.5, 0.5, 0.5),
//   });

//   // Official seal placeholder
//   page.drawCircle({
//     x: width / 2,
//     y: footerY - 20,
//     size: 50,
//     borderColor: rgb(0.7, 0.7, 0.7),
//     borderWidth: 2,
//   });
//   page.drawText('Official Seal', {
//     x: width / 2 - 35,
//     y: footerY - 25,
//     size: 8,
//     font: helvetica,
//     color: rgb(0.5, 0.5, 0.5),
//   });

//   // Authorized signature
//   page.drawLine({
//     start: { x: width - 280, y: footerY },
//     end: { x: width - 100, y: footerY },
//     thickness: 2,
//     color: rgb(0, 0, 0),
//   });
//   page.drawText('Authorized Signature', {
//     x: width - 280,
//     y: footerY - 25,
//     size: 14,
//     font: helveticaBold,
//     color: rgb(0, 0, 0),
//   });
//   page.drawText('Certificate Issuer', {
//     x: width - 280,
//     y: footerY - 45,
//     size: 10,
//     font: helvetica,
//     color: rgb(0.5, 0.5, 0.5),
//   });

//   // Save the PDF
//   const pdfBytes = await pdfDoc.save();
//   const outputPath = path.join(
//     __dirname,
//     '../public/templates/certificate-template.pdf',
//   );

//   fs.writeFileSync(outputPath, pdfBytes);
//   console.log(`✅ Certificate template created at: ${outputPath}`);
//   console.log('\nTemplate is now blank and ready for dynamic data injection.');
//   console.log('The pdf.service.ts will draw certificate data at runtime.');
// }

// createCertificateTemplate().catch(console.error);
