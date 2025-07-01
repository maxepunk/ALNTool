import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuickActionsPanel from './QuickActionsPanel';

describe('QuickActionsPanel', () => {
  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render quick actions title', () => {
    renderWithRouter(<QuickActionsPanel />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    renderWithRouter(<QuickActionsPanel />);
    
    expect(screen.getByText('Manage Characters')).toBeInTheDocument();
    expect(screen.getByText('Memory Economy')).toBeInTheDocument();
    expect(screen.getByText('Dependency Analysis')).toBeInTheDocument();
    expect(screen.getByText('Production Dashboard')).toBeInTheDocument();
  });

  it('should render correct button icons', () => {
    renderWithRouter(<QuickActionsPanel />);
    
    expect(screen.getByTestId('PeopleIcon')).toBeInTheDocument();
    expect(screen.getByTestId('MemoryIcon')).toBeInTheDocument();
    expect(screen.getByTestId('ExtensionIcon')).toBeInTheDocument();
    expect(screen.getByTestId('AssessmentIcon')).toBeInTheDocument();
  });

  it('should have correct navigation links', () => {
    renderWithRouter(<QuickActionsPanel />);
    
    const manageCharactersLink = screen.getByText('Manage Characters').closest('a');
    const memoryEconomyLink = screen.getByText('Memory Economy').closest('a');
    const dependencyAnalysisLink = screen.getByText('Dependency Analysis').closest('a');
    const productionDashboardLink = screen.getByText('Production Dashboard').closest('a');
    
    expect(manageCharactersLink).toHaveAttribute('href', '/characters');
    expect(memoryEconomyLink).toHaveAttribute('href', '/memory-economy');
    expect(dependencyAnalysisLink).toHaveAttribute('href', '/character-sociogram');
    expect(productionDashboardLink).toHaveAttribute('href', '/');
  });

  it('should apply correct button variants', () => {
    renderWithRouter(<QuickActionsPanel />);
    
    const manageCharactersButton = screen.getByText('Manage Characters');
    const memoryEconomyButton = screen.getByText('Memory Economy');
    const dependencyAnalysisButton = screen.getByText('Dependency Analysis');
    const productionDashboardButton = screen.getByText('Production Dashboard');
    
    expect(manageCharactersButton).toHaveClass('MuiButton-outlined');
    expect(memoryEconomyButton).toHaveClass('MuiButton-outlined');
    expect(dependencyAnalysisButton).toHaveClass('MuiButton-outlined');
    expect(productionDashboardButton).toHaveClass('MuiButton-contained');
  });

  it('should render paper wrapper with elevation', () => {
    renderWithRouter(<QuickActionsPanel />);
    
    const paper = screen.getByText('Quick Actions').closest('.MuiPaper-root');
    expect(paper).toHaveClass('MuiPaper-elevation2');
  });

  it('should render buttons in a grid layout', () => {
    renderWithRouter(<QuickActionsPanel />);
    
    const gridContainer = screen.getByText('Quick Actions').nextElementSibling;
    expect(gridContainer).toHaveClass('MuiGrid-container');
    
    const gridItems = gridContainer.querySelectorAll('.MuiGrid-item');
    expect(gridItems).toHaveLength(4);
  });
});