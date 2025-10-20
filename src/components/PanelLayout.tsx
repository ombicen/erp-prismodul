'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ResizablePanel } from './ResizablePanel';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface PanelLayoutProps {
  mainPanel: ReactNode;
  detailsPanel?: ReactNode;
  bottomPanel?: ReactNode;
  isDetailsOpen: boolean;
  isBottomOpen: boolean;
  onCloseDetails: () => void;
  onCloseBottom: () => void;
}

export function PanelLayout({
  mainPanel,
  detailsPanel,
  bottomPanel,
  isDetailsOpen,
  isBottomOpen,
  onCloseDetails,
  onCloseBottom,
}: PanelLayoutProps) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isBottomExpanded, setIsBottomExpanded] = useState(false);

  // Reset expanded state when panels are closed
  useEffect(() => {
    if (!isDetailsOpen) {
      setIsDetailsExpanded(false);
    }
  }, [isDetailsOpen]);

  useEffect(() => {
    if (!isBottomOpen) {
      setIsBottomExpanded(false);
    }
  }, [isBottomOpen]);

  const handleToggleDetailsExpand = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  const handleToggleBottomExpand = () => {
    setIsBottomExpanded(!isBottomExpanded);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top section: Main + Details panels */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{
          height: isBottomOpen && !isBottomExpanded ? '60%' : '100%',
          display: isBottomExpanded ? 'none' : 'flex'
        }}
      >
        {/* Main Panel (Left) - hide when details is expanded */}
        {!isDetailsExpanded && (
          <div className="flex-1 overflow-hidden">
            {mainPanel}
          </div>
        )}

        {/* Details Panel (Right) */}
        {isDetailsOpen && (
          isDetailsExpanded ? (
            // Expanded mode: full width without ResizablePanel
            <div className="w-full h-full flex flex-col border-l border-slate-200">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-900">Details</h2>
                <div className="flex gap-1">
                  <button
                    onClick={handleToggleDetailsExpand}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Restore"
                  >
                    <Minimize2 className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    onClick={onCloseDetails}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {detailsPanel}
              </div>
            </div>
          ) : (
            // Normal mode: resizable panel
            <ResizablePanel
              direction="horizontal"
              position="right"
              isOpen={isDetailsOpen}
              defaultSize={40}
              minSize={30}
              maxSize={70}
            >
              <div className="h-full flex flex-col border-l border-slate-200">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-sm font-semibold text-slate-900">Details</h2>
                  <div className="flex gap-1">
                    <button
                      onClick={handleToggleDetailsExpand}
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                      title="Maximize"
                    >
                      <Maximize2 className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                      onClick={onCloseDetails}
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                      title="Close"
                    >
                      <X className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {detailsPanel}
                </div>
              </div>
            </ResizablePanel>
          )
        )}
      </div>

      {/* Bottom Panel - hide when details panel is expanded */}
      {isBottomOpen && !isDetailsExpanded && (
        isBottomExpanded ? (
          // Expanded mode: full height without ResizablePanel
          <div className="w-full h-full flex flex-col border-t border-slate-200">
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">Editor</h2>
              <div className="flex gap-1">
                <button
                  onClick={handleToggleBottomExpand}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                  title="Restore"
                >
                  <Minimize2 className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={onCloseBottom}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {bottomPanel}
            </div>
          </div>
        ) : (
          // Normal mode: resizable panel
          <ResizablePanel
            direction="vertical"
            position="bottom"
            isOpen={isBottomOpen}
            defaultSize={40}
            minSize={20}
            maxSize={60}
          >
            <div className="h-full flex flex-col border-t border-slate-200">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-900">Editor</h2>
                <div className="flex gap-1">
                  <button
                    onClick={handleToggleBottomExpand}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Maximize"
                  >
                    <Maximize2 className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    onClick={onCloseBottom}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {bottomPanel}
              </div>
            </div>
          </ResizablePanel>
        )
      )}
    </div>
  );
}
