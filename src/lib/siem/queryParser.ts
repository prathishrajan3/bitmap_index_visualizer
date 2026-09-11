import { QueryNode, SecurityField, QueryOperator } from './types';

export class QueryParseError extends Error {
  constructor(message: string) {
    super(`Query Parse Error: ${message}`);
    this.name = 'QueryParseError';
  }
}

// A very simplified query parser designed specifically for our SIEM educational engine.
export function parseSiemQuery(queryString: string): QueryNode | null {
  const query = queryString.trim();
  if (!query) return null;

  try {
    return parseExpression(query);
  } catch (e: unknown) {
    const err = e as Error;
    throw new QueryParseError(err.message);
  }
}

function parseExpression(expr: string): QueryNode {
  let str = expr.trim();
  
  // Strip outer parens if they enclose the entire expression
  while (str.startsWith('(') && str.endsWith(')')) {
    // Make sure they actually match each other
    let depth = 0;
    let validWrap = true;
    for (let i = 0; i < str.length - 1; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;
      if (depth === 0) {
        validWrap = false;
        break;
      }
    }
    if (validWrap) {
      str = str.substring(1, str.length - 1).trim();
    } else {
      break;
    }
  }

  // Find the top-level logical operator (split by OR first, then AND)
  // We need to ignore operators inside parentheses.
  const splitByTopLevel = (s: string, tokens: string[]): [string, string, string] | null => {
    let depth = 0;
    // Iterate backwards to enforce left-to-right precedence (right associative split)
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] === ')') depth++;
      else if (s[i] === '(') depth--;
      
      if (depth === 0) {
        for (const token of tokens) {
          // Check if token matches at this position
          // ensure word boundaries to not match 'OR' inside 'PORT'
          const regex = new RegExp(`\\b${token}\\b`, 'i');
          const substr = s.substring(Math.max(0, i - token.length), i + 1);
          
          if (regex.test(substr)) {
            // Need to verify it's really the token and not part of a string
            // A more robust parser would lex first. For our scope, we rely on basic spacing.
            const prefix = s.substring(0, i - token.length).trim();
            const suffix = s.substring(i + 1).trim();
            if (prefix && suffix) {
               return [prefix, token.toUpperCase(), suffix];
            }
          }
        }
      }
    }
    return null;
  };

  const orSplit = splitByTopLevel(str, ['OR']);
  if (orSplit) {
    return {
      type: 'logical',
      operator: 'OR',
      left: parseExpression(orSplit[0]),
      right: parseExpression(orSplit[2])
    };
  }

  const andSplit = splitByTopLevel(str, ['AND']);
  if (andSplit) {
    return {
      type: 'logical',
      operator: 'AND',
      left: parseExpression(andSplit[0]),
      right: parseExpression(andSplit[2])
    };
  }

  // Handle NOT
  if (str.toUpperCase().startsWith('NOT ')) {
    return {
      type: 'not',
      operand: parseExpression(str.substring(4))
    };
  }

  // If no logical operators, it must be a predicate
  return parsePredicate(str);
}

function parsePredicate(str: string): QueryNode {
  // Regex to match field operator 'value' or field IN ('v1', 'v2')
  
  // Handle IN / NOT IN
  const inMatch = str.match(/^([a-zA-Z_]+)\s+(NOT\s+IN|IN)\s*\((.+)\)$/i);
  if (inMatch) {
    const field = inMatch[1] as SecurityField;
    const operator = inMatch[2].toUpperCase() as QueryOperator;
    const valuesStr = inMatch[3];
    // Split values by comma, remove quotes
    const values = valuesStr.split(',').map(v => v.trim().replace(/^'([^']*)'$/, '$1').replace(/^"([^"]*)"$/, '$1'));
    return { type: 'predicate', field, operator, value: values };
  }

  // Handle = / !=
  const eqMatch = str.match(/^([a-zA-Z_]+)\s*(!=|=)\s*(.+)$/i);
  if (eqMatch) {
    const field = eqMatch[1] as SecurityField;
    const operator = eqMatch[2] as QueryOperator;
    let value = eqMatch[3].trim();
    value = value.replace(/^'([^']*)'$/, '$1').replace(/^"([^"]*)"$/, '$1'); // strip quotes
    return { type: 'predicate', field, operator, value };
  }

  throw new Error(`Invalid predicate syntax: "${str}"`);
}
