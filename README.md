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

## Development Status (May 22, 2025)

### Recently Completed Features

#### Visual Zones Implementation
- **Problem Solved**: Dagre's compound node feature was causing persistent errors preventing hierarchical grouping
- **Solution**: Implemented visual background zones with interactive headers as an alternative approach
- **Features**:
  - Automatic detection of semantic groups (puzzle I/O, container contents, character journeys, narrative threads)
  - Color-coded zone backgrounds (orange for puzzles, blue for containers, green for journeys, purple for narrative threads)
  - Interactive zone headers with expand/collapse functionality
  - Zone controls in the relationship mapper panel
  - Proper layering with larger zones rendered behind smaller ones

#### Memory Attribute Parsing
- **Problem Solved**: Memory-type elements needed structured data extraction from descriptions
- **Solution**: Frontend parsing of memory attributes from element descriptions
- **Features**:
  - Extracts `SF_RFID: [value]` patterns from descriptions
  - Supports additional attributes: Memory Type, Owner, Date, Location
  - Enhanced UI display in ElementDetail page with formatted memory data section
  - Graceful fallback when no structured data is found

#### UI/UX Improvements
- Fixed main content area width calculations preventing squished layouts
- Added proper AppBar spacing compensation
- Improved data loading states with `keepPreviousData: true` for smoother transitions
- Persistent floating controls panel in fullscreen mode
- Moved deprecated files to `_deprecated` folder for cleaner codebase

### Next Development Priorities

1. **Advanced Mapper Enhancements** (Phase 2, Step 4)
   - Implement information-rich tooltips with full entity details
   - Add node chips for quick status/type identification
   - Enhance edge labels with contextual information
   - Implement advanced filtering UI

2. **Backend Memory Parsing** (If needed)
   - Evaluate if frontend parsing is sufficient
   - If not, implement backend parsing in `notionPropertyMapper.js`
   - Add comprehensive tests for memory attribute extraction

3. **Documentation Cleanup**
   - Archive auxiliary documentation files
   - Ensure PRD remains the single source of truth
   - Update test documentation to reflect new implementations

4. **Performance Optimization**
   - Profile zone rendering with 50+ nodes
   - Implement viewport culling for zones if needed
   - Optimize zone bound calculations

### Known Issues
- Dagre compound nodes remain non-functional due to library limitations
- Some test files need updating for new graphData structure
- Zone collapse/expand functionality needs comprehensive testing with complex graphs 