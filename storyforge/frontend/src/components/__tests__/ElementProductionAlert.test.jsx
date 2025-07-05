import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import ElementProductionAlert from '../ElementProductionAlert';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('ElementProductionAlert', () => {
  const mockNavigate = jest.fn();

  // Mock useNavigate hook
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when there are no issues', () => {
    const { container } = renderWithTheme(<ElementProductionAlert issues={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render alert when there are issues', () => {
    const issues = [
      {
        type: 'memory-shortage',
        severity: 'warning',
        message: 'Only 30 memory tokens found (target: 55)',
        action: 'Add more memory tokens to reach target economy'
      }
    ];

    renderWithTheme(<ElementProductionAlert issues={issues} />);
    
    expect(screen.getByText('1 production issue(s) detected:')).toBeInTheDocument();
    expect(screen.getByText('Only 30 memory tokens found (target: 55)')).toBeInTheDocument();
  });

  it('should render multiple issues correctly', () => {
    const issues = [
      {
        type: 'memory-shortage',
        severity: 'warning',
        message: 'Only 30 memory tokens found (target: 55)',
        action: 'Add more memory tokens to reach target economy'
      },
      {
        type: 'memory-production',
        severity: 'warning',
        message: '10 memory tokens not ready for production',
        action: 'Complete memory token production pipeline'
      },
      {
        type: 'production-readiness',
        severity: 'info',
        message: '15 elements still in development',
        action: 'Focus on completing high-priority elements'
      }
    ];

    renderWithTheme(<ElementProductionAlert issues={issues} />);
    
    expect(screen.getByText('3 production issue(s) detected:')).toBeInTheDocument();
    expect(screen.getByText('Only 30 memory tokens found (target: 55)')).toBeInTheDocument();
    expect(screen.getByText('10 memory tokens not ready for production')).toBeInTheDocument();
    expect(screen.queryByText('15 elements still in development')).not.toBeInTheDocument(); // Only first 2 shown
  });

  it('should show "more issues" text when there are more than 2 issues', () => {
    const issues = [
      { type: 'issue1', severity: 'warning', message: 'Issue 1', action: 'Action 1' },
      { type: 'issue2', severity: 'warning', message: 'Issue 2', action: 'Action 2' },
      { type: 'issue3', severity: 'info', message: 'Issue 3', action: 'Action 3' },
      { type: 'issue4', severity: 'info', message: 'Issue 4', action: 'Action 4' }
    ];

    renderWithTheme(<ElementProductionAlert issues={issues} />);
    
    expect(screen.getByText('4 production issue(s) detected:')).toBeInTheDocument();
    expect(screen.getByText('+2 more issues')).toBeInTheDocument();
  });

  it('should render "View Memory Dashboard" button', () => {
    const issues = [
      {
        type: 'memory-shortage',
        severity: 'warning',
        message: 'Only 30 memory tokens found (target: 55)',
        action: 'Add more memory tokens to reach target economy'
      }
    ];

    renderWithTheme(<ElementProductionAlert issues={issues} />);
    
    expect(screen.getByText('View Memory Dashboard')).toBeInTheDocument();
  });

  it('should have clickable View Memory Dashboard button', () => {
    const issues = [
      {
        type: 'memory-shortage',
        severity: 'warning',
        message: 'Only 30 memory tokens found (target: 55)',
        action: 'Add more memory tokens to reach target economy'
      }
    ];

    renderWithTheme(<ElementProductionAlert issues={issues} />);
    
    const button = screen.getByText('View Memory Dashboard');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('should have warning severity', () => {
    const issues = [
      {
        type: 'memory-shortage',
        severity: 'warning',
        message: 'Only 30 memory tokens found (target: 55)',
        action: 'Add more memory tokens to reach target economy'
      }
    ];

    const { container } = renderWithTheme(<ElementProductionAlert issues={issues} />);
    
    const alert = container.querySelector('.MuiAlert-standardWarning');
    expect(alert).toBeInTheDocument();
  });

  it('should handle empty issues array gracefully', () => {
    const { container } = renderWithTheme(<ElementProductionAlert issues={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should handle null or undefined issues gracefully', () => {
    const { container: containerNull } = renderWithTheme(<ElementProductionAlert issues={null} />);
    const { container: containerUndefined } = renderWithTheme(<ElementProductionAlert issues={undefined} />);
    
    expect(containerNull.firstChild).toBeNull();
    expect(containerUndefined.firstChild).toBeNull();
  });

  it('should render issues in list format', () => {
    const issues = [
      {
        type: 'memory-shortage',
        severity: 'warning',
        message: 'Only 30 memory tokens found (target: 55)',
        action: 'Add more memory tokens to reach target economy'
      },
      {
        type: 'memory-production',
        severity: 'warning',
        message: '10 memory tokens not ready for production',
        action: 'Complete memory token production pipeline'
      }
    ];

    const { container } = renderWithTheme(<ElementProductionAlert issues={issues} />);
    
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
  });
});