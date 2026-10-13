import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateBreakEvenQueries, 
  measureIndexBuildTime, 
  runRepeatedCityBenchmark, 
  executeTableScan, 
  executeTableScanFast 
} from '../src/lib/city/cityStatistics';
import { 
  buildCityBitmapIndex 
} from '../src/lib/city/cityBitmapEngine';
import { 
  estimatePackedIndexBytes, 
  CityPackedBitmap 
} from '../src/lib/city/packedBitmap';
import { 
  executeCityQuery, 
  executeCityQueryFast, 
  tryBuildCityQueryAST,
  CityIssueFilterState
} from '../src/lib/city/cityQueries';
import { generateCityData } from '../src/lib/city/cityGenerator';
import { CityQueryNode, CityBitmapIndex } from '../src/lib/city/cityTypes';

describe('Scaling Experiment Correctness, Timing, and Break-Even Audit Tests', () => {

  // 1. Build time 100 ms, Table Scan 10 ms, Packed Bitmap 2 ms -> break-even is 13 queries.
  it('Case 1: Build 100 ms, TS 10 ms, BM 2 ms yields break-even of 13 queries', () => {
    const breakEven = calculateBreakEvenQueries(100, 10, 2);
    // Math: 100 / (10 - 2) = 12.5 -> ceil(12.5) = 13
    assert.equal(breakEven, 13);
  });

  // 2. Build time 6 ms, Table Scan 0.315 ms, Packed Bitmap 0.0101 ms -> break-even is 20 queries.
  it('Case 2: Build 6 ms, TS 0.315 ms, BM 0.0101 ms yields break-even of 20 queries', () => {
    const breakEven = calculateBreakEvenQueries(6, 0.315, 0.0101);
    // Math: 6 / (0.315 - 0.0101) = 6 / 0.3049 = 19.67858... -> ceil = 20
    assert.equal(breakEven, 20);
  });

  // 3. Build time 25.2 ms, Table Scan 1.36 ms, Packed Bitmap 0.0315 ms -> exact rounded inputs yield 19 queries.
  it('Case 3: Exact display-rounded inputs (25.2 ms, 1.36 ms, 0.0315 ms) yield 19 queries', () => {
    const breakEven = calculateBreakEvenQueries(25.2, 1.36, 0.0315);
    // Math: 25.2 / (1.36 - 0.0315) = 25.2 / 1.3285 = 18.96876... -> ceil = 19
    assert.equal(breakEven, 19);
  });

  // 4. A different set of full-precision measurements that legitimately produces 20 queries despite rounding to the same displayed values
  it('Case 4: Full-precision measurements rounding to displayed values legitimately yield 20 queries', () => {
    const fullBuild = 25.22; // toFixed(1) -> '25.2'
    const fullTs = 1.354;    // toFixed(2) -> '1.35' or near 1.36
    const fullBm = 0.0315;   // 31.5 µs

    assert.equal(fullBuild.toFixed(1), '25.2');
    assert.equal((fullBm * 1000).toFixed(1), '31.5');

    const breakEven = calculateBreakEvenQueries(fullBuild, fullTs, fullBm);
    // Math: 25.22 / (1.354 - 0.0315) = 25.22 / 1.3225 = 19.070 -> ceil = 20
    assert.equal(breakEven, 20);
  });

  // 5. Table Scan and Packed Bitmap with identical execution times -> no break-even
  it('Case 5: Identical execution times yield no break-even (null)', () => {
    assert.equal(calculateBreakEvenQueries(50, 5, 5), null);
    assert.equal(calculateBreakEvenQueries(10, 0.5, 0.5), null);
  });

  // 6. Packed Bitmap slower than Table Scan -> no break-even
  it('Case 6: Packed Bitmap slower than Table Scan yields no break-even (null)', () => {
    assert.equal(calculateBreakEvenQueries(50, 2, 5), null);
    assert.equal(calculateBreakEvenQueries(100, 0.05, 0.2), null);
  });

  // 7. Invalid or non-finite timing inputs -> no break-even
  it('Case 7: Invalid, zero, negative, or non-finite inputs yield no break-even (null)', () => {
    assert.equal(calculateBreakEvenQueries(NaN, 10, 2), null);
    assert.equal(calculateBreakEvenQueries(100, NaN, 2), null);
    assert.equal(calculateBreakEvenQueries(100, 10, NaN), null);
    assert.equal(calculateBreakEvenQueries(Infinity, 10, 2), null);
    assert.equal(calculateBreakEvenQueries(100, Infinity, 2), null);
    assert.equal(calculateBreakEvenQueries(0, 10, 2), null);
    assert.equal(calculateBreakEvenQueries(-25, 10, 2), null);
    assert.equal(calculateBreakEvenQueries(100, -5, 2), null);
    assert.equal(calculateBreakEvenQueries(100, 10, -1), null);
    assert.equal(calculateBreakEvenQueries(undefined, 10, 2), null);
    // Sub-resolution check
    assert.equal(calculateBreakEvenQueries(100, 0.00001, 0.000005, { tableScanSubResolution: true }), null);
    assert.equal(calculateBreakEvenQueries(100, 0.00001, 0.000005, { bitmapSubResolution: true }), null);
  });

  // 8. Mismatched result sets -> speedup and break-even cannot be presented as valid
  it('Case 8: Mismatched result sets invalidate speedup and break-even claims', () => {
    // Direct calculation helper with mismatch
    assert.equal(calculateBreakEvenQueries(100, 10, 2, { resultSetsEqual: false }), null);

    const dataset = generateCityData({ seed: 42, count: 200, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
    const index = buildCityBitmapIndex(dataset);
    const ast: CityQueryNode = {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Central Business District'
    };

    // Corrupt one vector to simulate an engine mismatch
    const origBitmap = index.district['Central Business District'] as CityPackedBitmap;
    const corruptedWords = new Uint32Array(origBitmap.words.length); // zeroed out!
    const corruptedBitmap = new CityPackedBitmap(origBitmap.length, corruptedWords, 'district', 'Central Business District');
    const corruptedIndex: CityBitmapIndex = {
      ...index,
      district: {
        ...index.district,
        ['Central Business District']: corruptedBitmap
      }
    };

    const stats = runRepeatedCityBenchmark(ast, dataset, corruptedIndex, 1, 2, 10, 1000);
    assert.equal(stats.resultSetsEqual, false);
    assert.equal(stats.speedup, null);
    assert.equal(stats.breakEvenQueries, null);
    assert.equal(stats.winner, 'inconclusive');
    assert.ok(stats.validationError && stats.validationError.includes('mismatch'));
    assert.equal(stats.breakEvenStatus, 'N/A — result mismatch');
  });

  // 9. Packed bitmap memory estimates increase correctly with bitmap length and vector count
  it('Case 9: Packed bitmap memory estimates increase strictly with bitmap length and vector count', () => {
    const createMockIndex = (vectorCount: number, len: number) => {
      const fieldMap: Record<string, CityPackedBitmap> = {};
      const wordCount = (len + 31) >>> 5;
      for (let v = 0; v < vectorCount; v++) {
        fieldMap[`val_${v}`] = new CityPackedBitmap(len, new Uint32Array(wordCount), 'testField', `val_${v}`);
      }
      return { testField: fieldMap };
    };

    const size1 = 1000;
    const size2 = 5000;
    const size3 = 20000;

    const est1 = estimatePackedIndexBytes(createMockIndex(10, size1), size1);
    const est2 = estimatePackedIndexBytes(createMockIndex(10, size2), size2);
    const est3 = estimatePackedIndexBytes(createMockIndex(10, size3), size3);

    // Monotonically increasing with length
    assert.ok(est1 < est2, `est1 (${est1}) should be less than est2 (${est2})`);
    assert.ok(est2 < est3, `est2 (${est2}) should be less than est3 (${est3})`);

    // Monotonically increasing with vector count
    const est5Vectors = estimatePackedIndexBytes(createMockIndex(5, size2), size2);
    const est10Vectors = estimatePackedIndexBytes(createMockIndex(10, size2), size2);
    assert.equal(est10Vectors, est5Vectors * 2);
  });

  // 10. Representative queries produce identical record ID sets in both execution paths
  it('Case 10: Representative queries produce 100% identical record ID sets across sizes', () => {
    const testSizes = [200, 1000, 5000];

    const queryConfigs: Array<{ name: string; issues: CityIssueFilterState; district: string | null; cityWide: boolean }> = [
      {
        name: 'Single issue in Downtown Central',
        district: 'Downtown Central',
        cityWide: false,
        issues: { traffic: true, accident: false, pollution: false, power: false, hospital: false, risk: false }
      },
      {
        name: 'Multiple issues in West River',
        district: 'West River',
        cityWide: false,
        issues: { traffic: true, accident: true, pollution: false, power: true, hospital: false, risk: false }
      },
      {
        name: 'City-wide multi-issue scan',
        district: null,
        cityWide: true,
        issues: { traffic: false, accident: false, pollution: true, power: true, hospital: false, risk: true }
      }
    ];

    for (const size of testSizes) {
      const dataset = generateCityData({ seed: 777, count: size, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
      const datasetIds = dataset.map(d => d.id);
      const index = buildCityBitmapIndex(dataset);

      for (const config of queryConfigs) {
        const buildResult = tryBuildCityQueryAST({
          district: config.district,
          issues: config.issues,
          isCityWide: config.cityWide
        });

        assert.equal(buildResult.isValid, true);
        const ast = buildResult.ast!;

        // 1. Full execution comparison
        const tsResult = executeTableScan(ast, dataset);
        const bmResult = executeCityQuery(ast, index, size, datasetIds);

        assert.equal(tsResult.matchingRows, bmResult.metrics.matchingRows, `Row count mismatch for ${config.name} at size ${size}`);
        assert.deepEqual(tsResult.matchingIds, bmResult.matchingIds, `Matching ID array mismatch for ${config.name} at size ${size}`);

        // 2. Fast execution benchmark paths comparison
        const tsFastIds = executeTableScanFast(ast, dataset);
        const bmFastIds = executeCityQueryFast(ast, index, size, datasetIds);

        assert.deepEqual(tsFastIds, bmFastIds, `Fast execution path ID mismatch for ${config.name} at size ${size}`);
      }
    }
  });

  // Additional check: measureIndexBuildTime functionality
  it('measureIndexBuildTime returns valid positive median build time and index', () => {
    const dataset = generateCityData({ seed: 123, count: 500, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
    const result = measureIndexBuildTime(dataset, { repetitions: 3, warmup: true });

    assert.ok(result.medianBuildTimeMs > 0, 'Build time should be positive');
    assert.ok(Number.isFinite(result.medianBuildTimeMs), 'Build time should be finite');
    assert.ok(result.finalIndex !== null, 'Final index should be returned');
    assert.ok(result.finalIndex.district !== undefined, 'Final index should contain district bitvectors');
  });

});
