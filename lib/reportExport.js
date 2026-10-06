import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportReportToExcel({ title, subtitle, rows, columns, filename }) {
    const headerRow = columns.map(c => c.header);
    const dataRows  = rows.map(row => columns.map(c => row[c.key] ?? ''));

    const aoa = [];
    if (title) aoa.push([title]);
    if (subtitle) aoa.push([subtitle]);
    if (title || subtitle) aoa.push([]);
    aoa.push(headerRow, ...dataRows);

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    const merges = [];
    if (title) merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } });
    if (subtitle) merges.push({ s: { r: title ? 1 : 0, c: 0 }, e: { r: title ? 1 : 0, c: columns.length - 1 } });
    if (merges.length) worksheet['!merges'] = merges;

    worksheet['!cols'] = columns.map(() => ({ wch: 18 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportReportToPdf({ title, subtitle, columns, rows, filename }) {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text(title, 14, 16);

    let startY = 22;
    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(subtitle, 14, 22);
        startY = 28;
    }

    autoTable(doc, {
        startY,
        head: [columns.map(c => c.header)],
        body: rows.map(row => columns.map(c => row[c.key] ?? '—')),
        styles: { fontSize: columns.length > 12 ? 6 : 8 },
        headStyles: { fillColor: [43, 96, 99] },
    });

    doc.save(`${filename}.pdf`);
}
