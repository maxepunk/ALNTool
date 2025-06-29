import ErrorBoundary from './ErrorBoundary';

// Specialized error boundary for route-level errors
function RouteErrorBoundary({ children }) {
  return (
    <ErrorBoundary level="route">
      {children}
    </ErrorBoundary>
  );
}

export default RouteErrorBoundary;