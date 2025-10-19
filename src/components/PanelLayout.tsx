import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface PanelLayoutProps {
  mainPanel: React.ReactNode;
  detailsPanel?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  onDetailsClose?: () => void;
  onBottomClose?: () => void;
}

export function PanelLayout({
  mainPanel,
  detailsPanel,
  bottomPanel,
  onDetailsClose,
  onBottomClose,
}: PanelLayoutProps) {
  const [detailsWidth, setDetailsWidth] = useState(400);
  const [bottomHeight, setBottomHeight] = useState(300);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);

  const detailsResizeRef = useRef<HTMLDivElement>(null);
  const bottomResizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDetailsResize = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const newWidth = Math.max(300, Math.min(containerWidth - 400, e.clientX));
    setDetailsWidth(newWidth);
  };

  const handleBottomResize = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = Math.max(200, Math.min(containerRect.bottom - 100, containerRect.bottom - e.clientY));
    setBottomHeight(newHeight);
  };

  useEffect(() => {
    const detailsHandle = detailsResizeRef.current;
    const bottomHandle = bottomResizeRef.current;

    const onDetailsMouseDown = () => {
      document.addEventListener('mousemove', handleDetailsResize);
      document.addEventListener('mouseup', onDetailsMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const onDetailsMouseUp = () => {
      document.removeEventListener('mousemove', handleDetailsResize);
      document.removeEventListener('mouseup', onDetailsMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const onBottomMouseDown = () => {
      document.addEventListener('mousemove', handleBottomResize);
      document.addEventListener('mouseup', onBottomMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    };

    const onBottomMouseUp = () => {
      document.removeEventListener('mousemove', handleBottomResize);
      document.removeEventListener('mouseup', onBottomMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    detailsHandle?.addEventListener('mousedown', onDetailsMouseDown);
    bottomHandle?.addEventListener('mousedown', onBottomMouseDown);

    return () => {
      detailsHandle?.removeEventListener('mousedown', onDetailsMouseDown);
      bottomHandle?.removeEventListener('mousedown', onBottomMouseDown);
      document.removeEventListener('mousemove', handleDetailsResize);
      document.removeEventListener('mousemove', handleBottomResize);
      document.removeEventListener('mouseup', onDetailsMouseUp);
      document.removeEventListener('mouseup', onBottomMouseUp);
    };
  }, []);

  const topHeight = bottomPanel && !isBottomCollapsed
    ? `calc(100% - ${bottomHeight}px)`
    : '100%';

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full overflow-hidden">
      <div
        className="flex flex-1 overflow-hidden transition-all duration-300"
        style={{ height: topHeight }}
      >
        {detailsPanel && !isDetailsCollapsed && (
          <>
            <div
              className="flex-shrink-0 overflow-hidden bg-white border-r border-slate-300 flex flex-col"
              style={{ width: `${detailsWidth}px` }}
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-300">
                <h3 className="text-sm font-semibold text-slate-700">Detaljer</h3>
                <button
                  onClick={() => {
                    setIsDetailsCollapsed(true);
                    onDetailsClose?.();
                  }}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {detailsPanel}
              </div>
            </div>
            <div
              ref={detailsResizeRef}
              className="w-1 bg-slate-300 hover:bg-blue-500 cursor-ew-resize flex-shrink-0 transition-colors"
            />
          </>
        )}

        <div className="flex-1 overflow-hidden bg-slate-50">
          {detailsPanel && isDetailsCollapsed && (
            <button
              onClick={() => setIsDetailsCollapsed(false)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-slate-700 text-white p-2 rounded-r hover:bg-slate-600 transition-colors shadow-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {mainPanel}
        </div>
      </div>

      {bottomPanel && (
        <>
          <div
            ref={bottomResizeRef}
            className="h-1 bg-slate-300 hover:bg-blue-500 cursor-ns-resize flex-shrink-0 transition-colors"
          />
          <div
            className="flex-shrink-0 overflow-hidden bg-white border-t border-slate-300 flex flex-col transition-all duration-300"
            style={{ height: isBottomCollapsed ? '40px' : `${bottomHeight}px` }}
          >
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">Redigeringsalternativ</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBottomCollapsed(!isBottomCollapsed)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  {isBottomCollapsed ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
            {!isBottomCollapsed && (
              <div className="flex-1 overflow-auto">
                {bottomPanel}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
