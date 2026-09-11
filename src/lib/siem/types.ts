export interface SecurityEvent {
  id: number;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  eventType: string;
  severity: string;
  action: string;
  status: string;
  username: string;
  deviceType: string;
  country: string;
  authenticationResult: string;
  threatCategory: string;
  bytes: number;
  process: string;
}

export type SecurityField = keyof SecurityEvent;

// Allowed operators for our simple SIEM query parser
export type QueryOperator = '=' | '!=' | 'IN' | 'NOT IN';

export interface QueryPredicate {
  type: 'predicate';
  field: SecurityField;
  operator: QueryOperator;
  value: string | string[];
}

export interface QueryLogicalNode {
  type: 'logical';
  operator: 'AND' | 'OR';
  left: QueryNode;
  right: QueryNode;
}

export interface QueryNotNode {
  type: 'not';
  operand: QueryNode;
}

export type QueryNode = QueryPredicate | QueryLogicalNode | QueryNotNode;

export interface SiemDatasetProfile {
  id: string;
  name: string;
  description: string;
}

// SIEM Bitmap Index structure
// For example: indexes['severity']['Critical'] = Bitmap
import { Bitmap } from '@/lib/bitmap';

export type SiemBitmapIndex = Record<string, Record<string, Bitmap>>;
