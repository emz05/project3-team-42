// client/src/components/common/MagnifierToggle.jsx
import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';

const MagnifierToggle = () => {
  const { magnifierEnabled, setMagnifierEnabled } = useAccessibility();

  const handleChange = () => {
    setMagnifierEnabled(!magnifierEnabled);
  };

  return (
    <button
      type="button"
      onClick={handleChange}
      className={`bg-white rounded-full px-6 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center gap-2 transition-shadow text-sm
        ${magnifierEnabled ? 'ring-2 ring-indigo-500/60' : ''}
        hover:shadow-lg cursor-pointer`}
      aria-label={magnifierEnabled ? 'Disable magnifying glass' : 'Enable magnifying glass'}
    >
      <span aria-hidden="true">
        {magnifierEnabled ? '🔍' : '🔎'}
      </span>
      <span>Magnifier</span>
    </button>
  );
};

export default MagnifierToggle;
