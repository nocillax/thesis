import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

interface Certificate {
  student_id: string;
  student_name: string;
  degree: string;
  program: string;
  cgpa: number;
  issuance_date: number | string;
  issuing_authority: string;
  is_revoked: boolean;
}

@Injectable()
export class PdfService {
  private templatePath = path.join(
    process.cwd(),
    'public/templates/certificate-template.html',
  );
  private browser: any = null;

  async generateCertificatePng(certificate: Certificate): Promise<Buffer> {
    // Read the HTML template
    let htmlContent = fs.readFileSync(this.templatePath, 'utf-8');

    // Format the date
    const dateIssued = new Date(certificate.issuance_date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    );

    // Replace placeholders with actual data (CGPA is already formatted by backend)
    htmlContent = htmlContent
      .replace(/\{\{STUDENT_NAME\}\}/g, certificate.student_name)
      .replace(/\{\{STUDENT_ID\}\}/g, certificate.student_id)
      .replace(/\{\{DEGREE\}\}/g, certificate.degree)
      .replace(/\{\{PROGRAM\}\}/g, certificate.program)
      .replace(/\{\{CGPA\}\}/g, certificate.cgpa.toString())
      .replace(/\{\{DATE_ISSUED\}\}/g, dateIssued)
      .replace(/\{\{ISSUING_AUTHORITY\}\}/g, certificate.issuing_authority);

    // Add REVOKED watermark if needed
    const watermarkHtml = certificate.is_revoked
      ? '<div class="watermark">REVOKED</div>'
      : '';
    htmlContent = htmlContent.replace(
      /\{\{REVOKED_WATERMARK\}\}/g,
      watermarkHtml,
    );

    // Launch fresh browser (no caching during development)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1122, height: 794, deviceScaleFactor: 2 }); // A4 landscape at 96 DPI * 2 for retina
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Take screenshot as PNG with transparent background
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      omitBackground: true,
      captureBeyondViewport: false,
    });

    await page.close();
    await browser.close();

    return Buffer.from(screenshotBuffer);
  }

  async generateCertificatePdf(certificate: Certificate): Promise<Buffer> {
    // Read the HTML template
    let htmlContent = fs.readFileSync(this.templatePath, 'utf-8');

    // Format the date
    const dateIssued = new Date(certificate.issuance_date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    );

    // Replace placeholders with actual data (CGPA is already formatted by backend)
    htmlContent = htmlContent
      .replace(/\{\{STUDENT_NAME\}\}/g, certificate.student_name)
      .replace(/\{\{STUDENT_ID\}\}/g, certificate.student_id)
      .replace(/\{\{DEGREE\}\}/g, certificate.degree)
      .replace(/\{\{PROGRAM\}\}/g, certificate.program)
      .replace(/\{\{CGPA\}\}/g, certificate.cgpa.toString())
      .replace(/\{\{DATE_ISSUED\}\}/g, dateIssued)
      .replace(/\{\{ISSUING_AUTHORITY\}\}/g, certificate.issuing_authority);

    // Add REVOKED watermark if needed
    const watermarkHtml = certificate.is_revoked
      ? '<div class="watermark">REVOKED</div>'
      : '';
    htmlContent = htmlContent.replace(
      /\{\{REVOKED_WATERMARK\}\}/g,
      watermarkHtml,
    );

    // Launch browser (reuse if already running)
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await this.browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await page.close();

    return Buffer.from(pdfBuffer);
  }

  async onModuleDestroy() {
    // Close browser when service is destroyed
    if (this.browser) {
      await this.browser.close();
    }
  }
}
