import ImageKit from 'imagekit';

// Initialize ImageKit SDK
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_makEtZH97hUpsqsQLBhUYM9UGjU=',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_GbMBzcwU1FHxzMn+DVrAI2fhs78=',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/gcahh2uwm'
});

/**
 * Upload a file buffer directly to ImageKit
 * @param {Buffer|string} file - The file buffer or base64 string in memory
 * @param {string} originalName - The original name of the file
 * @param {string} folderPath - Target folder path on ImageKit (e.g. 'school/sitfg/teachers')
 * @param {Array<string>} tags - List of tags to attach to the file
 * @returns {Promise<{url: string, fileId: string, name: string}>}
 */
export const uploadToImageKit = async (file, originalName, folderPath, tags = []) => {
  try {
    const result = await imagekit.upload({
      file: file,
      fileName: originalName,
      folder: folderPath,
      tags: tags
    });
    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name
    };
  } catch (err) {
    console.error('[ImageKit Service Error] Upload failed:', err.message);
    throw err;
  }
};

/**
 * Delete a file from ImageKit by resolving its fileId directly from ImageKit
 * @param {string} url - Direct ImageKit URL of the file
 * @returns {Promise<boolean>}
 */
export const deleteFromImageKit = async (url) => {
  if (!url || !url.startsWith('https://ik.imagekit.io/')) return false;
  try {
    const urlObj = new URL(url);
    const pathname = decodeURIComponent(urlObj.pathname);
    const parts = pathname.split('/').filter(Boolean);
    
    // Extract endpoint path prefix if present
    if (parts[0] && parts[0] === 'gcahh2uwm') {
      parts.shift();
    }
    
    const imageKitPath = '/' + parts.join('/');
    const fileName = parts[parts.length - 1];

    console.log(`[ImageKit Service] Resolving file ID in ImageKit for: ${imageKitPath}`);
    const files = await imagekit.listFiles({
      searchQuery: `name : "${fileName}"`
    });

    const file = (files || []).find(f => {
      const cleanPath = f.filePath.replace(/\.[^/.]+$/, "");
      const cleanTarget = imageKitPath.replace(/\.[^/.]+$/, "");
      return f.filePath === imageKitPath || cleanPath === cleanTarget || f.url === url;
    });
    if (file && file.fileId) {
      console.log(`[ImageKit Service] Deleting fileId: ${file.fileId} from ImageKit...`);
      await imagekit.deleteFile(file.fileId);
      return true;
    }
    console.log(`[ImageKit Service] File already deleted or not found on ImageKit: ${imageKitPath}`);
    return false;
  } catch (err) {
    console.error('[ImageKit Service Error] Deletion failed:', err.message);
    return false;
  }
};
