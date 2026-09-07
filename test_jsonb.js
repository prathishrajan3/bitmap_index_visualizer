const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const json = JSON.stringify([{ id: 1, Department: 'CSE', Year: '2024' }]);
  const query = `
    WITH "DatasetRow" AS (
      SELECT * FROM jsonb_to_recordset($1::jsonb) AS x("id" int, "Department" text, "Year" text)
    )
    SELECT "Department", "Year" FROM "DatasetRow" WHERE "Department" = 'CSE'
  `;
  try {
    const res = await prisma.$queryRawUnsafe(query, json);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
