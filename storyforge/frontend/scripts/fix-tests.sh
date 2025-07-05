#!/bin/bash
# Test stability fix script
# Safe approach to diagnose and fix test memory issues

echo "🧹 Cleaning up test environment..."

# Clear Jest cache
echo "Clearing Jest cache..."
npx jest --clearCache

# Clear node_modules/.cache if it exists
if [ -d "node_modules/.cache" ]; then
    echo "Clearing node_modules cache..."
    rm -rf node_modules/.cache
fi

# Check current memory usage
echo -e "\n📊 Current system memory:"
free -h

# Test the smallest test file first
echo -e "\n🧪 Testing single store file with memory monitoring..."
node --expose-gc --max-old-space-size=512 \
  ./node_modules/.bin/jest \
  --logHeapUsage \
  --runInBand \
  --no-coverage \
  src/stores/__tests__/journeyIntelligenceStore.test.js

if [ $? -eq 0 ]; then
    echo -e "\n✅ Store test passed! Memory usage acceptable."
    
    echo -e "\n🧪 Testing single component with memory monitoring..."
    node --expose-gc --max-old-space-size=512 \
      ./node_modules/.bin/jest \
      --logHeapUsage \
      --runInBand \
      --no-coverage \
      --testNamePattern="AdaptiveGraphCanvas aggregation"
      
    if [ $? -eq 0 ]; then
        echo -e "\n✅ Component test passed! We can proceed with cleanup implementation."
    else
        echo -e "\n❌ Component test failed. Memory issues in component tests."
    fi
else
    echo -e "\n❌ Store test failed. Critical memory issues even in simple tests."
fi

echo -e "\n📋 Next steps:"
echo "1. Implement afterEach cleanup in all test files"
echo "2. Update jest.config.cjs with memory limits"
echo "3. Fix QueryClient cleanup pattern"
echo "4. Run this script again to verify fixes"