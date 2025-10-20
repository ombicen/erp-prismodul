'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  defaultSize?: number; // percentage
  minSize?: number; // percentage
  maxSize?: number; // percentage
  direction: 'horizontal' | 'vertical';
  position: 'left' | 'right' | 'top' | 'bottom';
  isOpen: boolean;
  onResize?: (size: number) => void;
  onToggle?: () => void;
}

export function ResizablePanel({
  children,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  direction,
  position,
  isOpen,
  onResize,
  onToggle,
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const container = panelRef.current.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let newSize: number;

      if (direction === 'horizontal') {
        if (position === 'left') {
          newSize = ((e.clientX - rect.left) / rect.width) * 100;
        } else {
          newSize = ((rect.right - e.clientX) / rect.width) * 100;
        }
      } else {
        if (position === 'top') {
          newSize = ((e.clientY - rect.top) / rect.height) * 100;
        } else {
          newSize = ((rect.bottom - e.clientY) / rect.height) * 100;
        }
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, position, minSize, maxSize, onResize]);

  if (!isOpen) return null;

  const getStyle = () => {
    if (direction === 'horizontal') {
      return { width: `${size}%`, height: '100%' };
    } else {
      return { width: '100%', height: `${size}%` };
    }
  };

  const getResizeHandleClass = () => {
    const baseClass = 'absolute bg-slate-200 hover:bg-blue-500 transition-colors z-10';
    if (direction === 'horizontal') {
      return `${baseClass} w-1 h-full cursor-col-resize ${position === 'left' ? 'right-0' : 'left-0'}`;
    } else {
      return `${baseClass} h-1 w-full cursor-row-resize ${position === 'top' ? 'bottom-0' : 'top-0'}`;
    }
  };

  return (
    <div
      ref={panelRef}
      className="relative bg-white border-slate-200"
      style={getStyle()}
    >
      <div
        className={getResizeHandleClass()}
        onMouseDown={() => setIsResizing(true)}
      />
      {children}
    </div>
  );
}
