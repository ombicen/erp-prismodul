'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ReactGridProps } from '@silevis/reactgrid';

// Dynamically import ReactGrid with no SSR to avoid hydration issues
const ReactGrid = dynamic(
  () => import('@silevis/reactgrid').then((mod) => mod.ReactGrid),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
        Initializing grid...
      </div>
    ),
  }
);

export function ReactGridWrapper(props: ReactGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Wait for multiple animation frames to ensure DOM is stable
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMounted(true);
        });
      });
    });
  }, []);

  if (!mounted) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
        Loading grid...
      </div>
    );
  }

  return <ReactGrid {...props} />;
}
