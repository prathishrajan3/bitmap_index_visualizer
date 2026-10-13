import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inferPostgresType, buildCteQuery } from '../src/app/api/query/route';

describe('Neon DB Query CTE Builder & Dynamic PostgreSQL Type Inference', () => {

  it('correctly infers text for alphanumeric values ("1st Year") even if declared as number', () => {
    const dataset = [
      { id: 1, Department: 'Computer Science', Year: '1st Year', Hostel: 'Yes' },
      { id: 2, Department: 'Electrical', Year: '2nd Year', Hostel: 'No' },
      { id: 3, Department: 'Mechanical', Year: '3rd Year', Hostel: 'Yes' }
    ];

    const typeYear = inferPostgresType('Year', 'number', dataset);
    assert.equal(typeYear, 'text', 'Alphanumeric values like "1st Year" must be inferred as text, never int');

    const typeHostel = inferPostgresType('Hostel', 'boolean', dataset);
    assert.equal(typeHostel, 'text', 'String values like "Yes"/"No" must be inferred as text, never boolean');

    const typeDept = inferPostgresType('Department', 'string', dataset);
    assert.equal(typeDept, 'text');
  });

  it('correctly infers int when dataset values are strictly integer values', () => {
    const dataset = [
      { id: 1, Age: 20, Score: '95' },
      { id: 2, Age: 22, Score: '88' }
    ];

    assert.equal(inferPostgresType('Age', 'number', dataset), 'int');
    assert.equal(inferPostgresType('Score', 'number', dataset), 'int');
  });

  it('correctly infers boolean when dataset values are strictly boolean primitives or booleans', () => {
    const dataset = [
      { id: 1, Active: true, Verified: 'true' },
      { id: 2, Active: false, Verified: 'false' }
    ];

    assert.equal(inferPostgresType('Active', 'boolean', dataset), 'boolean');
    assert.equal(inferPostgresType('Verified', 'boolean', dataset), 'boolean');
  });

  it('buildCteQuery builds valid CTE schema for the user query scenario without integer mismatch error', () => {
    const userQuery = `
      SELECT Department, COUNT(*) AS student_count
      FROM DatasetRow
      WHERE Hostel = 'Yes' AND Year = '1st Year'
      GROUP BY Department
      ORDER BY student_count DESC;
    `;

    const schema = [
      { id: 'col-1', name: 'Department', type: 'string', cardinality: 3, distribution: 'Uniform' },
      { id: 'col-2', name: 'Year', type: 'number', cardinality: 4, distribution: 'Cyclic' },
      { id: 'col-3', name: 'Hostel', type: 'boolean', cardinality: 2, distribution: 'Random' }
    ];

    const dataset = [
      { id: 1, Department: 'Computer Science', Year: '1st Year', Hostel: 'Yes' },
      { id: 2, Department: 'Electrical', Year: '2nd Year', Hostel: 'No' },
      { id: 3, Department: 'Mechanical', Year: '1st Year', Hostel: 'Yes' }
    ];

    const { finalQuery, params } = buildCteQuery(userQuery, dataset, schema);

    assert.ok(finalQuery.includes('WITH DatasetRow AS'));
    assert.ok(finalQuery.includes('year text'), 'Year must be typed as text in CTE');
    assert.ok(finalQuery.includes('hostel text'), 'Hostel must be typed as text in CTE');
    assert.ok(finalQuery.includes('department text'), 'Department must be typed as text in CTE');
    assert.ok(finalQuery.includes('id int'), 'id must be typed as int');

    assert.equal(params.length, 1);
    const parsedPayload = JSON.parse(params[0]);
    assert.equal(parsedPayload.length, 3);
    assert.equal(parsedPayload[0].id, 1);
    assert.equal(parsedPayload[0].year, '1st Year');
    assert.equal(parsedPayload[0].hostel, 'Yes');
  });

  it('handles dataset with columns not explicitly listed in schema', () => {
    const query = 'SELECT * FROM DatasetRow';
    const dataset = [
      { id: 1, CustomColA: 'ValA', CustomColB: 'ValB' }
    ];

    const { finalQuery } = buildCteQuery(query, dataset, []);
    assert.ok(finalQuery.includes('customcola text'));
    assert.ok(finalQuery.includes('customcolb text'));
  });

  it('normalizes quoted "DatasetRow" references in user queries', () => {
    const query = 'SELECT "Department" FROM "DatasetRow" WHERE "Department" = \'CSE\'';
    const dataset = [{ id: 1, Department: 'CSE' }];

    const { finalQuery } = buildCteQuery(query, dataset);
    assert.ok(finalQuery.includes('FROM DatasetRow'), 'Quoted "DatasetRow" should be normalized to DatasetRow');
  });
});
