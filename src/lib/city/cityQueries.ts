import { Bitmap } from '@/lib/bitmap/types';
import { CityBitmapIndex, CityQueryNode, AIStructuredCityQuery, CityField, CityQueryOperator } from './cityTypes';
export type { CityQueryNode };
import { 
  CityPackedBitmap, 
  createEmptyPackedBitmap, 
  createFullPackedBitmap,
  packedBitmapAnd, 
  packedBitmapOr, 
  packedBitmapXor, 
  packedBitmapNot,
  extractPackedMatchingIds
} from './packedBitmap';

export interface CityExecutionMetrics {
  bitmapVectorsUsed: number;
  operationsPerformed: string[];
  executionTimeMs: number;
  matchingRows: number;
  rowsScanned: number; // for comparison (simulated naive execution)
}

export interface CityExecutionStep {
  node: CityQueryNode;
  resultBitmap: Bitmap;
  description: string;
}

export interface CityExecutionResult {
  finalBitmap: Bitmap;
  metrics: CityExecutionMetrics;
  steps: CityExecutionStep[];
  matchingIds: string[];
}

export function executeCityQuery(
  ast: CityQueryNode,
  index: CityBitmapIndex,
  datasetSize: number,
  datasetIds: string[]
): CityExecutionResult {
  const start = performance.now();
  const metrics: CityExecutionMetrics = {
    bitmapVectorsUsed: 0,
    operationsPerformed: [],
    executionTimeMs: 0,
    matchingRows: 0,
    rowsScanned: datasetSize
  };
  const steps: CityExecutionStep[] = [];

  function evaluate(node: CityQueryNode): CityPackedBitmap {
    if (node.type === 'predicate') {
      const fieldIndex = index[node.column];
      if (!fieldIndex) {
        const empty = createEmptyPackedBitmap(datasetSize);
        steps.push({ node, resultBitmap: empty, description: `Missing index for ${node.column}` });
        return empty;
      }

      const rawBitmap = fieldIndex[node.value];
      const bitmap = (rawBitmap instanceof CityPackedBitmap)
        ? rawBitmap
        : (rawBitmap ? new CityPackedBitmap(datasetSize, (rawBitmap as any).words || (rawBitmap as any).bits, node.column, node.value) : createEmptyPackedBitmap(datasetSize));

      metrics.bitmapVectorsUsed++;

      if (node.operator === '=') {
        steps.push({ node, resultBitmap: bitmap, description: `Lookup ${node.column} = ${node.value}` });
        return bitmap;
      } else if (node.operator === '!=') {
        metrics.operationsPerformed.push('NOT');
        const inverted = packedBitmapNot(bitmap);
        inverted.sourceColumn = node.column;
        inverted.sourceValue = `!= ${node.value}`;
        steps.push({ node, resultBitmap: inverted, description: `Lookup ${node.column} != ${node.value} (NOT)` });
        return inverted;
      }
      return createEmptyPackedBitmap(datasetSize);
    } else if (node.type === 'not') {
      const operand = evaluate(node.operand);
      metrics.operationsPerformed.push('NOT');
      const result = packedBitmapNot(operand);
      result.sourceColumn = 'derived';
      result.sourceValue = 'NOT';
      steps.push({ node, resultBitmap: result, description: 'Logical NOT' });
      return result;
    } else if (node.type === 'logical') {
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      
      let result: CityPackedBitmap;
      if (node.operator === 'AND') {
        result = packedBitmapAnd(left, right);
        metrics.operationsPerformed.push('AND');
      } else if (node.operator === 'OR') {
        result = packedBitmapOr(left, right);
        metrics.operationsPerformed.push('OR');
      } else if (node.operator === 'XOR') {
        result = packedBitmapXor(left, right);
        metrics.operationsPerformed.push('XOR');
      } else {
        result = createEmptyPackedBitmap(datasetSize);
      }

      result.sourceColumn = 'derived';
      result.sourceValue = `Logical ${node.operator}`;
      steps.push({ node, resultBitmap: result, description: `Logical ${node.operator}` });
      return result;
    }
    
    return createEmptyPackedBitmap(datasetSize);
  }

  const finalBitmap = evaluate(ast);
  
  // Fast word-level matching ID extraction
  const matchingIds = extractPackedMatchingIds(finalBitmap.words, datasetSize, datasetIds);

  const end = performance.now();
  metrics.executionTimeMs = end - start;
  metrics.matchingRows = matchingIds.length;

  return { finalBitmap, metrics, steps, matchingIds };
}

/**
 * Pure benchmark execution path for Packed Bitmap without internal performance.now()
 * timer overhead, step recording, description formatting, or visualizer instrumentation.
 * Evaluates identical query AST predicates and materializes matching record IDs.
 */
export function executeCityQueryFast(
  ast: CityQueryNode,
  index: CityBitmapIndex,
  datasetSize: number,
  datasetIds: string[]
): string[] {
  function evaluate(node: CityQueryNode): CityPackedBitmap {
    if (node.type === 'predicate') {
      const fieldIndex = index[node.column];
      if (!fieldIndex) return createEmptyPackedBitmap(datasetSize);

      const rawBitmap = fieldIndex[node.value];
      if (rawBitmap instanceof CityPackedBitmap) {
        if (node.operator === '=') return rawBitmap;
        if (node.operator === '!=') return packedBitmapNot(rawBitmap);
        return createEmptyPackedBitmap(datasetSize);
      }
      if (rawBitmap) {
        const bmp = new CityPackedBitmap(
          datasetSize, 
          (rawBitmap as any).words || (rawBitmap as any).bits, 
          node.column, 
          node.value
        );
        if (node.operator === '=') return bmp;
        if (node.operator === '!=') return packedBitmapNot(bmp);
        return createEmptyPackedBitmap(datasetSize);
      }
      return createEmptyPackedBitmap(datasetSize);
    }
    if (node.type === 'not') {
      return packedBitmapNot(evaluate(node.operand));
    }
    if (node.type === 'logical') {
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      if (node.operator === 'AND') return packedBitmapAnd(left, right);
      if (node.operator === 'OR') return packedBitmapOr(left, right);
      if (node.operator === 'XOR') return packedBitmapXor(left, right);
      return createEmptyPackedBitmap(datasetSize);
    }
    return createEmptyPackedBitmap(datasetSize);
  }

  const finalBitmap = evaluate(ast);
  return extractPackedMatchingIds(finalBitmap.words, datasetSize, datasetIds);
}

// Convert the loose AI JSON structure to our strict AST, validating fields.
export function parseAICityQuery(aiQuery: any, validFields: Set<string>): CityQueryNode {
  if (!aiQuery || typeof aiQuery !== 'object') {
    throw new Error("Invalid AI Query structure");
  }

  // First check if it's a leaf node (predicate)
  if (aiQuery.column && aiQuery.value !== undefined) {
    if (!validFields.has(aiQuery.column)) {
      throw new Error(`Invalid column: ${aiQuery.column}`);
    }
    const op = aiQuery.operator || '=';
    if (op !== '=' && op !== '!=') {
      throw new Error(`Invalid predicate operator: ${op}`);
    }
    return {
      type: 'predicate',
      column: aiQuery.column as any,
      operator: op as any,
      value: String(aiQuery.value)
    };
  }

  // Otherwise it must be a logical node
  if (aiQuery.operator) {
    if (aiQuery.operator === 'NOT') {
      if (!Array.isArray(aiQuery.conditions) || aiQuery.conditions.length !== 1) {
        throw new Error("NOT operator must have exactly 1 condition");
      }
      return {
        type: 'not',
        operand: parseAICityQuery(aiQuery.conditions[0], validFields)
      };
    } else if (aiQuery.operator === 'AND' || aiQuery.operator === 'OR' || aiQuery.operator === 'XOR') {
      if (!Array.isArray(aiQuery.conditions) || aiQuery.conditions.length < 2) {
        throw new Error(`${aiQuery.operator} operator requires at least 2 conditions`);
      }
      
      // Reduce multiple conditions into a binary tree
      const parsedConditions = aiQuery.conditions.map((c: any) => parseAICityQuery(c, validFields));
      
      let rootNode: CityQueryNode = parsedConditions[0];
      for (let i = 1; i < parsedConditions.length; i++) {
        rootNode = {
          type: 'logical',
          operator: aiQuery.operator,
          left: rootNode,
          right: parsedConditions[i]
        };
      }
      return rootNode;
    }
    throw new Error(`Unknown operator: ${aiQuery.operator}`);
  }

  throw new Error("Could not parse query node");
}

// ============================================================================
// Performance Lab & Scaling Experiment Shared Query Builder
// ============================================================================

export interface CityIssueFilterState {
  traffic: boolean;      // Severe Traffic -> trafficLevel = 'Severe'
  accident: boolean;     // Accidents -> incidentType = 'Accident'
  pollution: boolean;    // High Pollution -> airQuality = 'Hazardous'
  power: boolean;        // Power Failure -> powerStatus = 'Failure'
  hospital: boolean;     // Hospital Overload -> hospitalLoad = 'Critical'
  risk: boolean;         // Critical Risk -> riskLevel = 'Critical'
}

export type CityScanScope = 'district' | 'city';

export const DEFAULT_CITY_ISSUE_FILTERS: CityIssueFilterState = {
  traffic: true,
  accident: true,
  pollution: true,
  power: true,
  hospital: true,
  risk: true
};

export interface CityIssueDefinition {
  key: keyof CityIssueFilterState;
  label: string;
  column: CityField;
  operator: CityQueryOperator;
  value: string;
}

export const CITY_ISSUE_DEFINITIONS: Record<keyof CityIssueFilterState, CityIssueDefinition> = {
  traffic: { key: 'traffic', label: 'Severe Traffic', column: 'trafficLevel', operator: '=', value: 'Severe' },
  accident: { key: 'accident', label: 'Accidents', column: 'incidentType', operator: '=', value: 'Accident' },
  pollution: { key: 'pollution', label: 'High Pollution', column: 'airQuality', operator: '=', value: 'Hazardous' },
  power: { key: 'power', label: 'Power Failure', column: 'powerStatus', operator: '=', value: 'Failure' },
  hospital: { key: 'hospital', label: 'Hospital Overload', column: 'hospitalLoad', operator: '=', value: 'Critical' },
  risk: { key: 'risk', label: 'Critical Risk', column: 'riskLevel', operator: '=', value: 'Critical' }
};

export interface CityQueryBuilderInput {
  district: string | null;
  issues: CityIssueFilterState;
  isCityWide?: boolean;
}

export interface CityQueryBuildResult {
  isValid: boolean;
  ast: CityQueryNode | null;
  error?: string;
  summary: string;
  selectedIssuesCount: number;
  selectedIssueLabels: string[];
  district: string | null;
  isCityWide: boolean;
}

/**
 * Builds the canonical CityQueryNode AST from the Performance Lab selections.
 * Enforces strict validation:
 * - Rejects empty issue selections (no silent fallback).
 * - Rejects missing district when in district scope.
 * - Combines issue predicates with logical OR.
 * - Combines district predicate and issue expression with logical AND.
 * - Omits district predicate in city-wide mode.
 */
export function tryBuildCityQueryAST(input: CityQueryBuilderInput): CityQueryBuildResult {
  const { district, issues, isCityWide = false } = input;

  const enabledKeys = (Object.keys(CITY_ISSUE_DEFINITIONS) as (keyof CityIssueFilterState)[])
    .filter(k => Boolean(issues[k]));

  const selectedIssueLabels = enabledKeys.map(k => CITY_ISSUE_DEFINITIONS[k].label);
  const selectedIssuesCount = enabledKeys.length;

  // Validation 1: At least one issue type must be enabled
  if (selectedIssuesCount === 0) {
    return {
      isValid: false,
      ast: null,
      error: 'No issue types selected. Select at least one issue type to scan or benchmark.',
      summary: 'No issues selected',
      selectedIssuesCount: 0,
      selectedIssueLabels: [],
      district,
      isCityWide
    };
  }

  // Validation 2: District is required unless in city-wide mode
  const trimmedDistrict = district ? district.trim() : null;
  if (!isCityWide && (!trimmedDistrict || trimmedDistrict === '')) {
    return {
      isValid: false,
      ast: null,
      error: 'No valid district selected. Select a district or enable City-Wide mode.',
      summary: 'No district selected',
      selectedIssuesCount,
      selectedIssueLabels,
      district: trimmedDistrict,
      isCityWide
    };
  }

  // Build binary issue predicate tree (OR)
  const issuePredicates: CityQueryNode[] = enabledKeys.map(k => {
    const def = CITY_ISSUE_DEFINITIONS[k];
    return {
      type: 'predicate',
      column: def.column,
      operator: def.operator,
      value: def.value
    };
  });

  let issueRoot: CityQueryNode = issuePredicates[0];
  for (let i = 1; i < issuePredicates.length; i++) {
    issueRoot = {
      type: 'logical',
      operator: 'OR',
      left: issueRoot,
      right: issuePredicates[i]
    };
  }

  let finalAst: CityQueryNode;
  let summary: string;

  if (isCityWide) {
    finalAst = issueRoot;
    summary = `Scope: City-Wide | Issues: ${selectedIssueLabels.join(', ')} | Logic: ${
      selectedIssueLabels.length > 1 ? `(${selectedIssueLabels.join(' OR ')})` : selectedIssueLabels[0]
    }`;
  } else {
    finalAst = {
      type: 'logical',
      operator: 'AND',
      left: {
        type: 'predicate',
        column: 'district',
        operator: '=',
        value: trimmedDistrict!
      },
      right: issueRoot
    };
    summary = `District: ${trimmedDistrict} | Issues: ${selectedIssueLabels.join(', ')} | Logic: district = '${trimmedDistrict}' AND (${
      selectedIssueLabels.length > 1 ? `(${selectedIssueLabels.join(' OR ')})` : selectedIssueLabels[0]
    })`;
  }

  return {
    isValid: true,
    ast: finalAst,
    summary,
    selectedIssuesCount,
    selectedIssueLabels,
    district: trimmedDistrict,
    isCityWide
  };
}

/**
 * Builds the canonical CityQueryNode AST or throws an error if invalid.
 */
export function buildCityQueryAST(input: CityQueryBuilderInput): CityQueryNode {
  const res = tryBuildCityQueryAST(input);
  if (!res.isValid || !res.ast) {
    throw new Error(res.error || 'Invalid city query configuration');
  }
  return res.ast;
}
