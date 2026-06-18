import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsExportService {
  async exportToPDF(title: string, headers: string[], rows: string[][]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown(1.5);

      const colWidth = (doc.page.width - 60) / headers.length;
      let top = doc.y;

      doc.fontSize(9).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, 30 + i * colWidth, top, { width: colWidth, align: 'left' });
      });
      top += 18;
      doc.font('Helvetica').fontSize(8);

      for (const row of rows) {
        if (top > doc.page.height - 40) {
          doc.addPage();
          top = 30;
          doc.font('Helvetica-Bold').fontSize(9);
          headers.forEach((h, i) => {
            doc.text(h, 30 + i * colWidth, top, { width: colWidth, align: 'left' });
          });
          top += 18;
          doc.font('Helvetica').fontSize(8);
        }
        row.forEach((cell, i) => {
          doc.text(cell, 30 + i * colWidth, top, { width: colWidth, align: 'left' });
        });
        top += 14;
      }

      doc.end();
    });
  }

  async exportToExcel(worksheetName: string, headers: string[], rows: any[][]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(worksheetName);

    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' },
    };

    rows.forEach((row) => sheet.addRow(row));

    sheet.columns.forEach((col) => {
      if (col.eachCell) {
        let maxLength = 10;
        col.eachCell?.((cell: any) => {
          const val = cell.value ? String(cell.value).length : 0;
          if (val > maxLength) maxLength = val;
        });
        col.width = Math.min(maxLength + 3, 50);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  exportToCSV(headers: string[], rows: string[][]): string {
    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(',')];
    for (const row of rows) {
      lines.push(row.map(escape).join(','));
    }
    return lines.join('\n');
  }
}
