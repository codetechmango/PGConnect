import React, { useState } from 'react';

interface VirtualTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
}

export const VirtualTourModal: React.FC<VirtualTourModalProps> = ({
  isOpen,
  onClose,
  propertyTitle,
}) => {
  const [activeView, setActiveView] = useState<'twin' | 'facade' | 'mess' | 'gym'>('twin');

  if (!isOpen) return null;

  const views = {
    twin: {
      name: 'Executive Twin Bedroom',
      img: 'https://images.unsplash.com/photo-1555854877-bab0e662b468?w=1600',
      description: '240 sq.ft Twin sharing configuration with dual study desks & attached balcony.',
    },
    facade: {
      name: 'Main Campus & Entrance',
      img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600',
      description: 'G+4 independent secure campus with biometric turnstile gates.',
    },
    mess: {
      name: 'Hygienic Cafeteria & Dining Hall',
      img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600',
      description: 'FSSAI certified commercial kitchen serving 3 daily fresh meals.',
    },
    gym: {
      name: 'Rooftop Fitness Center',
      img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600',
      description: 'Equipped with cardio treadmills, dumbbells, and yoga mats.',
    },
  };

  const current = views[activeView];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:px-6 bg-slate-800/90 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              360
            </span>
            <div>
              <h3 className="font-bold text-base text-white">{propertyTitle}</h3>
              <p className="text-xs text-slate-400">Virtual 360° Walkthrough Simulator</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* 360 Viewport */}
        <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-black overflow-hidden flex items-center justify-center group">
          <img
            src={current.img}
            alt={current.name}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />

          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{current.name}</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/70 backdrop-blur-md text-xs text-slate-300 flex items-center justify-between">
            <p>{current.description}</p>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Use mouse to pan &amp; inspect</span>
          </div>
        </div>

        {/* Room Switcher Tabs */}
        <div className="p-3 sm:p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-2 flex-wrap">
          {(Object.keys(views) as Array<keyof typeof views>).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === key
                  ? 'bg-secondary text-white shadow-md'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {views[key].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
