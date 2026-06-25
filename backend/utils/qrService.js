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

export const generateQrCode = async (employeeId, employeeType) => {
  try {
    const payload = JSON.stringify({ employeeId, employeeType });
    
    // Generate QR code as Base64 data URL (works everywhere on live/local without filesystem)
    const dataUrl = await QRCode.toDataURL(payload, {
      color: {
        dark: '#1e1b4b', // Deep dark navy indigo for scannability
        light: '#ffffff' // White background
      },
      width: 300,
      margin: 2
    });

    // Try to write to file as a backup for local development, ignoring any write errors on live
    try {
      const fileName = `${employeeId.replace(/[^a-zA-Z0-9-]/g, '_')}.png`;
      const filePath = path.join(QRCODES_DIR, fileName);
      await QRCode.toFile(filePath, payload, {
        type: 'png',
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        },
        width: 300,
        margin: 2
      });
    } catch (fsErr) {
      console.warn(`[QR Backup Save Warning] Could not save QR file to disk:`, fsErr.message);
    }
    
    return dataUrl;
  } catch (error) {
    console.error(`[QR Service Error] Failed to generate QR for ${employeeId}:`, error);
    throw error;
  }
};
