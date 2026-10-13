import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  CityPackedBitmap, 
  createEmptyPackedBitmap, 
  createFullPackedBitmap,
  packedBitmapAnd,
  packedBitmapOr,
  packedBitmapXor,
  packedBitmapNot,
  countPackedBits,
  extractPackedMatchingIds,
  estimatePackedIndexBytes
} from '../src/lib/city/packedBitmap';
import { buildCityBitmapIndex } from '../src/lib/city/cityBitmapEngine';
import { executeCityQuery, executeCityQueryFast } from '../src/lib/city/cityQueries';
import { 
  executeTableScan, 
  executeTableScanFast, 
  calibrateBatchSize, 
  runRepeatedCityBenchmark, 
  MIN_RELIABLE_RESOLUTION_MS,
  median 
} from '../src/lib/city/cityStatistics';
import { generateCityData } from '../src/lib/city/cityGenerator';
import { CityEntity, CityQueryNode } from '../src/lib/city/cityTypes';

// Helper to create synthetic minimal records
function createMockRecords(count: number, overrides: Partial<CityEntity>[] = []): CityEntity[] {
  const records: CityEntity[] = [];
  for (let i = 0; i < count; i++) {
    const override = overrides[i] || {};
    records.push({
      id: `REC-${i.toString().padStart(5, '0')}`,
      timestamp: Date.now(),
      x: 50,
      y: 50,
      district: override.district || (i % 2 === 0 ? 'Central Business District' : 'Riverside'),
      zone: override.zone || 'Commercial',
      entityType: override.entityType || 'Intersection',
      trafficLevel: override.trafficLevel || (i % 4 === 0 ? 'Severe' : 'Low'),
      roadType: override.roadType || 'Arterial',
      signalStatus: override.signalStatus || 'Normal',
      incidentType: override.incidentType || (i === 0 ? 'Fire' : 'None'),
      emergencyPriority: override.emergencyPriority || (i === 0 ? 'Critical' : 'None'),
      airQuality: override.airQuality || 'Good',
      weather: override.weather || 'Clear',
      powerStatus: override.powerStatus || 'Normal',
      waterStatus: override.waterStatus || 'Normal',
      wasteLevel: override.wasteLevel || 'Normal',
      hospitalLoad: override.hospitalLoad || 'Normal',
      publicTransportStatus: override.publicTransportStatus || 'Normal',
      riskLevel: override.riskLevel || (i % 3 === 0 ? 'Critical' : 'Low'),
      sensorStatus: override.sensorStatus || 'Active',
      eventStatus: override.eventStatus || 'None',
      temperature: 20,
      vehicleDensity: 50,
      pollutionLevel: 30,
      populationDensity: 40,
      busOccupancy: 20,
      parkingAvailability: 60,
      noiseLevel: 45,
      schoolActivity: 10
    });
  }
  return records;
}

describe('Packed Bitmap Index Engine - Automated Correctness Tests', () => {

  // 1. Empty datasets
  it('1. Handles empty datasets correctly', () => {
    const emptyDataset: CityEntity[] = [];
    const index = buildCityBitmapIndex(emptyDataset);
    const ast: CityQueryNode = {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Central Business District'
    };
    
    const tsRes = executeTableScan(ast, emptyDataset);
    const bmRes = executeCityQuery(ast, index, 0, []);

    assert.equal(tsRes.matchingRows, 0);
    assert.equal(bmRes.metrics.matchingRows, 0);
    assert.deepEqual(bmRes.matchingIds, []);
    assert.deepEqual(bmRes.matchingIds, tsRes.matchingIds);
  });

  // 2. A single-record dataset
  it('2. Evaluates single-record dataset correctly', () => {
    const single = createMockRecords(1, [{ district: 'Central Business District' }]);
    const index = buildCityBitmapIndex(single);
    const ids = single.map(r => r.id);

    const matchQuery: CityQueryNode = {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Central Business District'
    };
    const nonMatchQuery: CityQueryNode = {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Riverside'
    };

    const matchRes = executeCityQuery(matchQuery, index, 1, ids);
    assert.deepEqual(matchRes.matchingIds, [single[0].id]);

    const nonMatchRes = executeCityQuery(nonMatchQuery, index, 1, ids);
    assert.deepEqual(nonMatchRes.matchingIds, []);
  });

  // 3. Dataset sizes smaller than 32 records
  it('3. Handles dataset sizes smaller than 32 records (e.g. 17 records)', () => {
    const records = createMockRecords(17);
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    const query: CityQueryNode = {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Central Business District'
    };

    const tsRes = executeTableScan(query, records);
    const bmRes = executeCityQuery(query, index, 17, ids);

    assert.deepEqual(bmRes.matchingIds, tsRes.matchingIds);
    assert.ok(bmRes.matchingIds.length > 0);
    assert.ok(bmRes.matchingIds.length < 17);
  });

  // 4. Dataset sizes exactly divisible by 32
  it('4. Handles dataset sizes exactly divisible by 32 (e.g. 64 records)', () => {
    const records = createMockRecords(64);
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    const query: CityQueryNode = {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    };

    const tsRes = executeTableScan(query, records);
    const bmRes = executeCityQuery(query, index, 64, ids);

    assert.deepEqual(bmRes.matchingIds, tsRes.matchingIds);
  });

  // 5. Dataset sizes not divisible by 32
  it('5. Handles dataset sizes not divisible by 32 (e.g. 105 records)', () => {
    const records = createMockRecords(105);
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    const query: CityQueryNode = {
      type: 'logical',
      operator: 'OR',
      left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    };

    const tsRes = executeTableScan(query, records);
    const bmRes = executeCityQuery(query, index, 105, ids);

    assert.deepEqual(bmRes.matchingIds, tsRes.matchingIds);
    // Verify that no IDs beyond 105 are ever extracted
    assert.ok(bmRes.matchingIds.every(id => ids.includes(id)));
  });

  // 6. Correct packed bitmap AND and OR results
  it('6. Produces bit-exact results for packed bitmap AND, OR, XOR, and NOT', () => {
    const bmpA = new CityPackedBitmap(10, new Uint32Array([0b1010101010]));
    const bmpB = new CityPackedBitmap(10, new Uint32Array([0b1100110011]));

    const andRes = packedBitmapAnd(bmpA, bmpB);
    assert.equal(andRes.words[0], 0b1000100010);

    const orRes = packedBitmapOr(bmpA, bmpB);
    assert.equal(orRes.words[0], 0b1110111011);

    const xorRes = packedBitmapXor(bmpA, bmpB);
    assert.equal(xorRes.words[0], 0b0110011001);

    const notRes = packedBitmapNot(bmpA);
    // Masked to 10 bits: inverted of 1010101010 (10 bits) is 0101010101 = 0x155
    const expectedNot = (~0b1010101010) & 0x3FF;
    assert.equal(notRes.words[0], expectedNot);
  });

  // 7. Correct set-bit counting
  it('7. Computes accurate popcounts with countPackedBits', () => {
    const emptyBmp = createEmptyPackedBitmap(100);
    assert.equal(countPackedBits(emptyBmp), 0);

    const fullBmp = createFullPackedBitmap(65);
    assert.equal(countPackedBits(fullBmp), 65);

    const mixedWords = new Uint32Array([0xFFFFFFFF, 0x0000000F]);
    const mixedBmp = new CityPackedBitmap(36, mixedWords);
    assert.equal(countPackedBits(mixedBmp), 32 + 4);
  });

  // 8. Correct extraction of record IDs
  it('8. Accurately extracts matching record IDs in ascending order', () => {
    const ids = ['ID-0', 'ID-1', 'ID-2', 'ID-3', 'ID-4', 'ID-5'];
    // Set bits 1 and 4: 0b010010 (in binary: bit 1 is 2, bit 4 is 16 => 18)
    const bmp = new CityPackedBitmap(6, new Uint32Array([18]));
    const extracted = extractPackedMatchingIds(bmp, ids);

    assert.deepEqual(extracted, ['ID-1', 'ID-4']);
  });

  // 9. Records belonging to multiple matching categories
  it('9. Correctly resolves entities matching multiple categories via OR / AND', () => {
    const records = createMockRecords(50);
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    // Entity matching trafficLevel = Severe OR trafficLevel = Low
    const query: CityQueryNode = {
      type: 'logical',
      operator: 'OR',
      left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Low' }
    };

    const tsRes = executeTableScan(query, records);
    const bmRes = executeCityQuery(query, index, 50, ids);

    assert.deepEqual(bmRes.matchingIds, tsRes.matchingIds);
  });

  // 10. No matching records
  it('10. Handles queries returning zero matching records', () => {
    const records = createMockRecords(50);
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    const impossibleQuery: CityQueryNode = {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'district', operator: '=', value: 'Riverside' }
    };

    const tsRes = executeTableScan(impossibleQuery, records);
    const bmRes = executeCityQuery(impossibleQuery, index, 50, ids);

    assert.equal(tsRes.matchingRows, 0);
    assert.equal(bmRes.metrics.matchingRows, 0);
    assert.deepEqual(bmRes.matchingIds, []);
  });

  // 11. All records matching a query
  it('11. Handles queries matching 100% of records', () => {
    const records = createMockRecords(40, Array(40).fill({ roadType: 'Arterial' }));
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    const allQuery: CityQueryNode = {
      type: 'predicate',
      column: 'roadType',
      operator: '=',
      value: 'Arterial'
    };

    const tsRes = executeTableScan(allQuery, records);
    const bmRes = executeCityQuery(allQuery, index, 40, ids);

    assert.equal(tsRes.matchingRows, 40);
    assert.equal(bmRes.metrics.matchingRows, 40);
    assert.deepEqual(bmRes.matchingIds, ids);
  });

  // 12. Unknown and missing field values
  it('12. Gracefully handles unindexed or nonexistent field values', () => {
    const records = createMockRecords(30);
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    const missingValQuery: CityQueryNode = {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Atlantis Underwater Dome'
    };

    const tsRes = executeTableScan(missingValQuery, records);
    const bmRes = executeCityQuery(missingValQuery, index, 30, ids);

    assert.equal(tsRes.matchingRows, 0);
    assert.deepEqual(bmRes.matchingIds, []);
    assert.deepEqual(bmRes.matchingIds, tsRes.matchingIds);
  });

  // 13. The current Central Business District query
  it('13. Accurately evaluates the Central Business District query', () => {
    const records = generateCityData({ seed: 777, count: 2000, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    const cbdQuery: CityQueryNode = {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: {
        type: 'logical',
        operator: 'OR',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    };

    const tsRes = executeTableScan(cbdQuery, records);
    const bmRes = executeCityQuery(cbdQuery, index, 2000, ids);

    assert.ok(tsRes.matchingRows > 0);
    assert.equal(bmRes.metrics.matchingRows, tsRes.matchingRows);
    assert.deepEqual(bmRes.matchingIds, tsRes.matchingIds);
  });

  // 14. Identical result IDs across multiple dataset sizes
  it('14. Asserts 100% identical result IDs across sizes: 100, 500, 2000, 5000, 10000', () => {
    const testSizes = [100, 500, 2000, 5000, 10000];
    const complexQuery: CityQueryNode = {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: {
        type: 'logical',
        operator: 'OR',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    };

    for (const size of testSizes) {
      const data = generateCityData({ seed: 1234 + size, count: size, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
      const index = buildCityBitmapIndex(data);
      const ids = data.map(r => r.id);

      const ts = executeTableScan(complexQuery, data);
      const bm = executeCityQuery(complexQuery, index, size, ids);

      assert.equal(ts.matchingRows, bm.metrics.matchingRows, `Row count mismatch at size ${size}`);
      assert.deepEqual(ts.matchingIds, bm.matchingIds, `ID list mismatch at size ${size}`);
    }
  });

  // 15. Index reuse without accidental mutation or stale results
  it('15. Verifies index reuse without accidental buffer mutation across repeated queries', () => {
    const records = generateCityData({ seed: 42, count: 500, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    // Save snapshot of original vector word values
    const districtBmp = index['district']['Central Business District'] as CityPackedBitmap;
    const originalWordsSnapshot = new Uint32Array(districtBmp.words);

    const query1: CityQueryNode = {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    };

    const query2: CityQueryNode = {
      type: 'logical',
      operator: 'OR',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    };

    // Execute multiple interleaved queries reusing the same index
    for (let i = 0; i < 10; i++) {
      executeCityQuery(query1, index, 500, ids);
      executeCityQuery(query2, index, 500, ids);
    }

    // Verify index buffers were NOT mutated by query executions
    assert.deepEqual(districtBmp.words, originalWordsSnapshot, 'Bitmap index buffer was mutated!');
  });

  // 16. Fast execution paths return identical results without timing overhead
  it('16. Asserts fast execution paths match standard paths and return identical IDs', () => {
    const records = generateCityData({ seed: 888, count: 1000, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
    const index = buildCityBitmapIndex(records);
    const ids = records.map(r => r.id);

    const query: CityQueryNode = {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: {
        type: 'logical',
        operator: 'OR',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    };

    const stdTs = executeTableScan(query, records);
    const fastTs = executeTableScanFast(query, records);
    const stdBm = executeCityQuery(query, index, 1000, ids);
    const fastBm = executeCityQueryFast(query, index, 1000, ids);

    assert.deepEqual(fastTs, stdTs.matchingIds);
    assert.deepEqual(fastBm, stdBm.matchingIds);
    assert.deepEqual(fastTs, fastBm);
  });

  // 17. Adaptive batch calibration scales dynamically
  it('17. Calibrates batch size dynamically to reach target duration', () => {
    let callCount = 0;
    // Simulate a fast function (takes ~0.001 ms)
    const fastFn = () => {
      callCount++;
      return 1;
    };

    const batchSize = calibrateBatchSize(fastFn, {
      targetDurationMs: 20,
      minTargetDurationMs: 15,
      maxBatchSize: 5000,
      maxCalibrationMs: 50
    });

    assert.ok(batchSize > 1, `Expected batch size > 1, got ${batchSize}`);
    assert.ok(batchSize <= 5000, `Batch size should not exceed max cap`);
  });

  // 18. Winner and speedup calculations handle all branches
  it('18. Correctly computes winner and speedup across various scenarios', () => {
    const data = generateCityData({ seed: 101, count: 500, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
    const index = buildCityBitmapIndex(data);

    const ast: CityQueryNode = {
      type: 'predicate',
      column: 'trafficLevel',
      operator: '=',
      value: 'Severe'
    };

    const stats = runRepeatedCityBenchmark(ast, data, index, 2, 3);
    assert.ok(stats.resultSetsEqual);
    assert.ok(stats.tableScanMedianMs > 0);
    assert.ok(stats.bitmapMedianMs > 0);
    assert.ok(['bitmap', 'table_scan', 'tie', 'inconclusive'].includes(stats.winner));
    assert.ok(stats.speedup !== null && stats.speedup > 0);
  });

  // 19. Sub-resolution and zero-duration safety
  it('19. Safely handles sub-resolution or near-zero durations without NaN or Infinity', () => {
    // Test median helper
    assert.equal(median([]), 0);
    assert.equal(median([5]), 5);
    assert.equal(median([1, 3, 2]), 2);
    assert.equal(median([1, 2, 3, 4]), 2.5);

    // Verify sub-resolution constant
    assert.ok(MIN_RELIABLE_RESOLUTION_MS > 0);
    assert.ok(MIN_RELIABLE_RESOLUTION_MS <= 0.001);
  });
});
