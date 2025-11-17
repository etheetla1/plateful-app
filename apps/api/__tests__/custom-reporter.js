/**
 * Custom Jest reporter for cleaner, document-friendly test output
 * Formats test results in a way that looks good when pasted into documents
 */
class CustomReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.results = [];
    this.startTime = Date.now();
  }

  onRunStart(results, options) {
    this.startTime = Date.now();
    console.log('\n' + '='.repeat(80));
    console.log('🧪 PLATEFUL API TEST SUITE');
    console.log('='.repeat(80));
    console.log(`Started: ${new Date().toLocaleString()}\n`);
  }

  onTestResult(test, testResult, aggregatedResult) {
    const suiteName = testResult.testFilePath
      .split(/[/\\]/)
      .pop()
      .replace('.test.ts', '')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const passed = testResult.numPassingTests || 0;
    const failed = testResult.numFailingTests || 0;
    const total = testResult.numTests || (passed + failed);
    const status = failed > 0 ? '❌' : '✅';

    console.log(`${status} ${suiteName}`);
    console.log(`   Tests: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
    
    if (testResult.testResults && testResult.testResults.length > 0) {
      testResult.testResults.forEach((result) => {
        const icon = result.status === 'passed' ? '  ✓' : '  ✗';
        const testName = result.title
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        const duration = result.duration ? ` (${result.duration}ms)` : '';
        console.log(`${icon} ${testName}${duration}`);
        
        // Show failure details if test failed
        if (result.status === 'failed' && result.failureMessages) {
          result.failureMessages.forEach((msg, idx) => {
            const lines = msg.split('\n').slice(0, 3); // Show first 3 lines of error
            console.log(`      Error: ${lines[0]}`);
          });
        }
      });
    }
    
    console.log('');
    this.results.push({ suiteName, passed, failed, total, status });
  }

  onRunComplete(contexts, results) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const totalTests = results.numTotalTests;
    const passedTests = results.numPassedTests;
    const failedTests = results.numFailedTests;
    const totalSuites = results.numTotalTestSuites;
    const passedSuites = results.numPassedTestSuites;
    const failedSuites = results.numFailedTestSuites;
    
    console.log('');
    console.log(`Test Suites: ${passedSuites} passed, ${failedSuites} failed, ${totalSuites} total`);
    console.log(`Tests:       ${passedTests} passed, ${failedTests} failed, ${totalTests} total`);
    console.log(`Duration:    ${duration}s`);
    console.log(`Completed:  ${new Date().toLocaleString()}`);
    
    if (failedTests > 0 || failedSuites > 0) {
      console.log('\n❌ Some tests failed. Review the details above for error information.');
    } else {
      console.log('\n✅ All tests passed successfully!');
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

module.exports = CustomReporter;

