import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { features } from '../features';

// --- Start of inlined Butterfly component ---
const butterflyColors = [
  '#f472b6', // pink-400
  '#ec4899', // pink-500
  '#d946ef', // fuchsia-500
  '#c026d3', // fuchsia-600
  '#a855f7', // purple-500
];

const Butterfly: React.FC<{ x: number; y: number; style: React.CSSProperties }> = ({ x, y, style }) => {
  const color = useMemo(() => butterflyColors[Math.floor(Math.random() * butterflyColors.length)], []);
  const flutterDuration = useMemo(() => `${0.2 + Math.random() * 0.2}s`, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        style={{
          filter: `drop-shadow(0 0 2px ${color})`,
          animation: `flutter ${flutterDuration} ease-in-out infinite alternate`,
          transformOrigin: 'center'
        }}
      >
        {/* Wings */}
        <path d="M12 12c4-6 10-4 10 0c0 4-6 6-10 0Z" fill={color} />
        <path d="M12 12c-4-6-10-4-10 0c0 4 6 6 10 0Z" fill={color} />
        {/* Body and antennae */}
        <g stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round">
            <path d="M12 10 V 14" />
            <path d="M11.5 10 C 10.5 8, 9.5 8, 9 6.5" />
            <path d="M12.5 10 C 13.5 8, 14.5 8, 15 6.5" />
        </g>
      </svg>
    </div>
  );
};
// --- End of inlined Butterfly component ---

interface ButterflyState {
  id: number;
  x: number;
  y: number;
  style: React.CSSProperties;
}


const LandingFeatures: React.FC = () => {
  const [butterflies, setButterflies] = useState<ButterflyState[]>([]);

  const handleFeatureClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const newButterflies: ButterflyState[] = Array.from({ length: 15 }).map((_, i) => {
      const id = Date.now() + i;
      const translateX = `${(Math.random() - 0.5) * 400}px`;
      const translateY = `${(Math.random() - 0.5) * 400}px`;
      const rotate = `${(Math.random() - 0.5) * 540}deg`;
      const animationDuration = `${1.5 + Math.random() * 1.5}s`;
      const animationDelay = `${Math.random() * 0.3}s`;

      return {
        id,
        x,
        y,
        style: {
          '--translateX': translateX,
          '--translateY': translateY,
          '--rotate': rotate,
          animation: `fly-away ${animationDuration} ease-out ${animationDelay} forwards`,
        } as React.CSSProperties,
      };
    });

    setButterflies(prev => [...prev, ...newButterflies]);

    setTimeout(() => {
      setButterflies(prev => prev.filter(b => !newButterflies.find(nb => nb.id === b.id)));
    }, 3300); // Max duration + delay
  };

  return (
    <section id="features" className="py-20 bg-gray-50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Everything You Need to Build with Purpose
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            A complete toolkit that merges strategy, creativity, and execution.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
              onClick={handleFeatureClick}
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-fuchsia-100 text-fuchsia-600">
                <span className="material-icons">{feature.icon}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-base text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      {typeof document !== 'undefined' && ReactDOM.createPortal(
        butterflies.map(({ id, x, y, style }) => <Butterfly key={id} x={x} y={y} style={style} />),
        document.body
      )}
    </section>
  );
};

export default LandingFeatures;
