"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";

export function OddsComparisonSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(5, Math.min(95, percentage)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className="relative h-64 md:h-80 rounded-2xl overflow-hidden border cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* Weighted Odds Side (Right/Background) - Green */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 to-green-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl md:text-8xl font-bold text-green-400">78%</div>
              <div className="text-lg font-medium mt-2 text-green-100">Weighted Odds</div>
              <div className="text-sm text-green-300/70">Weighted by Ethos credibility</div>
            </div>
          </div>
        </div>

        {/* Raw Odds Side (Left/Foreground with clip) - Yellow/Orange - OPAQUE background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-yellow-950 to-orange-900"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl md:text-8xl font-bold text-yellow-400">62%</div>
              <div className="text-lg font-medium mt-2 text-yellow-100">Raw Odds</div>
              <div className="text-sm text-yellow-300/70">Every vote counts equally</div>
            </div>
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <button
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-ew-resize"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            aria-label="Drag to compare odds"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Labels */}
        <div className="absolute bottom-4 left-4 text-xs font-medium text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded z-10">
          RAW
        </div>
        <div className="absolute bottom-4 right-4 text-xs font-medium text-green-400 bg-green-400/20 px-2 py-1 rounded">
          WEIGHTED
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Drag the slider to compare raw vs credibility-weighted odds
      </p>
    </div>
  );
}
