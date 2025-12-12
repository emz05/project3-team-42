/*
 * MagnifyingGlass.jsx
 * -----------------------
 * - A simple magnifying glass that follows the mouse cursor
 * - Can be enabled/disabled via AccessibilityContext
 * - Uses CSS transform scale to magnify content under the cursor
 */

import React, { useEffect } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';
import './MagnifyingGlass.css';

const MagnifyingGlass = () => {
  const { magnifierEnabled } = useAccessibility();

  useEffect(() => {
    if (!magnifierEnabled) {
      document.body.classList.remove('magnifier-enabled');
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      return;
    }

    document.body.classList.add('magnifier-enabled');
    const scale = 2;

    const handleMouseMove = (e) => {
      // Scale the body from the cursor position - this makes content under cursor appear magnified
      document.body.style.transform = `scale(${scale})`;
      document.body.style.transformOrigin = `${e.clientX}px ${e.clientY}px`;
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.classList.remove('magnifier-enabled');
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
    };
  }, [magnifierEnabled]);

  // No visual element needed - just the scaling functionality
  return null;
};

export default MagnifyingGlass;

