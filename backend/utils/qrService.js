import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const QRCODES_DIR = path.join(UPLOADS_DIR, 'qrcodes');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(QRCODES_DIR)) {
  fs.mkdirSync(QRCODES_DIR, { recursive: true });
}

/**
 * Generates a QR code PNG image containing the employee ID and employee type.
 * Saves the file in backend/uploads/qrcodes/ and returns the relative path.
 * 
 * @param {string} employeeId - Unique identifier (e.g. EMP-2026-1001)
 * @param {string} employeeType - 'Teacher' or 'Staff'
 * @returns {Promise<string>} - Relative path to the generated QR code (e.g. /uploads/qrcodes/EMP-2026-1001.png)
 */
export const generateQrCode = async (employeeId, employeeType) => {
  try {
    const payload = JSON.stringify({ employeeId, employeeType });
    const fileName = `${employeeId.replace(/[^a-zA-Z0-9-]/g, '_')}.png`;
    const filePath = path.join(QRCODES_DIR, fileName);
    
    // Generate QR code and write to file
    await QRCode.toFile(filePath, payload, {
      type: 'png',
      color: {
        dark: '#1e1b4b', // Deep dark navy indigo for scannability
        light: '#ffffff' // White background
      },
      width: 300,
      margin: 2
    });
    
    // Return relative URL path matching static uploads server route
    return `/uploads/qrcodes/${fileName}`;
  } catch (error) {
    console.error(`[QR Service Error] Failed to generate QR for ${employeeId}:`, error);
    throw error;
  }
};
