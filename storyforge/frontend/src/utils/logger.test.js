// RED PHASE: Test that should FAIL because we have console.logs in production

describe('Production Logger - RED Phase', () => {
  const originalEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    // Clear module cache to ensure fresh import
    jest.resetModules();
  });
  
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('logger.system should NOT use console.log in production', () => {
    // Set production environment BEFORE importing
    process.env.NODE_ENV = 'production';
    
    // Import logger AFTER setting environment
    const logger = require('./logger').default;
    
    console.error('Current NODE_ENV:', process.env.NODE_ENV);
    console.error('Logger object:', Object.keys(logger));
    
    // Spy on console.log BEFORE calling logger
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
      console.error('CONSOLE.LOG WAS CALLED WITH:', args);
    });
    
    // Call logger.system which currently uses console.log even in production
    console.error('About to call logger.system...');
    logger.system('System message');
    console.error('Called logger.system');
    
    console.error('Spy call count:', consoleLogSpy.mock.calls.length);
    console.error('Spy calls:', consoleLogSpy.mock.calls);
    
    // This test should FAIL because logger.system uses console.log on line 69
    // In production, NO console.log should be used for security
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('[SYSTEM] System message');
    
    // Cleanup
    consoleLogSpy.mockRestore();
  });
});