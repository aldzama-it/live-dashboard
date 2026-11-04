import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', margin: '20px', borderRadius: '5px', zIndex: 9999 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Something went wrong.</h2>
          <details open style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <p style={{ marginTop: '10px', color: 'red', fontWeight: 'bold' }}>
              {String(this.state.error?.message || this.state.error || 'Unknown Error')}
            </p>
            <pre style={{ marginTop: '10px', fontSize: '12px', overflowX: 'auto' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
