
import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Social Butterfly-AI Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            padding: '20px', 
            backgroundColor: '#fdf4ff', // Fuchsia-50 equivalent
            textAlign: 'center',
            color: '#1f2937',
            fontFamily: 'Poppins, sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{ 
                    color: '#c026d3', // Fuchsia-600
                    marginBottom: '20px' 
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    Something went wrong
                </h1>
                <p style={{ marginBottom: '24px', color: '#4b5563' }}>
                    We encountered an unexpected error. Please try refreshing the page.
                </p>
                
                {this.state.error && (
                    <details style={{ marginBottom: '24px', textAlign: 'left' }}>
                        <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '14px' }}>View Error Details</summary>
                        <pre style={{ 
                            marginTop: '8px',
                            padding: '12px', 
                            backgroundColor: '#f3f4f6', 
                            borderRadius: '8px', 
                            color: '#ef4444',
                            overflow: 'auto',
                            fontSize: '12px',
                            maxHeight: '150px'
                        }}>
                            {this.state.error.message || this.state.error.toString()}
                        </pre>
                    </details>
                )}

                <button
                    onClick={() => window.location.reload()}
                    style={{
                        width: '100%',
                        padding: '12px 24px',
                        backgroundColor: '#c026d3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        transition: 'background-color 0.2s'
                    }}
                >
                    Refresh Application
                </button>
            </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
