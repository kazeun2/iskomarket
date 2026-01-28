import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
}

class _ErrorBoundary extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console and keep state for rendering
    console.error('ErrorBoundary caught error:', error, info);
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2 style={{ color: '#b91c1c' }}>Something went wrong.</h2>
          <p style={{ color: '#334155' }}>An unexpected error occurred while rendering the app. Check the console for details.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
            {this.state.error?.toString()}
            {this.state.info?.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary: React.ComponentType<any> = _ErrorBoundary as unknown as React.ComponentType<any>;
