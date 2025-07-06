# ALNTool Pattern Library

This document provides a comprehensive guide to the reusable patterns, components, hooks, and utilities available in the ALNTool frontend application.

## Table of Contents

- [Component Patterns](#component-patterns)
  - [Form Components](#form-components)
  - [Layout Components](#layout-components)
  - [Data Display](#data-display)
  - [Feedback Components](#feedback-components)
  - [Navigation Components](#navigation-components)
- [Hook Patterns](#hook-patterns)
- [Utility Patterns](#utility-patterns)
- [Usage Guidelines](#usage-guidelines)
- [Best Practices](#best-practices)

## Component Patterns

All pattern components are located in `src/components/patterns/` and follow consistent design principles:

- Comprehensive PropTypes validation
- JSDoc documentation with examples
- React.memo for performance optimization
- Consistent prop interfaces across similar components
- Accessibility considerations (ARIA labels, keyboard support)

### Form Components

#### TextInput
A versatile text input component with built-in features.

```jsx
import { TextInput } from '@/components/patterns/TextInput';

// Basic usage
<TextInput
  label="Username"
  value={username}
  onChange={setUsername}
  required
/>

// With validation and debouncing
<TextInput
  label="Search"
  placeholder="Search entities..."
  onChange={handleSearch}
  debounceMs={300}
  startIcon={<SearchIcon />}
  clearable
/>

// Multiline with character count
<TextInput
  label="Description"
  multiline
  rows={4}
  maxLength={500}
  showCharCount
  value={description}
  onChange={setDescription}
/>
```

#### Select
Dropdown selection component with single and multiple selection support.

```jsx
import { Select } from '@/components/patterns/Select';

// Single selection
<Select
  label="Role"
  value={role}
  onChange={setRole}
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' }
  ]}
/>

// Multiple selection with groups
<Select
  label="Features"
  multiple
  value={selectedFeatures}
  onChange={setSelectedFeatures}
  options={[
    { 
      group: 'Basic', 
      options: [
        { value: 'feature1', label: 'Feature 1' },
        { value: 'feature2', label: 'Feature 2' }
      ]
    }
  ]}
/>
```

#### Checkbox
Single checkbox or checkbox group component.

```jsx
import { Checkbox } from '@/components/patterns/Checkbox';

// Single checkbox
<Checkbox
  label="I agree to terms"
  checked={agreed}
  onChange={setAgreed}
/>

// Checkbox group
<Checkbox
  label="Select Features"
  options={featureOptions}
  value={selectedFeatures}
  onChange={setSelectedFeatures}
  row
/>
```

#### RadioGroup
Radio button group for single selection from multiple options.

```jsx
import { RadioGroup } from '@/components/patterns/RadioGroup';

<RadioGroup
  label="Choose Plan"
  value={plan}
  onChange={setPlan}
  options={[
    { value: 'basic', label: 'Basic', description: '$9/month' },
    { value: 'pro', label: 'Pro', description: '$19/month' }
  ]}
/>
```

#### FormField
Wrapper component for consistent form field layout.

```jsx
import { FormField } from '@/components/patterns/FormField';

<FormField 
  label="API Key"
  required
  helpText="Find your API key in settings"
  error={errors.apiKey}
>
  <TextInput 
    value={apiKey} 
    onChange={setApiKey}
    type="password"
  />
</FormField>
```

### Layout Components

#### Grid
Responsive 12-column grid system.

```jsx
import { Grid, GridContainer, GridItem } from '@/components/patterns/Grid';

<GridContainer spacing={3}>
  <GridItem xs={12} md={6} lg={4}>
    <Card>Content 1</Card>
  </GridItem>
  <GridItem xs={12} md={6} lg={4}>
    <Card>Content 2</Card>
  </GridItem>
</GridContainer>
```

#### Stack
Arrange elements with consistent spacing.

```jsx
import { Stack, VStack, HStack } from '@/components/patterns/Stack';

// Vertical stack
<VStack spacing={2}>
  <Title />
  <Description />
  <Actions />
</VStack>

// Horizontal with dividers
<HStack divider spacing={2}>
  <Metric1 />
  <Metric2 />
  <Metric3 />
</HStack>
```

#### Container
Responsive container with consistent max-widths.

```jsx
import { Container, Section, CardContainer } from '@/components/patterns/Container';

// Page container
<Container maxWidth="lg">
  <PageContent />
</Container>

// Full-width section
<Section background="primary.light" py={4}>
  <Container maxWidth="md">
    <HeroContent />
  </Container>
</Section>

// Card container
<CardContainer maxWidth="sm" elevation={2}>
  <LoginForm />
</CardContainer>
```

#### Card
Flexible card component for content display.

```jsx
import { Card } from '@/components/patterns/Card';

// Basic card
<Card title="Card Title" subtitle="Subtitle">
  <Typography>Card content</Typography>
</Card>

// Expandable card with actions
<Card
  title="Details"
  expandable
  defaultExpanded={false}
  actions={[<Button>View</Button>]}
>
  <Summary />
  <Card.ExpandableContent>
    <DetailedInfo />
  </Card.ExpandableContent>
</Card>
```

#### Divider
Visual separator with optional text.

```jsx
import { Divider, TextDivider } from '@/components/patterns/Divider';

<Divider />
<Divider my={4} />
<TextDivider text="OR" />
<Divider variant="middle">
  <Chip label="Section" size="small" />
</Divider>
```

### Data Display

#### DataTable
Feature-rich table component.

```jsx
import { DataTable } from '@/components/patterns/DataTable';

<DataTable
  columns={[
    { id: 'name', label: 'Name', sortable: true },
    { id: 'email', label: 'Email' },
    { id: 'role', label: 'Role', align: 'center' }
  ]}
  data={users}
  onRowClick={handleRowClick}
  searchable
  paginate
  pageSize={10}
/>
```

#### DetailCard
Display entity details in a structured format.

```jsx
import { DetailCard } from '@/components/patterns/DetailCard';

<DetailCard
  title="User Profile"
  avatar={<Avatar src={user.avatar} />}
  fields={[
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email, copyable: true },
    { label: 'Status', value: user.status, chip: true }
  ]}
  actions={[
    <Button key="edit">Edit</Button>,
    <Button key="delete" color="error">Delete</Button>
  ]}
/>
```

#### MetricCard
Display metrics with formatting and trends.

```jsx
import { MetricCard } from '@/components/patterns/MetricCard';

<MetricCard
  title="Revenue"
  value={5000}
  format="currency"
  trend="up"
  trendValue={15}
  icon={<MoneyIcon />}
  onClick={handleClick}
/>
```

### Feedback Components

#### Alert
Display feedback messages.

```jsx
import { Alert, SuccessAlert, ErrorAlert } from '@/components/patterns/Alert';

<Alert severity="info" dismissible autoHideDuration={5000}>
  New update available!
</Alert>

<ErrorAlert title="Error" dismissible>
  Failed to save changes.
</ErrorAlert>
```

#### Toast
Temporary notifications.

```jsx
import { Toast, ToastProvider, useToast } from '@/components/patterns/Toast';

// In your app root
<ToastProvider>
  <App />
</ToastProvider>

// In components
const { showToast } = useToast();

showToast({
  message: 'File uploaded successfully',
  severity: 'success',
  duration: 3000
});
```

#### Badge
Display small badges on elements.

```jsx
import { Badge, NotificationBadge, StatusBadge } from '@/components/patterns/Badge';

<Badge badgeContent={5} color="error">
  <MailIcon />
</Badge>

<StatusBadge status="online">
  <Avatar />
</StatusBadge>
```

#### Progress
Show progress indicators.

```jsx
import { Progress, CircularLoader } from '@/components/patterns/Progress';

// Linear progress
<Progress value={60} showLabel />

// Circular with label
<Progress 
  variant="circular"
  value={75}
  size={80}
  showLabel
/>

// Indeterminate
<CircularLoader />
```

### Navigation Components

#### ActionButton
Enhanced button with loading and confirmation states.

```jsx
import { ActionButton } from '@/components/patterns/ActionButton';

<ActionButton
  variant="contained"
  color="primary"
  loading={isSubmitting}
  loadingText="Saving..."
  confirmation={{
    title: 'Confirm Action',
    message: 'Are you sure?'
  }}
  onClick={handleSubmit}
>
  Save Changes
</ActionButton>
```

#### ConfirmDialog
Confirmation dialog for destructive actions.

```jsx
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog';

<ConfirmDialog
  open={showConfirm}
  title="Delete Item"
  message="This action cannot be undone."
  confirmText="Delete"
  confirmColor="error"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

## Hook Patterns

All custom hooks are located in `src/hooks/patterns/` and provide reusable logic for common scenarios.

### useDebounce
Debounce values or callbacks.

```jsx
import { useDebounce, useDebouncedCallback } from '@/hooks/patterns/useDebounce';

// Debounce value
const debouncedSearch = useDebounce(searchTerm, 300);

// Debounce callback
const debouncedSave = useDebouncedCallback(
  (value) => saveToServer(value),
  1000
);
```

### useLocalStorage
Persist state in localStorage with cross-tab sync.

```jsx
import { useLocalStorage } from '@/hooks/patterns/useLocalStorage';

const [theme, setTheme] = useLocalStorage('theme', 'light');
const [preferences, setPreferences] = useLocalStorage('prefs', {}, {
  syncTabs: true
});
```

### useAsync
Handle async operations with loading, error, and data states.

```jsx
import { useAsync, useAsyncData } from '@/hooks/patterns/useAsync';

// Basic async
const { data, loading, error, execute, cancel } = useAsync(fetchUser);

// With caching
const { data: users, loading, refetch } = useAsyncData(
  'users',
  fetchUsers,
  { cacheTime: 5 * 60 * 1000 }
);
```

### useKeyboardShortcuts
Register keyboard shortcuts.

```jsx
import { useKeyboardShortcuts } from '@/hooks/patterns/useKeyboardShortcuts';

useKeyboardShortcuts([
  {
    keys: ['ctrl+s', 'cmd+s'],
    handler: handleSave,
    description: 'Save changes'
  },
  {
    keys: ['escape'],
    handler: handleCancel,
    enableOnFormTags: true
  }
]);
```

### useEntityRelationships
ALNTool-specific hook for managing entity relationships.

```jsx
import { useEntityRelationships } from '@/hooks/patterns/useEntityRelationships';

const {
  relationships,
  edges,
  isLoading,
  getRelatedEntities,
  areEntitiesRelated
} = useEntityRelationships(entityId);
```

## Utility Patterns

All utility functions are located in `src/utils/patterns/`.

### Formatters
Data formatting utilities.

```jsx
import { 
  formatCurrency, 
  formatPercentage, 
  formatDate,
  formatFileSize 
} from '@/utils/patterns/formatters';

formatCurrency(1234.56); // "$1,234.56"
formatPercentage(0.156); // "15.6%"
formatDate(new Date()); // "Jan 15, 2024"
formatFileSize(1048576); // "1 MB"
```

### Validators
Input validation functions.

```jsx
import { 
  isValidEmail, 
  validatePassword,
  validateForm 
} from '@/utils/patterns/validators';

// Single validation
isValidEmail('user@example.com'); // true

// Form validation
const result = validateForm(formData, {
  email: [
    { rule: isRequired, message: 'Email required' },
    { rule: isValidEmail, message: 'Invalid email' }
  ],
  password: [
    { rule: (v) => minLength(v, 8), message: 'Min 8 chars' }
  ]
});
```

### Constants
Shared constants and enums.

```jsx
import { 
  ENTITY_TYPES, 
  SIZES, 
  COLORS,
  API 
} from '@/utils/patterns/constants';

// Use throughout the app for consistency
```

### API Helpers
Utilities for API requests.

```jsx
import { 
  buildQueryString, 
  parseErrorMessage,
  retryRequest,
  debounceApi 
} from '@/utils/patterns/apiHelpers';

// Build query strings
const query = buildQueryString({ page: 1, limit: 10 }); // "?page=1&limit=10"

// Retry failed requests
const data = await retryRequest(
  () => fetchData(),
  { maxAttempts: 3, delay: 1000 }
);
```

## Usage Guidelines

### Import Patterns

```jsx
// Components
import { Button, Card, DataTable } from '@/components/patterns';

// Hooks
import { useDebounce, useAsync } from '@/hooks/patterns';

// Utilities
import { formatCurrency, isValidEmail } from '@/utils/patterns';
```

### Consistent Styling

All pattern components accept standard Material-UI props:
- `className` - Additional CSS classes
- `sx` - MUI system prop for inline styles
- Theme-aware color props
- Responsive sizing

### Composition

Pattern components are designed to work together:

```jsx
<Container>
  <Stack spacing={3}>
    <Card title="Users">
      <DataTable columns={columns} data={users} />
    </Card>
    <HStack spacing={2} justifyContent="flex-end">
      <Button variant="outlined">Cancel</Button>
      <ActionButton loading={saving}>Save</ActionButton>
    </HStack>
  </Stack>
</Container>
```

## Best Practices

1. **Use Pattern Components First**: Before creating custom components, check if a pattern component can meet your needs.

2. **Extend, Don't Duplicate**: If you need custom behavior, extend pattern components rather than creating duplicates.

3. **Maintain Consistency**: Use the constants and formatters to ensure consistency across the application.

4. **Document Custom Patterns**: If you create new patterns, add them to this library with proper documentation.

5. **Test Patterns**: All patterns should have comprehensive tests covering various use cases.

6. **Performance**: Use React.memo and proper memoization for expensive operations.

7. **Accessibility**: Ensure all interactive components have proper ARIA labels and keyboard support.

8. **Type Safety**: When using TypeScript, leverage the built-in types and interfaces.

## Contributing

When adding new patterns:

1. Place components in `src/components/patterns/`
2. Place hooks in `src/hooks/patterns/`
3. Place utilities in `src/utils/patterns/`
4. Include comprehensive JSDoc documentation
5. Add PropTypes validation for components
6. Create usage examples in documentation
7. Write unit tests
8. Update this documentation

## Version History

- **v1.0.0** (2024-01-15): Initial pattern library implementation
  - 19 reusable components
  - 5 custom hooks
  - 4 utility modules
  - Comprehensive documentation