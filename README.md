## Testing Architecture (Frontend)

- **Unit Tests:** For pure functions (e.g., filterGraph, transformToGraphElements) colocated with their modules.
- **Hook Tests:** For custom hooks (e.g., useRelationshipMapperUIState), use `renderHook` and `act` from `@testing-library/react` v14+.
- **Component/Integration Tests:** For React components, use `@testing-library/react` and `@testing-library/jest-dom`. Use `MemoryRouter` for routing context as needed.
- **ES Modules in Dependencies:**
  - Some libraries (e.g., d3-force, dagre) are published as ES modules. Jest must be configured to transform these by updating `transformIgnorePatterns` in `jest.config.js`:
    ```js
    transformIgnorePatterns: [
      '/node_modules/(?!(d3-force|dagre)/)'
    ]
    ```
  - If using Babel, ensure `babel-jest` is set up in the Jest config.
- **Test Organization:**
  - Tests are colocated with their components or modules for maintainability.
  - Keep test expectations in sync with implementation, especially after refactoring core logic.
- **Running Tests:**
  - Use `npm test` or `yarn test` from the `frontend` directory. 