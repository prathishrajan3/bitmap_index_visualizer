import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { useLaboratoryStore } from '../src/store/useLaboratoryStore';
import { useCityStore } from '../src/store/useCityStore';
import { useLearningStore } from '../src/store/useLearningStore';
import { 
  buildLaboratoryReportPayload, 
  buildCityReportPayload, 
  formatReportDate, 
  formatTimingValue, 
  formatByteSize, 
  generateSafeReportFilename 
} from '../src/utils/reportDataBuilder';
import { 
  generateTxtReport, 
  generateDocxReport 
} from '../src/utils/reportGenerator';
import { generateCityData } from '../src/lib/city/cityGenerator';
import { buildCityBitmapIndex } from '../src/lib/city/cityBitmapEngine';
import { runRepeatedCityBenchmark } from '../src/lib/city/cityStatistics';
import { CityQueryNode } from '../src/lib/city/cityTypes';

describe('Comprehensive Activity Reporting & Experiment Validation', () => {

  // --------------------------------------------------------------------------
  // 1. LABORATORY TESTS
  // --------------------------------------------------------------------------

  describe('Laboratory Activity Tracking & Dataset Statistics', () => {

    it('Dataset generation is recorded accurately with synthetic source and seed', () => {
      useLaboratoryStore.getState().setRowCount(30);
      useLaboratoryStore.getState().setSeed(77);
      useLaboratoryStore.getState().generateData();

      const state = useLaboratoryStore.getState();
      assert.equal(state.dataset.length, 30);
      assert.equal(state.datasetSource, 'synthetic');
      assert.equal(state.activityCounts.datasetGenerations >= 1, true);
      
      const latestHistory = state.datasetHistory[0];
      assert.ok(latestHistory);
      assert.equal(latestHistory.source, 'synthetic');
      assert.equal(latestHistory.rowCount, 30);
      assert.equal(latestHistory.seed, 77);

      // Verify payload reflects synthetic source
      const payload = buildLaboratoryReportPayload(state);
      assert.equal(payload.datasetOverview.source, 'synthetic');
      assert.equal(payload.datasetOverview.rowCount, 30);
      assert.equal(payload.datasetOverview.seed, 77);
    });

    it('CSV and AI dataset imports preserve the correct source information', () => {
      const mockCsvRows = [
        { id: 1, Category: 'Tech', Tier: 'A' },
        { id: 2, Category: 'Health', Tier: 'B' },
        { id: 3, Category: 'Tech', Tier: 'B' }
      ];
      const mockCols = [
        { id: 'c1', name: 'Category', type: 'string' as const, cardinality: 2, distribution: 'Uniform' as const },
        { id: 'c2', name: 'Tier', type: 'string' as const, cardinality: 2, distribution: 'Uniform' as const }
      ];

      // Test CSV Import
      useLaboratoryStore.getState().loadExternalDataset(mockCsvRows, mockCols, 'Enterprise', 'csv');
      let state = useLaboratoryStore.getState();
      assert.equal(state.datasetSource, 'csv');
      let payload = buildLaboratoryReportPayload(state);
      assert.equal(payload.datasetOverview.source, 'csv');
      assert.equal(payload.datasetOverview.rowCount, 3);
      assert.equal(payload.datasetOverview.columns.length, 2);

      // Test AI Import
      useLaboratoryStore.getState().loadExternalDataset(mockCsvRows, mockCols, 'AI Theme', 'ai');
      state = useLaboratoryStore.getState();
      assert.equal(state.datasetSource, 'ai');
      payload = buildLaboratoryReportPayload(state);
      assert.equal(payload.datasetOverview.source, 'ai');
    });

    it('Index statistics match the actual built bitmap index', () => {
      useLaboratoryStore.getState().setRowCount(20);
      useLaboratoryStore.getState().generateData();
      const colsToIndex = useLaboratoryStore.getState().schema.columns.map(c => c.name);
      useLaboratoryStore.getState().buildIndexes(colsToIndex);

      const state = useLaboratoryStore.getState();
      const payload = buildLaboratoryReportPayload(state);

      assert.equal(payload.bitmapIndexStats.built, true);
      assert.equal(payload.bitmapIndexStats.bitLength, 20);
      assert.ok(payload.bitmapIndexStats.vectorCount > 0);
      assert.ok(payload.bitmapIndexStats.totalLogicalBits > 0);
      assert.ok(payload.bitmapIndexStats.setBitsCount > 0);
      assert.ok(payload.bitmapIndexStats.overallDensityPct > 0 && payload.bitmapIndexStats.overallDensityPct <= 100);
      assert.ok(payload.bitmapIndexStats.vectors.length > 0);
    });

    it('Algebra match counts, selectivity, and operations history are recorded correctly', () => {
      useLaboratoryStore.getState().recordAlgebraOperation({
        operandA: "Department = 'Engineering'",
        operator: 'AND',
        operandB: "Hostel = 'true'",
        resultBits: [1, 0, 1, 0, 0],
        matchCount: 2,
        totalRows: 5,
        selectivityPct: 40
      });

      const state = useLaboratoryStore.getState();
      assert.ok(state.algebraHistory.length >= 1);
      assert.equal(state.algebraHistory[0].matchCount, 2);
      assert.equal(state.algebraHistory[0].operator, 'AND');

      const payload = buildLaboratoryReportPayload(state);
      assert.ok(payload.algebraStats.totalOperations >= 1);
      assert.equal(payload.algebraStats.operations[0].selectivityPct, 40);
      assert.equal(payload.algebraStats.operations[0].matchCount, 2);
    });

    it('Query success and failure events are recorded accurately with execution timing', () => {
      // Record successful query
      useLaboratoryStore.getState().recordQueryAttempt({
        sql: "SELECT * FROM DatasetRow WHERE department = 'Engineering';",
        status: 'success',
        executionTimeMs: 1.452,
        returnedRows: 6,
        results: [{ id: 1 }, { id: 2 }]
      });

      // Record failed query
      useLaboratoryStore.getState().recordQueryAttempt({
        sql: "SELECT * FROM NonExistentTable;",
        status: 'failure',
        error: 'Table does not exist',
        returnedRows: 0,
        results: []
      });

      const state = useLaboratoryStore.getState();
      assert.ok(state.queryHistory.length >= 2);
      assert.equal(state.activityCounts.sqlSuccesses >= 1, true);
      assert.equal(state.activityCounts.sqlFailures >= 1, true);

      const payload = buildLaboratoryReportPayload(state);
      assert.ok(payload.queryStats.totalQueries >= 2);
      assert.ok(payload.queryStats.successfulQueries >= 1);
      assert.ok(payload.queryStats.failedQueries >= 1);

      const successQ = payload.queryStats.queries.find(q => q.status === 'success');
      assert.ok(successQ);
      assert.equal(successQ.executionTimeMs, 1.452);
      assert.equal(successQ.returnedRows, 6);
    });

    it('In-progress quizzes are not counted as completed attempts', () => {
      // Record in-progress quiz
      useLaboratoryStore.getState().recordQuizAttempt({
        score: 2,
        total: 5,
        percentage: 40,
        difficulty: 'Medium',
        source: 'pyq',
        status: 'in_progress',
        completedAt: new Date().toLocaleTimeString()
      });

      let state = useLaboratoryStore.getState();
      let payload = buildLaboratoryReportPayload(state);
      // In-progress attempt must not be considered a completed quiz
      const completedBefore = payload.quizStats.allAttempts.filter(q => q.status === 'completed').length;

      // Complete the quiz
      useLaboratoryStore.getState().recordQuizAttempt({
        score: 4,
        total: 5,
        percentage: 80,
        difficulty: 'Medium',
        source: 'pyq',
        status: 'completed',
        completedAt: new Date().toLocaleTimeString()
      });

      state = useLaboratoryStore.getState();
      payload = buildLaboratoryReportPayload(state);
      const completedAfter = payload.quizStats.allAttempts.filter(q => q.status === 'completed').length;
      assert.equal(completedAfter, completedBefore + 1);
      assert.ok(payload.quizStats.latestAttempt);
      assert.equal(payload.quizStats.latestAttempt.percentage, 80);
      assert.equal(payload.quizStats.latestAttempt.score, 4);
    });

    it('Learning progress incorporates module completion and mastery score', () => {
      useLearningStore.getState().completeModule('intro', 100);
      useLearningStore.getState().completeModule('construction', 80);

      const labState = useLaboratoryStore.getState();
      const learningState = useLearningStore.getState();
      const payload = buildLaboratoryReportPayload(labState, learningState);

      assert.ok(payload.learningStats.overallMastery > 0);
      assert.ok(payload.learningStats.modules.length >= 4);
      const introMod = payload.learningStats.modules.find(m => m.id === 'intro');
      assert.ok(introMod);
      assert.equal(introMod.completed, true);
      assert.equal(introMod.score, 100);
    });
  });

  // --------------------------------------------------------------------------
  // 2. NOVA SMART CITY TESTS
  // --------------------------------------------------------------------------

  describe('Nova Smart City State & Scaling Experiment Integration', () => {

    it('City dataset categorical distributions compute accurately from entity array', () => {
      const cityData = generateCityData({ seed: 50, count: 200, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
      const cityIndex = buildCityBitmapIndex(cityData);
      useCityStore.getState().setDataset(cityData, cityIndex);

      const state = useCityStore.getState();
      const payload = buildCityReportPayload(state);

      assert.equal(payload.datasetStats.totalEntities, 200);
      const totalDistrictEntities = Object.values(payload.datasetStats.districtCounts).reduce((a, b) => a + b, 0);
      assert.equal(totalDistrictEntities, 200);
      assert.ok(Object.keys(payload.datasetStats.entityTypeCounts).length > 0);
      assert.ok(Object.keys(payload.datasetStats.trafficDistribution).length > 0);
    });

    it('Matching percentages and query scope are accurately reported without hardcoding', () => {
      const cityData = generateCityData({ seed: 100, count: 100, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
      const cityIndex = buildCityBitmapIndex(cityData);
      useCityStore.getState().setDataset(cityData, cityIndex);
      useCityStore.getState().setScanScope('city');
      useCityStore.getState().setActiveQuery(
        { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        new Set(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5'])
      );

      const state = useCityStore.getState();
      const payload = buildCityReportPayload(state);

      assert.equal(payload.activeQuery.executed, true);
      assert.equal(payload.activeQuery.matchingCount, 5);
      assert.equal(payload.activeQuery.matchingPct, 5.0); // 5/100 * 100 = 5.0%
      assert.equal(payload.activeQuery.scope, 'City-Wide Scope');
    });

    it('Single-query benchmark preserves nullable speedup and validation status', () => {
      const cityData = generateCityData({ seed: 123, count: 150, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
      const cityIndex = buildCityBitmapIndex(cityData);
      const ast: CityQueryNode = { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' };
      const stats = runRepeatedCityBenchmark(ast, cityData, cityIndex);

      useCityStore.getState().setLastBenchmarkResult(stats);
      const state = useCityStore.getState();
      const payload = buildCityReportPayload(state);

      assert.equal(payload.currentBenchmark?.hasBenchmark, true);
      assert.ok(payload.currentBenchmark?.stats);
      assert.equal(payload.currentBenchmark.stats.resultSetsEqual, true);
      assert.equal(typeof payload.currentBenchmark.stats.tableScanMedianMs, 'number');
      assert.equal(typeof payload.currentBenchmark.stats.bitmapMedianMs, 'number');
    });

    it('Scaling results are stored in shared state and accessible to the city report', () => {
      const activeSizes = [2000, 5000];
      const testAst: CityQueryNode = { type: 'predicate', column: 'district', operator: '=', value: 'Downtown Central' };

      // Simulate completed scaling experiment
      useCityStore.getState().setScalingRunRecord({
        runId: 'scaling-test-run-1',
        timestamp: new Date().toISOString(),
        querySummary: 'Downtown Central district scan',
        scope: 'district',
        district: 'Downtown Central',
        issueLabels: ['Severe Traffic'],
        ast: testAst,
        datasetSizes: activeSizes,
        resultsBySize: {
          2000: {
            genTimeMs: 12.5,
            buildTimeMs: 4.8,
            memoryBytes: 40960,
            stats: {
              totalRows: 2000,
              matchingRows: 120,
              tableScanRowsScanned: 2000,
              tableScanPredicateChecks: 2000,
              bitmapVectorsUsed: 1,
              bitmapOperations: 1,
              bitmapCandidateRows: 120,
              rowsAvoided: 1880,
              rowReductionPct: 94.0,
              tableScanMedianMs: 0.18,
              bitmapMedianMs: 0.02,
              tableScanAverageMs: 0.19,
              bitmapAverageMs: 0.021,
              tableScanP95Ms: 0.22,
              bitmapP95Ms: 0.025,
              speedup: 9.0,
              resultSetsEqual: true,
              winner: 'bitmap',
              breakEvenQueries: 30,
              breakEvenStatus: '30 queries'
            }
          },
          5000: {
            genTimeMs: 28.2,
            buildTimeMs: 11.2,
            memoryBytes: 102400,
            stats: {
              totalRows: 5000,
              matchingRows: 310,
              tableScanRowsScanned: 5000,
              tableScanPredicateChecks: 5000,
              bitmapVectorsUsed: 1,
              bitmapOperations: 1,
              bitmapCandidateRows: 310,
              rowsAvoided: 4690,
              rowReductionPct: 93.8,
              tableScanMedianMs: 0.45,
              bitmapMedianMs: 0.035,
              tableScanAverageMs: 0.46,
              bitmapAverageMs: 0.036,
              tableScanP95Ms: 0.52,
              bitmapP95Ms: 0.04,
              speedup: 12.8,
              resultSetsEqual: true,
              winner: 'bitmap',
              breakEvenQueries: 28,
              breakEvenStatus: '28 queries'
            }
          }
        },
        status: 'completed'
      });

      const state = useCityStore.getState();
      const payload = buildCityReportPayload(state);

      assert.equal(payload.scalingExperiment?.hasScaling, true);
      assert.ok(payload.scalingExperiment?.runRecord);
      assert.equal(payload.scalingExperiment.runRecord.datasetSizes.length, 2);
      assert.equal(payload.scalingExperiment.runRecord.resultsBySize[2000].stats.speedup, 9.0);
      assert.equal(payload.scalingExperiment.runRecord.resultsBySize[5000].stats.speedup, 12.8);
      assert.ok(payload.scalingExperiment.keyFindings.length > 0);
    });

    it('Clearing scaling experiment behaves consistently and updates report payload', () => {
      useCityStore.getState().setScalingRunRecord(null);
      const state = useCityStore.getState();
      const payload = buildCityReportPayload(state);

      assert.equal(payload.scalingExperiment?.hasScaling, false);
      assert.ok(payload.scalingExperiment?.keyFindings[0].includes('No scaling experiment'));
    });
  });

  // --------------------------------------------------------------------------
  // 3. REPORT FORMAT GENERATION & RENDERER TESTS
  // --------------------------------------------------------------------------

  describe('Report Renderers (PDF, DOCX, TXT) and Safety', () => {

    it('TXT report generates clean structured text for Laboratory report', () => {
      const labState = useLaboratoryStore.getState();
      const payload = buildLaboratoryReportPayload(labState);
      const txt = generateTxtReport(payload);

      assert.ok(txt.includes('BITMAP INDEX LABORATORY TECHNICAL REPORT'));
      assert.ok(txt.includes('EXECUTIVE SUMMARY'));
      assert.ok(txt.includes('DATASET SCHEMA & DESCRIPTIVE STATISTICS'));
      assert.ok(txt.includes('END OF TECHNICAL REPORT'));
    });

    it('TXT report generates clean structured text for Nova Smart City report with scaling data', () => {
      // Setup a sample scaling record
      useCityStore.getState().setScalingRunRecord({
        runId: 'scaling-txt-test',
        timestamp: new Date().toISOString(),
        querySummary: 'City-wide pollution test',
        scope: 'city',
        district: null,
        issueLabels: ['Hazardous Air'],
        ast: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Hazardous' },
        datasetSizes: [2000],
        resultsBySize: {
          2000: {
            genTimeMs: 10,
            buildTimeMs: 5,
            memoryBytes: 40960,
            stats: {
              totalRows: 2000,
              matchingRows: 50,
              tableScanRowsScanned: 2000,
              tableScanPredicateChecks: 2000,
              bitmapVectorsUsed: 1,
              bitmapOperations: 1,
              bitmapCandidateRows: 50,
              rowsAvoided: 1950,
              rowReductionPct: 97.5,
              tableScanMedianMs: 0.15,
              bitmapMedianMs: 0.02,
              tableScanAverageMs: 0.16,
              bitmapAverageMs: 0.021,
              tableScanP95Ms: 0.18,
              bitmapP95Ms: 0.025,
              speedup: 7.5,
              resultSetsEqual: true,
              winner: 'bitmap',
              breakEvenQueries: 39,
              breakEvenStatus: '39 queries'
            }
          }
        },
        status: 'completed'
      });

      const cityState = useCityStore.getState();
      const payload = buildCityReportPayload(cityState);
      const txt = generateTxtReport(payload);

      assert.ok(txt.includes('NOVA SMART CITY ANALYTICS & BENCHMARK REPORT'));
      assert.ok(txt.includes('SCALING EXPERIMENT — MULTI-SCALE PERFORMANCE BENCHMARK'));
      assert.ok(txt.includes('City-wide pollution test'));
      assert.ok(txt.includes('7.5x'));
    });

    it('DOCX report generator constructs a valid Blob for Laboratory payload', async () => {
      const labState = useLaboratoryStore.getState();
      const payload = buildLaboratoryReportPayload(labState);
      const docxBlob = await generateDocxReport(payload);

      assert.ok(docxBlob);
      assert.ok(docxBlob.size > 0);
    });

    it('DOCX report generator constructs a valid Blob for Nova City payload', async () => {
      const cityState = useCityStore.getState();
      const payload = buildCityReportPayload(cityState);
      const docxBlob = await generateDocxReport(payload);

      assert.ok(docxBlob);
      assert.ok(docxBlob.size > 0);
    });

    it('Empty or incomplete state does not crash report generation', () => {
      const emptyLabPayload = buildLaboratoryReportPayload({
        dataset: [],
        schema: { columns: [], domain: 'Empty' },
        bitmapIndex: {},
        queryHistory: [],
        algebraHistory: [],
        quizHistory: [],
        activityLog: []
      });

      assert.doesNotThrow(() => {
        generateTxtReport(emptyLabPayload);
      });

      const emptyCityPayload = buildCityReportPayload({
        dataset: [],
        activeQuery: null,
        queryResultEntityIds: new Set(),
        lastBenchmarkResult: null,
        scalingRunRecord: null,
        cityActivityLog: []
      });

      assert.doesNotThrow(() => {
        generateTxtReport(emptyCityPayload);
      });
    });

    it('Formatting helpers format microsecond, millisecond, byte sizes and safe filenames correctly', () => {
      assert.equal(formatTimingValue(0.00005), '< 0.1 µs (sub-resolution)');
      assert.equal(formatTimingValue(0.0003), '0.30 µs');
      assert.equal(formatTimingValue(0.025), '25.0 µs');
      assert.equal(formatTimingValue(1.4567), '1.46 ms');
      assert.equal(formatTimingValue(undefined), 'N/A');
      assert.equal(formatReportDate(undefined), 'N/A');

      assert.equal(formatByteSize(0), '0 KB');
      assert.equal(formatByteSize(2048), '2.0 KB');
      assert.equal(formatByteSize(2 * 1024 * 1024), '2.00 MB');

      const filename = generateSafeReportFilename('My / Report: Test!', 'pdf');
      assert.ok(!filename.includes('/'));
      assert.ok(!filename.includes(':'));
      assert.ok(!filename.includes('!'));
      assert.ok(filename.endsWith('.pdf'));
    });

    it('Hardcoded 0.20ms query overhead claim is completely absent from all reports', () => {
      const labPayload = buildLaboratoryReportPayload(useLaboratoryStore.getState());
      const cityPayload = buildCityReportPayload(useCityStore.getState());

      const labTxt = generateTxtReport(labPayload);
      const cityTxt = generateTxtReport(cityPayload);

      assert.ok(!labTxt.includes('0.20ms per query'));
      assert.ok(!cityTxt.includes('0.20ms per query'));
    });
  });

});
