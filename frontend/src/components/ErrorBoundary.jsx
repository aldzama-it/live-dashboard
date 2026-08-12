import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', margin: '20px', borderRadius: '5px', zIndex: 9999 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Click to view error details</summary>
            <p style={{ marginTop: '10px', color: 'red' }}>{this.state.error && this.state.error.toString()}</p>
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
