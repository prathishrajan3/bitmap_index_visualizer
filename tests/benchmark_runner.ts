import { generateCityData } from '../src/lib/city/cityGenerator';
import { buildCityBitmapIndex, estimatePackedIndexBytes } from '../src/lib/city/cityBitmapEngine';
import { runRepeatedCityBenchmark } from '../src/lib/city/cityStatistics';
import { CityQueryNode } from '../src/lib/city/cityTypes';

const queries: Record<string, { query: CityQueryNode; desc: string }> = {
  'Workload A (Complex)': {
    desc: "district = 'Central Business District' AND (trafficLevel = 'Severe' OR riskLevel = 'Critical')",
    query: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: {
        type: 'logical',
        operator: 'OR',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    }
  },
  'Workload B (Selective)': {
    desc: "incidentType = 'Fire' AND emergencyPriority = 'Critical'",
    query: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Fire' },
      right: { type: 'predicate', column: 'emergencyPriority', operator: '=', value: 'Critical' }
    }
  },
  'Workload C (Broad)': {
    desc: "trafficLevel = 'Severe' OR roadType = 'Arterial'",
    query: {
      type: 'logical',
      operator: 'OR',
      left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
      right: { type: 'predicate', column: 'roadType', operator: '=', value: 'Arterial' }
    }
  }
};

const sizes = [2000, 5000, 10000, 20000, 30000, 50000, 100000, 250000];

async function main() {
  for (const [wName, wObj] of Object.entries(queries)) {
    console.log(`\n======================================================`);
    console.log(`${wName}: ${wObj.desc}`);
    console.log(`======================================================`);

    for (const size of sizes) {
      const t0 = performance.now();
      const data = generateCityData({ seed: 999, count: size, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
      const tGen = performance.now() - t0;

      const tB0 = performance.now();
      const idx = buildCityBitmapIndex(data);
      const tBuild = performance.now() - tB0;

      const mem = estimatePackedIndexBytes(idx);
      const res = runRepeatedCityBenchmark(wObj.query, data, idx, 5, 15, tBuild, mem);
      
      console.log(
        size.toString().padStart(7) + ' rows | ' +
        'TS: ' + res.tableScanMedianMs.toFixed(3).padStart(7) + 'ms | ' +
        'BM: ' + res.bitmapMedianMs.toFixed(3).padStart(7) + 'ms | ' +
        'Speedup: ' + (res.speedup ? res.speedup.toFixed(2) + 'x' : 'N/A').padStart(7) + ' | ' +
        'Winner: ' + res.winner.padEnd(12) + ' | ' +
        'Eq: ' + (res.resultSetsEqual ? 'PASS' : 'FAIL') + ' | ' +
        'Batches: ' + `TS:${res.tableScanBatchSize} BM:${res.bitmapBatchSize}`.padEnd(18) + ' | ' +
        'Build: ' + tBuild.toFixed(1).padStart(5) + 'ms | ' +
        'BreakEven: ' + (res.breakEvenQueries ? res.breakEvenQueries + ' q' : 'N/A')
      );
    }
  }
}

main().catch(console.error);
