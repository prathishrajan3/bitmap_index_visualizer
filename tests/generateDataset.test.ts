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

  it('renames generic added column (e.g. Column 4) to domain-relevant attribute (Campus) and generates realistic values', async () => {
    const reqBody = {
      rowCount: 12,
      schema: [
        { name: 'Department', cardinality: 3, distribution: 'Uniform' },
        { name: 'Year', cardinality: 4, distribution: 'Cyclic' },
        { name: 'Hostel', cardinality: 2, distribution: 'Random' },
        { name: 'Column 4', cardinality: 3, distribution: 'Uniform' }
      ],
      prompt: ''
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
    assert.equal(data.dataset.length, 12);

    const colNames = data.columns.map((c: any) => c.name);
    assert.ok(!colNames.includes('Column 4'), 'Column 4 should be renamed to a relevant domain attribute');
    assert.ok(colNames.includes('Campus'), 'Column 4 should be renamed to Campus in university domain');

    // Verify dataset rows contain the renamed column
    const firstRow = data.dataset[0];
    assert.ok('Campus' in firstRow, 'Campus should be a key in the dataset');
    assert.ok(!('Column 4' in firstRow), 'Column 4 should not be in the dataset');

    // Verify values are realistic domain values, NOT dummy "Column 4 A"
    const campusValues = data.dataset.map((r: any) => r.Campus);
    assert.ok(campusValues.some((v: string) => v.includes('Campus') || v === 'Downtown'));
    assert.ok(!campusValues.some((v: string) => v.includes('Column 4')));
  });

  it('renames generic added column in hospital domain to relevant hospital attribute', async () => {
    const reqBody = {
      rowCount: 8,
      schema: [
        { name: 'Ward', cardinality: 4, distribution: 'Uniform' },
        { name: 'Severity', cardinality: 3, distribution: 'Skewed' },
        { name: 'Column 3', cardinality: 3, distribution: 'Uniform' }
      ],
      prompt: ''
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
    const colNames = data.columns.map((c: any) => c.name);
    assert.ok(!colNames.includes('Column 3'));
    assert.ok(colNames.includes('RoomType') || colNames.includes('Risk') || colNames.includes('Gender'));
  });
});
