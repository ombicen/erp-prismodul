'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ReactGridErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ReactGrid Error:', error, errorInfo);

    // Auto-retry for offsetTop errors (ReactGrid v5 alpha bug)
    if (error.message.includes('offsetTop') && this.state.retryCount < 3) {
      this.retryTimer = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          retryCount: prevState.retryCount + 1,
        }));
      }, 200 * (this.state.retryCount + 1)); // Exponential backoff
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.retryCount < 3) {
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            Initializing grid... (attempt {this.state.retryCount + 1})
          </div>
        );
      }

      return (
        this.props.fallback || (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
            <div>Failed to load grid after multiple attempts.</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#94a3b8' }}>
              {this.state.error?.message}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null, retryCount: 0 })}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
