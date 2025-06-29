/**
 * ESLint rule to prevent hardcoded business values
 * All business values should be imported from GameConstants
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded business values - use GameConstants instead',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    messages: {
      hardcodedMemoryValue: 'Hardcoded memory value "{{value}}". Use GameConstants.MEMORY_VALUE.BASE_VALUES instead.',
      hardcodedMultiplier: 'Hardcoded type multiplier "{{value}}". Use GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS instead.',
      hardcodedResolutionPath: 'Hardcoded resolution path "{{value}}". Use GameConstants.RESOLUTION_PATHS.TYPES instead.',
      hardcodedActValue: 'Hardcoded act value "{{value}}". Use GameConstants.ACTS instead.',
      hardcodedThreshold: 'Hardcoded threshold value "{{value}}". Use appropriate GameConstants threshold.',
      hardcodedTokenCount: 'Hardcoded token count "{{value}}". Use GameConstants.MEMORY_VALUE.TARGET_TOKEN_COUNT or similar.',
      suspiciousBusinessValue: 'Suspicious business value "{{value}}". Consider using GameConstants if this is a business rule.'
    }
  },

  create(context) {
    // Known business values that should come from GameConstants
    const MEMORY_BASE_VALUES = [100, 500, 1000, 5000, 10000];
    const TYPE_MULTIPLIERS = [2.0, 5.0, 10.0, 1.5, 2, 5, 10]; // Including old incorrect values
    const RESOLUTION_PATHS = ['Black Market', 'Detective', 'Third Path', 'Unassigned'];
    const ACT_VALUES = ['Act 1', 'Act 2', 'act1', 'act2'];
    const COMMON_THRESHOLDS = [0.3, 0.5, 0.7, 30, 50, 70];
    const TOKEN_COUNTS = [50, 55, 60];

    // Check if the file imports GameConstants
    let hasGameConstantsImport = false;
    let gameConstantsIdentifier = null;

    return {
      // Track imports
      ImportDeclaration(node) {
        if (node.source.value && node.source.value.includes('GameConstants')) {
          hasGameConstantsImport = true;
          // Find the imported identifier
          node.specifiers.forEach(spec => {
            if (spec.type === 'ImportDefaultSpecifier' || spec.type === 'ImportSpecifier') {
              gameConstantsIdentifier = spec.local.name;
            }
          });
        }
      },

      VariableDeclarator(node) {
        if (node.init && node.init.type === 'CallExpression' && 
            node.init.callee.name === 'require' &&
            node.init.arguments[0] && 
            node.init.arguments[0].value && 
            node.init.arguments[0].value.includes('GameConstants')) {
          hasGameConstantsImport = true;
          gameConstantsIdentifier = node.id.name;
        }
      },

      // Check literals
      Literal(node) {
        const value = node.value;

        // Skip if in a test file or GameConstants file itself
        const filename = context.getFilename();
        if (filename.includes('.test.') || 
            filename.includes('.spec.') || 
            filename.includes('GameConstants.js') ||
            filename.includes('eslint-rules')) {
          return;
        }

        // Check if this is an HTTP status code context
        const parent = node.parent;
        const isHttpStatus = parent && parent.type === 'CallExpression' && 
                           parent.callee && parent.callee.type === 'MemberExpression' &&
                           parent.callee.property && parent.callee.property.name === 'status';

        // Check if this is a percentage calculation (multiply/divide by 100)
        const isPercentageCalc = value === 100 && parent && parent.type === 'BinaryExpression' && 
                                (parent.operator === '*' || parent.operator === '/');

        // Check for memory base values (skip if HTTP status or percentage calculation)
        if (MEMORY_BASE_VALUES.includes(value) && !isHttpStatus && !isPercentageCalc) {
          context.report({
            node,
            messageId: 'hardcodedMemoryValue',
            data: { value }
          });
        }

        // Check if this is a parseInt radix parameter
        const isParseIntRadix = parent && parent.type === 'CallExpression' && 
                               parent.callee && parent.callee.name === 'parseInt' &&
                               parent.arguments && parent.arguments.indexOf(node) === 1;

        // Check if this is a mathematical or bitwise operation
        const isMathOperation = parent && parent.type === 'BinaryExpression' && 
                               (parent.operator === '/' || parent.operator === '*' || 
                                parent.operator === '<<' || parent.operator === '>>' || 
                                parent.operator === '>>>' || parent.operator === '&' || 
                                parent.operator === '|' || parent.operator === '^');

        // Check if this is a slice/substring operation
        const isSliceOperation = parent && parent.type === 'CallExpression' && 
                                parent.callee && parent.callee.type === 'MemberExpression' &&
                                parent.callee.property && (parent.callee.property.name === 'slice' || 
                                                          parent.callee.property.name === 'substring' ||
                                                          parent.callee.property.name === 'substr');

        // Check for type multipliers (skip if parseInt radix, math operation, or slice)
        if (TYPE_MULTIPLIERS.includes(value) && !isParseIntRadix && !isMathOperation && !isSliceOperation) {
          context.report({
            node,
            messageId: 'hardcodedMultiplier',
            data: { value }
          });
        }

        // Check for resolution paths
        if (typeof value === 'string' && RESOLUTION_PATHS.includes(value)) {
          context.report({
            node,
            messageId: 'hardcodedResolutionPath',
            data: { value }
          });
        }

        // Check for act values
        if (typeof value === 'string' && ACT_VALUES.includes(value)) {
          context.report({
            node,
            messageId: 'hardcodedActValue',
            data: { value }
          });
        }

        // Check for common thresholds
        if (COMMON_THRESHOLDS.includes(value)) {
          context.report({
            node,
            messageId: 'hardcodedThreshold',
            data: { value }
          });
        }

        // Check for token counts
        if (TOKEN_COUNTS.includes(value)) {
          context.report({
            node,
            messageId: 'hardcodedTokenCount',
            data: { value }
          });
        }
      },

      // Check object properties for hardcoded business logic
      Property(node) {
        const filename = context.getFilename();
        if (filename.includes('.test.') || 
            filename.includes('.spec.') || 
            filename.includes('GameConstants.js') ||
            filename.includes('eslint-rules')) {
          return;
        }

        // Check for objects that look like they contain business values
        if (node.key.name === 'Personal' || node.key.name === 'Business' || node.key.name === 'Technical') {
          if (node.value.type === 'Literal' && TYPE_MULTIPLIERS.includes(node.value.value)) {
            context.report({
              node: node.value,
              messageId: 'hardcodedMultiplier',
              data: { value: node.value.value }
            });
          }
        }

        // Check for base value mappings
        if (node.key.type === 'Literal' && [1, 2, 3, 4, 5].includes(node.key.value)) {
          if (node.value.type === 'Literal' && MEMORY_BASE_VALUES.includes(node.value.value)) {
            context.report({
              node: node.value,
              messageId: 'hardcodedMemoryValue',
              data: { value: node.value.value }
            });
          }
        }
      },

      // Report at the end if GameConstants should be imported but isn't
      'Program:exit'() {
        const filename = context.getFilename();
        
        // Skip test files and GameConstants itself
        if (filename.includes('.test.') || 
            filename.includes('.spec.') || 
            filename.includes('GameConstants.js') ||
            filename.includes('eslint-rules') ||
            filename.includes('migrations') ||
            filename.includes('scripts')) {
          return;
        }

        // We don't report missing import here, just use it to provide better messages
      }
    };
  }
};