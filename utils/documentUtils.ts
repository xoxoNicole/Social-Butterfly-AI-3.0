
export const downloadGeneratedFile = (content: string, filename: string, format: string) => {
    let mimeType = 'text/plain';
    let extension = 'txt';
    
    // Clean format string
    const fmt = format.toLowerCase().replace('.', '');

    switch(fmt) {
        case 'csv':
            mimeType = 'text/csv';
            extension = 'csv';
            break;
        case 'pdf':
            // For a truly robust PDF experience, use a library like jsPDF. 
            // For now, we output text/html which browsers can print to PDF easily, 
            // or if the content is raw text, we stick to txt.
            mimeType = 'text/html'; 
            extension = 'html'; 
            if (!content.trim().startsWith('<')) {
                // If it's just plain text, wrap it in a basic HTML structure for better "print to PDF" styling
                content = `<html><body style="font-family: sans-serif; white-space: pre-wrap; padding: 20px;">${content}</body></html>`;
            }
            break;
        case 'html':
            mimeType = 'text/html';
            extension = 'html';
            break;
        case 'doc':
        case 'docx':
            mimeType = 'application/msword';
            extension = 'doc';
            break;
        case 'json':
            mimeType = 'application/json';
            extension = 'json';
            break;
        case 'md':
        case 'markdown':
            mimeType = 'text/markdown';
            extension = 'md';
            break;
        default:
            extension = fmt || 'txt';
    }

    const finalFilename = filename.includes('.') ? filename : `${filename}.${extension}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
