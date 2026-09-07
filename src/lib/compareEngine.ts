import { DatasetRow, DatasetBitmapIndex } from './bitmap/types';

export interface Predicate {
  column: string;
  value: string;
  operator: string;
}

export interface ParsedQuery {
  raw: string;
  predicates: Predicate[];
  logic: 'AND' | 'OR' | 'NONE';
}

export interface CompareMetrics {
  totalRows: number;
  matchingRows: number;
  rejectedRows: number;
  selectivity: number; // 0 to 1
  
  // Table Scan Metrics
  tableScanPredicateChecks: number;
  tableScanConceptualFootprintBytes: number;
  
  // Bitmap Index Metrics
  bitmapVectorLookups: number;
  bitmapOperations: number;
  bitmapCandidateRows: number; // Row IDs extracted
  bitmapConceptualFootprintBytes: number;
  
  // Validation
  resultSetsEqual: boolean;
  tableScanRowIds: number[];
  bitmapRowIds: number[];

  // Savings
  conceptualSavingsPct: number;
}

/**
 * Super lightweight SQL parser to extract simple WHERE conditions.
 * Example: "SELECT * FROM DatasetRow WHERE Year = 2 AND Hostel = true"
 */
export function parsePredicates(sqlQuery: string): ParsedQuery {
  const result: ParsedQuery = {
    raw: sqlQuery,
    predicates: [],
    logic: 'NONE'
  };

  const whereMatch = sqlQuery.match(/WHERE\s+(.+)/i);
  if (!whereMatch) return result;

  const conditionStr = whereMatch[1].replace(/;$/, '').trim();

  let parts: string[] = [];
  if (conditionStr.toUpperCase().includes(' AND ')) {
    result.logic = 'AND';
    parts = conditionStr.split(/\s+AND\s+/i);
  } else if (conditionStr.toUpperCase().includes(' OR ')) {
    result.logic = 'OR';
    parts = conditionStr.split(/\s+OR\s+/i);
  } else {
    parts = [conditionStr];
  }

  for (const p of parts) {
    const match = p.match(/([a-zA-Z0-9_]+)\s*(=|!=|>|<|>=|<=)\s*(.+)/);
    if (match) {
      // Clean up the value (remove quotes)
      let val = match[3].trim().replace(/^['"]|['"]$/g, '');
      if (val.toUpperCase() === 'TRUE') val = 'true';
      if (val.toUpperCase() === 'FALSE') val = 'false';
      
      result.predicates.push({
        column: match[1].trim(),
        operator: match[2].trim(),
        value: val
      });
    }
  }

  return result;
}

function evaluateTableScan(dataset: DatasetRow[], query: ParsedQuery): number[] {
  return dataset.filter(row => {
    if (query.predicates.length === 0) return true;

    const evalPredicate = (p: Predicate) => {
      const rowVal = String(row[p.column]);
      if (p.operator === '=') return rowVal === p.value;
      if (p.operator === '!=') return rowVal !== p.value;
      return false; // Only basic support for now
    };

    if (query.logic === 'OR') {
      return query.predicates.some(evalPredicate);
    } else {
      return query.predicates.every(evalPredicate);
    }
  }).map(r => r.id);
}

function bitwiseAnd(a: number[], b: number[]): number[] {
  const len = Math.min(a.length, b.length);
  const res = new Array(len);
  for (let i = 0; i < len; i++) {
    res[i] = a[i] & b[i];
  }
  return res;
}

function bitwiseOr(a: number[], b: number[]): number[] {
  const len = Math.min(a.length, b.length);
  const res = new Array(len);
  for (let i = 0; i < len; i++) {
    res[i] = a[i] | b[i];
  }
  return res;
}

export function evaluateBitmapIndex(dataset: DatasetRow[], bitmapIndex: DatasetBitmapIndex, query: ParsedQuery): { rowIds: number[], vectorsUsed: {col: string, val: string, bits: number[]}[], finalBits: number[] } {
  if (query.predicates.length === 0) {
    return { rowIds: dataset.map(r => r.id), vectorsUsed: [], finalBits: new Array(dataset.length).fill(1) };
  }

  const vectors: {col: string, val: string, bits: number[]}[] = [];
  const bitArrays: number[][] = [];

  for (const p of query.predicates) {
    let bits: number[];
    if (p.operator === '=' && bitmapIndex[p.column] && bitmapIndex[p.column][p.value]) {
      bits = bitmapIndex[p.column][p.value].bits;
    } else {
      // Fallback: build on the fly if not indexed (simulating failure/fallback)
      bits = dataset.map(r => String(r[p.column]) === p.value ? 1 : 0);
    }
    vectors.push({ col: p.column, val: p.value, bits });
    bitArrays.push(bits);
  }

  let finalBits = bitArrays[0];
  if (bitArrays.length > 1) {
    if (query.logic === 'OR') {
      for (let i = 1; i < bitArrays.length; i++) {
        finalBits = bitwiseOr(finalBits, bitArrays[i]);
      }
    } else {
      // AND logic is default
      for (let i = 1; i < bitArrays.length; i++) {
        finalBits = bitwiseAnd(finalBits, bitArrays[i]);
      }
    }
  }

  const rowIds: number[] = [];
  for (let i = 0; i < finalBits.length; i++) {
    if (finalBits[i] === 1) {
      rowIds.push(dataset[i].id);
    }
  }

  return { rowIds, vectorsUsed: vectors, finalBits };
}

export function calculateMetrics(dataset: DatasetRow[], bitmapIndex: DatasetBitmapIndex, sqlQuery: string, schemaColumnsLength: number): CompareMetrics {
  const parsed = parsePredicates(sqlQuery);
  const tableScanIds = evaluateTableScan(dataset, parsed);
  const bitmapRes = evaluateBitmapIndex(dataset, bitmapIndex, parsed);

  // Sorting to compare arrays exactly
  const tsIds = [...tableScanIds].sort((a,b)=>a-b);
  const bmIds = [...bitmapRes.rowIds].sort((a,b)=>a-b);
  const resultSetsEqual = tsIds.length === bmIds.length && tsIds.every((val, index) => val === bmIds[index]);

  const totalRows = dataset.length;
  const matchingRows = tsIds.length;
  const rejectedRows = totalRows - matchingRows;
  const selectivity = totalRows === 0 ? 0 : matchingRows / totalRows;

  // Table Scan: check every row against every predicate
  const tableScanPredicateChecks = totalRows * Math.max(1, parsed.predicates.length);
  // Conceptual footprint: 24 bytes per row (tuple overhead, pointers, etc. + data)
  const tableScanConceptualFootprintBytes = totalRows * schemaColumnsLength * 8; 

  // Bitmap: fetch vectors, do bitwise ops, then fetch heap for matched rows
  const bitmapVectorLookups = parsed.predicates.length;
  const bitmapOperations = parsed.predicates.length > 1 ? parsed.predicates.length - 1 : 0;
  const bitmapCandidateRows = bmIds.length;

  // Conceptual footprint: each vector is (totalRows) bits.
  const bitsUsed = parsed.predicates.length * totalRows;
  const bitmapConceptualFootprintBytes = Math.ceil(bitsUsed / 8);

  const savings = tableScanConceptualFootprintBytes > 0 
    ? ((tableScanConceptualFootprintBytes - bitmapConceptualFootprintBytes) / tableScanConceptualFootprintBytes) * 100 
    : 0;

  return {
    totalRows,
    matchingRows,
    rejectedRows,
    selectivity,
    tableScanPredicateChecks,
    tableScanConceptualFootprintBytes,
    bitmapVectorLookups,
    bitmapOperations,
    bitmapCandidateRows,
    bitmapConceptualFootprintBytes,
    resultSetsEqual,
    tableScanRowIds: tsIds,
    bitmapRowIds: bmIds,
    conceptualSavingsPct: savings
  };
}
