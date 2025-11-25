
export const BUTTERFLY_SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c026d3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c0-2.667 2-4 4-4s4 1.333 4 4c0 2.667-2 4-4 4s-4-1.333-4-4z"/><path d="M12 12c0-2.667-2-4-4-4S4 9.333 4 12c0 2.667 2 4 4 4s4-1.333 4-4z"/><path d="M16 12a4 4 0 01-4 4"/><path d="M8 12a4 4 0 004 4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M20 12h2"/><path d="M2 12h2"/></svg>`;

export const addWatermarkToImage = async (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // --- Watermark Settings ---
      // Only icon, bottom right, subtle
      const iconSize = Math.max(48, canvas.width * 0.08); // Dynamic size based on image
      const padding = Math.max(24, canvas.width * 0.04); 

      const iconImg = new Image();
      
      iconImg.onload = () => {
          const iconX = canvas.width - padding - iconSize;
          const iconY = canvas.height - padding - iconSize;

          // Add a drop shadow to the icon for visibility on all backgrounds
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Draw Icon
          ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);

          resolve(canvas.toDataURL('image/png'));
      };
      
      iconImg.onerror = (e) => {
          console.error("Failed to load watermark icon", e);
          // If watermark fails, resolve with original image rather than failing completely
          resolve(base64Image);
      };

      // Use base64 encoding for robust SVG loading
      const base64Svg = btoa(BUTTERFLY_SVG_STRING);
      iconImg.src = `data:image/svg+xml;base64,${base64Svg}`;
    };
    
    img.onerror = (e) => reject(e);
    img.src = base64Image;
  });
};
