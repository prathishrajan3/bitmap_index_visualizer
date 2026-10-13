import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  tryBuildCityQueryAST, 
  buildCityQueryAST, 
  CityIssueFilterState,
  DEFAULT_CITY_ISSUE_FILTERS 
} from '../src/lib/city/cityQueries';
import { generateCityData } from '../src/lib/city/cityGenerator';
import { buildCityBitmapIndex } from '../src/lib/city/cityBitmapEngine';
import { runRepeatedCityBenchmark, executeTableScan, executeTableScanFast } from '../src/lib/city/cityStatistics';
import { executeCityQuery, executeCityQueryFast } from '../src/lib/city/cityQueries';
import { CityQueryNode } from '../src/lib/city/cityTypes';

describe('Performance Lab Dynamic Query Builder & Scaling Benchmark Integration', () => {

  // Test A — District selection
  it('Test A: District selection with single issue produces district AND issue AST', () => {
    const issues: CityIssueFilterState = {
      traffic: true,
      accident: false,
      pollution: false,
      power: false,
      hospital: false,
      risk: false
    };

    const res = tryBuildCityQueryAST({
      district: 'East Transit Hub',
      issues,
      isCityWide: false
    });

    assert.equal(res.isValid, true);
    assert.ok(res.ast !== null);
    
    // Structure: AND( district = 'East Transit Hub', trafficLevel = 'Severe' )
    const ast = res.ast as any;
    assert.equal(ast.type, 'logical');
    assert.equal(ast.operator, 'AND');
    assert.deepEqual(ast.left, {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'East Transit Hub'
    });
    assert.deepEqual(ast.right, {
      type: 'predicate',
      column: 'trafficLevel',
      operator: '=',
      value: 'Severe'
    });
  });

  // Test B — Multiple issue selections
  it('Test B: Multiple issue selections combines issues with OR tree under district AND', () => {
    const issues: CityIssueFilterState = {
      traffic: true,
      accident: true,
      pollution: false,
      power: true,
      hospital: false,
      risk: false
    };

    const res = tryBuildCityQueryAST({
      district: 'East Transit Hub',
      issues,
      isCityWide: false
    });

    assert.equal(res.isValid, true);
    assert.ok(res.ast !== null);
    
    const ast = res.ast as any;
    assert.equal(ast.type, 'logical');
    assert.equal(ast.operator, 'AND');
    assert.equal(ast.left.column, 'district');
    assert.equal(ast.left.value, 'East Transit Hub');

    // The right node is a binary OR tree containing trafficLevel=Severe, incidentType=Accident, powerStatus=Failure
    const right = ast.right;
    assert.equal(right.type, 'logical');
    assert.equal(right.operator, 'OR');
    
    // Check summary format
    assert.ok(res.summary.includes('District: East Transit Hub'));
    assert.ok(res.summary.includes('Severe Traffic'));
    assert.ok(res.summary.includes('Accidents'));
    assert.ok(res.summary.includes('Power Failure'));
  });

  // Test C — Change selections dynamically
  it('Test C: Changing selections produces distinct ASTs and reflects the updated query', () => {
    // 1st run: East Transit Hub + Severe Traffic
    const run1 = tryBuildCityQueryAST({
      district: 'East Transit Hub',
      issues: {
        traffic: true,
        accident: false,
        pollution: false,
        power: false,
        hospital: false,
        risk: false
      },
      isCityWide: false
    });

    // 2nd run: Medical District + Hospital Overload & High Pollution
    const run2 = tryBuildCityQueryAST({
      district: 'Medical District',
      issues: {
        traffic: false,
        accident: false,
        pollution: true,
        power: false,
        hospital: true,
        risk: false
      },
      isCityWide: false
    });

    assert.notDeepEqual(run1.ast, run2.ast);
    assert.equal((run1.ast as any).left.value, 'East Transit Hub');
    assert.equal((run2.ast as any).left.value, 'Medical District');
    assert.equal(run1.selectedIssuesCount, 1);
    assert.equal(run2.selectedIssuesCount, 2);
    assert.notEqual(run1.summary, run2.summary);
  });

  // Test D — City-wide scan
  it('Test D: City-wide scan omits district predicate and retains issue OR tree', () => {
    const issues: CityIssueFilterState = {
      traffic: true,
      accident: true,
      pollution: false,
      power: false,
      hospital: false,
      risk: false
    };

    const res = tryBuildCityQueryAST({
      district: 'Central Business District', // Should be ignored when isCityWide is true
      issues,
      isCityWide: true
    });

    assert.equal(res.isValid, true);
    assert.ok(res.ast !== null);

    const ast = res.ast as any;
    // Must be OR(trafficLevel=Severe, incidentType=Accident) without an outer AND(district=...)
    assert.equal(ast.type, 'logical');
    assert.equal(ast.operator, 'OR');
    assert.equal(ast.left.column, 'trafficLevel');
    assert.equal(ast.right.column, 'incidentType');
    assert.ok(res.summary.startsWith('Scope: City-Wide'));
  });

  // Test E — No issues selected validation
  it('Test E: Rejects configuration when no issue types are selected without silent substitution', () => {
    const allFalse: CityIssueFilterState = {
      traffic: false,
      accident: false,
      pollution: false,
      power: false,
      hospital: false,
      risk: false
    };

    const res = tryBuildCityQueryAST({
      district: 'Central Business District',
      issues: allFalse,
      isCityWide: false
    });

    assert.equal(res.isValid, false);
    assert.equal(res.ast, null);
    assert.ok(res.error && res.error.includes('No issue types selected'));

    // Verify buildCityQueryAST throws rather than silently substituting Critical Risk
    assert.throws(() => {
      buildCityQueryAST({
        district: 'Central Business District',
        issues: allFalse,
        isCityWide: false
      });
    }, /No issue types selected/);
  });

  // Test F — Correctness at scale with dynamic query
  it('Test F: Standard scaling sizes evaluate dynamic AST with 100% result equivalence', () => {
    const testSizes = [2000, 5000, 10000];
    const dynamicAST = buildCityQueryAST({
      district: 'Central Business District',
      issues: {
        traffic: true,
        accident: true,
        pollution: false,
        power: false,
        hospital: false,
        risk: false
      },
      isCityWide: false
    });

    for (const size of testSizes) {
      const data = generateCityData({ seed: 777 + size, count: size, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
      const index = buildCityBitmapIndex(data);

      const stats = runRepeatedCityBenchmark(dynamicAST, data, index, 2, 3);
      assert.equal(stats.resultSetsEqual, true, `Result set mismatch at size ${size}`);
      assert.equal(stats.totalRows, size);
      assert.ok(stats.matchingRows >= 0);
      assert.ok(stats.tableScanMedianMs > 0);
      assert.ok(stats.bitmapMedianMs > 0);
      assert.ok(['bitmap', 'table_scan', 'tie', 'inconclusive'].includes(stats.winner));
    }
  });

  // Test G — Extended suite execution
  it('Test G: Extended scale suite correctly executes dynamic AST up to 50,000 records', () => {
    const dynamicAST = buildCityQueryAST({
      district: 'North Industrial Zone',
      issues: {
        traffic: false,
        accident: false,
        pollution: true,
        power: true,
        hospital: false,
        risk: false
      },
      isCityWide: false
    });

    const data = generateCityData({ seed: 999, count: 50000, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
    const index = buildCityBitmapIndex(data);

    const stats = runRepeatedCityBenchmark(dynamicAST, data, index, 2, 3);
    assert.equal(stats.resultSetsEqual, true);
    assert.equal(stats.totalRows, 50000);
    assert.ok(stats.bitmapMedianMs < stats.tableScanMedianMs);
    assert.equal(stats.winner, 'bitmap');
    assert.ok(stats.speedup && stats.speedup > 1.0);
  });
});
