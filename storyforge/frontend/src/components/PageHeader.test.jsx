import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageHeader from './PageHeader';
import '@testing-library/jest-dom';

describe('PageHeader', () => {
  it('renders the title and breadcrumbs', () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Test Title"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Test' }]}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
}); 