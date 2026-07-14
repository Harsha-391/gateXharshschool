import QRCode from 'qrcode';
import crypto from 'crypto';
import { uploadToImageKit } from './imagekit.js';

/**
 * Generates a QR Code for an employee, uploads it to ImageKit, and returns the cloud URL.
 * Falls back to local base64 data URL on error.
 * @param {string} employeeId - Unique employee ID
 * @param {string} employeeType - 'Teacher', 'Staff', or 'Employee'
 * @param {string} tenantId - Tenant subdomain
 * @returns {Promise<string>} Cloud URL or base64 fallback
 */
export const generateQrCode = async (employeeId, employeeType, tenantId = 'platform') => {
  try {
    const secret = process.env.JWT_SECRET || 'aether-erp-dashboard-super-secure-key-2026';
    const dataToSign = `${employeeId}:${employeeType}`;
    const sig = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
    
    const payload = JSON.stringify({ employeeId, employeeType, sig });
    
    // Generate QR code as Base64 data URL for fallback
    const dataUrl = await QRCode.toDataURL(payload, {
      color: {
        dark: '#1e1b4b', // Deep dark navy indigo for scannability
        light: '#ffffff' // White background
      },
      width: 300,
      margin: 2
    });

    try {
      // Generate binary buffer for uploading to ImageKit
      const buffer = await QRCode.toBuffer(payload, {
        type: 'png',
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        },
        width: 300,
        margin: 2
      });

      const fileName = `qr-${employeeId.replace(/[^a-zA-Z0-9-]/g, '_')}-${Date.now()}.png`;
      const folder = `school/${tenantId}/qrcodes`;

      const uploadResult = await uploadToImageKit(buffer, fileName, folder, ['qrcode', employeeType]);

      console.log(`[QR Service] Successfully uploaded QR code for ${employeeId} to ImageKit.`);
      return uploadResult.url;
    } catch (uploadErr) {
      console.warn(`[QR Service Warning] Could not upload QR code to ImageKit, using base64 fallback:`, uploadErr.message);
      return dataUrl;
    }
  } catch (error) {
    console.error(`[QR Service Error] Failed to generate QR for ${employeeId}:`, error);
    throw error;
  }
};
