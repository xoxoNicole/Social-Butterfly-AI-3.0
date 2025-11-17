import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Replaced the direct state property initialization with a constructor.
  // The class property syntax was causing a TypeScript error where `this.props`
  // was not recognized. Using a constructor to explicitly call `super(props)`
  // and initialize state is a more robust pattern that ensures correct type
  // inference for props.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center p-4">
            <span className="material-icons text-6xl text-fuchsia-400 mb-4">error_outline</span>
            <h1 className="text-2xl font-bold text-red-600">Oops! Something went wrong.</h1>
            <p className="mt-2 text-gray-700">We're sorry for the inconvenience. Please try refreshing the page.</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-full hover:bg-fuchsia-700 transition-colors"
            >
                Refresh Page
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
