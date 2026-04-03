import React from 'react';
import { Link } from 'react-router-dom';

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Something went wrong in this module.',
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log once so module failures are visible during debugging.
    console.error('Module crash:', this.props.moduleName, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          margin: '30px auto',
          maxWidth: '760px',
          padding: '24px',
          border: '1px solid #fecaca',
          backgroundColor: '#fff1f2',
          borderRadius: '10px',
          color: '#7f1d1d',
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Module unavailable: {this.props.moduleName || 'Unknown module'}
        </h3>
        <p style={{ marginBottom: '12px' }}>
          This error is isolated to this module. Other pages can continue to work.
        </p>
        <p style={{ marginBottom: '18px', fontSize: '14px' }}>
          Details: {this.state.errorMessage}
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={this.handleRetry}
            style={{
              backgroundColor: '#b91c1c',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              cursor: 'pointer',
            }}
          >
            Retry module
          </button>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              textDecoration: 'none',
              backgroundColor: '#1f2937',
              color: '#fff',
              borderRadius: '6px',
              padding: '8px 14px',
            }}
          >
            Go to home
          </Link>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-block',
              textDecoration: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: '6px',
              padding: '8px 14px',
            }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }
}

export default RouteErrorBoundary;
