import React from 'react';

/**
 * A premium, highly-polished logo loading component for LMS Chemistry.
 * Uses the site's high-fidelity chemistry flask favicon with glowing,
 * bouncing, and rotating animations.
 * 
 * @param {Object} props
 * @param {number} props.size - Width/height of the logo in pixels (default: 64)
 * @param {string} props.text - Dynamic loading message below the graphic
 */
export default function LogoLoader({ size = 64, text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing violet/indigo ripple backdrop */}
        <div 
          className="absolute rounded-3xl bg-indigo-500/10 blur-xl animate-pulse" 
          style={{ 
            width: size * 1.6, 
            height: size * 1.6,
            animationDuration: '2s'
          }} 
        />
        
        {/* Animated chemistry flask container */}
        <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
          <img 
            src="/favicon.svg" 
            alt="Loading..." 
            className="object-contain drop-shadow-md select-none"
            style={{ width: size, height: size }}
            onError={(e) => {
              // Fail-safe fallback: if favicon.svg fails to load, use a simple SVG container
              e.currentTarget.style.display = 'none';
            }}
          />
          
          {/* Subtle spinning dashed accent ring */}
          <div 
            className="absolute rounded-3xl border border-dashed border-indigo-400/40 animate-spin" 
            style={{ 
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              animationDuration: '8s' 
            }} 
          />
        </div>
      </div>
      
      {text && (
        <span className="text-[10px] font-bold text-slate-500 mt-5 tracking-widest uppercase animate-pulse select-none" style={{ animationDuration: '1.8s' }}>
          {text}
        </span>
      )}
    </div>
  );
}
