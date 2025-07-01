import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import ProductionIssuesAlert from '../ProductionIssuesAlert';

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

describe('ProductionIssuesAlert', () => {
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
    const { container } = renderWithTheme(<ProductionIssuesAlert issues={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render alert when there are issues', () => {
    const issues = [
      {
        type: 'path-assignment',
        severity: 'warning',
        message: '5 characters need resolution path assignment',
        action: 'Assign characters to narrative paths'
      }
    ];

    renderWithTheme(<ProductionIssuesAlert issues={issues} />);
    
    expect(screen.getByText('1 production issue(s) detected:')).toBeInTheDocument();
    expect(screen.getByText('5 characters need resolution path assignment')).toBeInTheDocument();
  });

  it('should render multiple issues correctly', () => {
    const issues = [
      {
        type: 'path-assignment',
        severity: 'warning',
        message: '5 characters need resolution path assignment',
        action: 'Assign characters to narrative paths'
      },
      {
        type: 'social-isolation',
        severity: 'warning',
        message: '3 characters have no social connections',
        action: 'Add character relationships'
      },
      {
        type: 'memory-economy',
        severity: 'info',
        message: 'Memory token count below target',
        action: 'Add more memory tokens'
      }
    ];

    renderWithTheme(<ProductionIssuesAlert issues={issues} />);
    
    expect(screen.getByText('3 production issue(s) detected:')).toBeInTheDocument();
    expect(screen.getByText('5 characters need resolution path assignment')).toBeInTheDocument();
    expect(screen.getByText('3 characters have no social connections')).toBeInTheDocument();
    expect(screen.queryByText('Memory token count below target')).not.toBeInTheDocument(); // Only first 2 shown
  });

  it('should show "more issues" text when there are more than 2 issues', () => {
    const issues = [
      { type: 'issue1', severity: 'warning', message: 'Issue 1', action: 'Action 1' },
      { type: 'issue2', severity: 'warning', message: 'Issue 2', action: 'Action 2' },
      { type: 'issue3', severity: 'info', message: 'Issue 3', action: 'Action 3' },
      { type: 'issue4', severity: 'info', message: 'Issue 4', action: 'Action 4' }
    ];

    renderWithTheme(<ProductionIssuesAlert issues={issues} />);
    
    expect(screen.getByText('4 production issue(s) detected:')).toBeInTheDocument();
    expect(screen.getByText('+2 more issues')).toBeInTheDocument();
  });

  it('should render "View Path Analyzer" button', () => {
    const issues = [
      {
        type: 'path-assignment',
        severity: 'warning',
        message: '5 characters need resolution path assignment',
        action: 'Assign characters to narrative paths'
      }
    ];

    renderWithTheme(<ProductionIssuesAlert issues={issues} />);
    
    expect(screen.getByText('View Path Analyzer')).toBeInTheDocument();
  });

  it('should have clickable View Path Analyzer button', () => {
    const issues = [
      {
        type: 'path-assignment',
        severity: 'warning',
        message: '5 characters need resolution path assignment',
        action: 'Assign characters to narrative paths'
      }
    ];

    renderWithTheme(<ProductionIssuesAlert issues={issues} />);
    
    const button = screen.getByText('View Path Analyzer');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('should have warning severity', () => {
    const issues = [
      {
        type: 'path-assignment',
        severity: 'warning',
        message: '5 characters need resolution path assignment',
        action: 'Assign characters to narrative paths'
      }
    ];

    const { container } = renderWithTheme(<ProductionIssuesAlert issues={issues} />);
    
    const alert = container.querySelector('.MuiAlert-standardWarning');
    expect(alert).toBeInTheDocument();
  });

  it('should handle empty issues array gracefully', () => {
    const { container } = renderWithTheme(<ProductionIssuesAlert issues={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should handle null or undefined issues gracefully', () => {
    const { container: containerNull } = renderWithTheme(<ProductionIssuesAlert issues={null} />);
    const { container: containerUndefined } = renderWithTheme(<ProductionIssuesAlert issues={undefined} />);
    
    expect(containerNull.firstChild).toBeNull();
    expect(containerUndefined.firstChild).toBeNull();
  });

  it('should render issues in list format', () => {
    const issues = [
      {
        type: 'path-assignment',
        severity: 'warning',
        message: '5 characters need resolution path assignment',
        action: 'Assign characters to narrative paths'
      },
      {
        type: 'social-isolation',
        severity: 'warning',
        message: '3 characters have no social connections',
        action: 'Add character relationships'
      }
    ];

    const { container } = renderWithTheme(<ProductionIssuesAlert issues={issues} />);
    
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
  });
});