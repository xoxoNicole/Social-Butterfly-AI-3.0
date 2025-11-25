
import React, { useRef } from 'react';

interface CertificateProps {
  userName: string;
  courseName: string;
  date: string;
}

const Certificate: React.FC<CertificateProps> = ({ userName, courseName, date }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    if (!svgRef.current) return;
    
    // Get the SVG content
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    
    // Create a Blob from the SVG data
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create a temporary image to render the SVG to Canvas (to convert to PNG)
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0,0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Download the PNG
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `${courseName.replace(/\s+/g, '_')}_Certificate.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            URL.revokeObjectURL(url);
        }
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-full max-w-3xl shadow-2xl rounded-lg overflow-hidden border border-gray-200">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 1200 800"
          xmlns="http://www.w3.org/2000/svg"
          className="bg-white"
        >
          {/* Background Pattern */}
          <defs>
            <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#e9d5ff" />
            </pattern>
            <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#c026d3', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <rect width="1200" height="800" fill="white" />
          <rect width="1200" height="800" fill="url(#pattern)" />
          
          {/* Ornate Border */}
          <rect x="40" y="40" width="1120" height="720" rx="20" fill="none" stroke="url(#borderGrad)" strokeWidth="8" />
          <rect x="60" y="60" width="1080" height="680" rx="15" fill="none" stroke="#f3e8ff" strokeWidth="4" />

          {/* Header */}
          <text x="600" y="180" textAnchor="middle" fontFamily="serif" fontSize="60" fill="#1f2937" fontWeight="bold">
            Certificate of Completion
          </text>
          
          {/* Butterfly Icon (Stylized) */}
          <path transform="translate(570, 220) scale(2)" d="M12 12c0-2.667 2-4 4-4s4 1.333 4 4c0 2.667-2 4-4 4s-4-1.333-4-4z" fill="#f0abfc" opacity="0.5"/>
          <path transform="translate(570, 220) scale(2)" d="M12 12c0-2.667-2-4-4-4S4 9.333 4 12c0 2.667 2 4 4 4s4-1.333 4-4z" fill="#f0abfc" opacity="0.5"/>

          <text x="600" y="320" textAnchor="middle" fontFamily="sans-serif" fontSize="24" fill="#6b7280">
            This certifies that
          </text>
          
          {/* User Name */}
          <text x="600" y="400" textAnchor="middle" fontFamily="serif" fontSize="72" fill="#c026d3" fontWeight="bold" textDecoration="underline">
            {userName}
          </text>
          
          <text x="600" y="500" textAnchor="middle" fontFamily="sans-serif" fontSize="24" fill="#6b7280">
            has successfully mastered the module
          </text>

          {/* Course Name */}
          <text x="600" y="560" textAnchor="middle" fontFamily="sans-serif" fontSize="48" fill="#4b5563" fontWeight="bold">
            {courseName}
          </text>

          <text x="600" y="620" textAnchor="middle" fontFamily="sans-serif" fontSize="20" fill="#9ca3af">
            at the Social Butterfly Academy
          </text>

          {/* Footer / Date */}
          <line x1="300" y1="680" x2="500" y2="680" stroke="#d1d5db" strokeWidth="2" />
          <text x="400" y="710" textAnchor="middle" fontFamily="sans-serif" fontSize="18" fill="#6b7280">
            {date}
          </text>
          
          <line x1="700" y1="680" x2="900" y2="680" stroke="#d1d5db" strokeWidth="2" />
          <text x="800" y="710" textAnchor="middle" fontFamily="sans-serif" fontSize="18" fill="#6b7280">
            Social Butterfly AI
          </text>
        </svg>
      </div>

      <button
        onClick={handleDownload}
        className="flex items-center space-x-2 px-6 py-3 bg-fuchsia-600 text-white rounded-full font-bold shadow-lg hover:bg-fuchsia-700 transition-transform transform hover:-translate-y-1"
      >
        <span className="material-icons">download</span>
        <span>Download Certificate</span>
      </button>
      <p className="text-sm text-gray-500">Download and share this on LinkedIn!</p>
    </div>
  );
};

export default Certificate;
