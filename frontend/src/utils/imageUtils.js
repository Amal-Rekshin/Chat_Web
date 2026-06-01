export const formatImageUrl = (url) => {
  if (!url) return url;
  
  // Google Drive link conversion
  // e.g., https://drive.google.com/file/d/1IAj4wNZqzP6zeio_X2AJREemMD7aQ-Kt/view
  const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  
  return url;
};
