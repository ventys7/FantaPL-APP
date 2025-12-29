import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, '../../Listone e Lista Rose 25-26.xlsx');

const workbook = XLSX.readFile(filePath);
const sheetName = 'Listone';
const sheet = workbook.Sheets[sheetName];

console.log(`--- Sheet: ${sheetName} ---`);
console.log("Range (!ref):", sheet['!ref']);

const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

// Print first 20 rows
data.slice(0, 20).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
});
