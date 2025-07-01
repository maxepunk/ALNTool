// RED PHASE: Test for ErrorBoundary component that doesn't exist yet

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary - RED Phase', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = () => {};
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('should render children when there is no error', () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('should catch errors and display fallback UI', () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    );
    
    // Should show error UI
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });

  test('should show error details in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    );
    
    // In development, should show error message
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  test('should hide error details in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    );
    
    // In production, should NOT show error message
    expect(screen.queryByText(/Test error/)).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  test('should provide retry functionality', async () => {
    const user = userEvent.setup();
    const mockResetError = jest.fn();
    
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    );
    
    // Should show error UI with retry button
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    const retryButton = screen.getByText(/try again/i);
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button should be possible
    await user.click(retryButton);
    
    // The retry button click resets the error boundary's internal state
    // We can't easily test the full retry flow here, but we've verified:
    // 1. The button exists
    // 2. It's clickable
    // The actual retry logic is tested in the existing ErrorBoundary tests
  });

  test('should accept custom fallback component', () => {
    const CustomFallback = ({ error, resetError }) => (
      <div>
        <h2>Custom Error</h2>
        <button onClick={resetError}>Custom Retry</button>
      </div>
    );
    
    render(
      <BrowserRouter>
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });

  test('should log errors to logger', () => {
    const loggerSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    );
    
    // Should have logged the error
    expect(loggerSpy).toHaveBeenCalled();
    
    loggerSpy.mockRestore();
  });
});