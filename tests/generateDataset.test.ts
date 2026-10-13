import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Dataset Generation and Column Management Integration', () => {
  it('preserves existing schema and populates values for all columns including added columns', async () => {
    // Simulate what /api/generate-dataset receives
    const reqBody = {
      rowCount: 15,
      schema: [
        { name: 'Department', cardinality: 3, distribution: 'Uniform' },
        { name: 'Year', cardinality: 4, distribution: 'Cyclic' },
        { name: 'Hostel', cardinality: 2, distribution: 'Random' },
        { name: 'GPA', cardinality: 4, distribution: 'Uniform' } // Added column
      ],
      prompt: ''
    };

    // Test POST logic
    const { POST } = await import('../src/app/api/generate-dataset/route');
    const mockRequest = new Request('http://localhost:3000/api/generate-dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });

    const res = await POST(mockRequest);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.ok(data.dataset && Array.isArray(data.dataset));
    assert.equal(data.dataset.length, 15);

    // Verify all columns are present in the returned dataset rows
    const firstRow = data.dataset[0];
    assert.ok('id' in firstRow);
    assert.ok('Department' in firstRow, 'Department must be in dataset');
    assert.ok('Year' in firstRow, 'Year must be in dataset');
    assert.ok('Hostel' in firstRow, 'Hostel must be in dataset');
    assert.ok('GPA' in firstRow, 'Newly added GPA column must be in dataset');

    // Verify returned column definitions
    const colNames = data.columns.map((c: any) => c.name);
    assert.ok(colNames.includes('Department'));
    assert.ok(colNames.includes('Year'));
    assert.ok(colNames.includes('Hostel'));
    assert.ok(colNames.includes('GPA'));
  });

  it('handles add column prompt and incorporates the new column', async () => {
    const reqBody = {
      rowCount: 10,
      schema: [
        { name: 'Department', cardinality: 3, distribution: 'Uniform' },
        { name: 'Year', cardinality: 4, distribution: 'Cyclic' }
      ],
      prompt: 'add a column for City'
    };

    const { POST } = await import('../src/app/api/generate-dataset/route');
    const mockRequest = new Request('http://localhost:3000/api/generate-dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });

    const res = await POST(mockRequest);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.dataset.length, 10);

    const firstRow = data.dataset[0];
    assert.ok('Department' in firstRow);
    assert.ok('Year' in firstRow);
    assert.ok('City' in firstRow, 'City column should be added to dataset');
  });
});
