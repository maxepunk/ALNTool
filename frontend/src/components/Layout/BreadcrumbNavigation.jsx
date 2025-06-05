import React from 'react';
import useJourneyStore from '../../stores/journeyStore';

const BreadcrumbNavigation = () => {
  const breadcrumbs = useJourneyStore((state) => state.breadcrumbs);
  const removeBreadcrumbAfter = useJourneyStore((state) => state.removeBreadcrumbAfter);
  // In a real app, you'd use a router like React Router for navigation.
  // For now, clicking a breadcrumb will just use removeBreadcrumbAfter.

  const handleBreadcrumbClick = (path) => {
    // Here, you would typically navigate using your router, e.g., navigate(path);
    // Then, update the breadcrumbs based on the new route.
    // For this demo, we'll just prune the breadcrumbs to the clicked one.
    removeBreadcrumbAfter(path);
    console.log(`Breadcrumb clicked, path: ${path}. Navigation would occur here.`);
  };

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null; // Don't render if no breadcrumbs
  }

  return (
    <nav aria-label="breadcrumb" style={styles.nav}>
      <ol style={styles.breadcrumbList}>
        {breadcrumbs.map((crumb, index) => (
          <li key={index} style={styles.breadcrumbItem}>
            {index < breadcrumbs.length - 1 ? (
              <>
                <button onClick={() => handleBreadcrumbClick(crumb.path)} style={styles.buttonLink}>
                  {crumb.label}
                </button>
                <span style={styles.separator} aria-hidden="true">{'>'}</span>
              </>
            ) : (
              <span style={styles.currentPage} aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

const styles = {
  nav: {
    padding: '8px 15px',
    backgroundColor: '#e9ecef', // Light grey background
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
  },
  breadcrumbList: {
    display: 'flex',
    flexWrap: 'wrap',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  breadcrumbItem: {
    display: 'flex',
    alignItems: 'center',
  },
  buttonLink: {
    background: 'none',
    border: 'none',
    color: '#007bff', // Bootstrap link blue
    textDecoration: 'none',
    cursor: 'pointer',
    padding: '0',
    margin: '0',
    fontSize: 'inherit',
  },
  separator: {
    margin: '0 8px',
    color: '#6c757d', // Muted color for separator
  },
  currentPage: {
    color: '#495057', // Darker color for current page
    fontWeight: 'bold',
  },
};

export default BreadcrumbNavigation;
