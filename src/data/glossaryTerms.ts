export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type Category = 
  | 'Core Bitmap'
  | 'Data Characteristics'
  | 'Bitmap Operations'
  | 'Compression'
  | 'Query Execution'
  | 'B-Tree'
  | 'Advanced';

export interface GlossaryTerm {
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  difficulty: Difficulty;
  shortDefinition: string;
  inOneSentence: string;
  beginnerExplanation: string;
  technicalExplanation: string;
  whyItMatters?: string;
  example?: string;
  formula?: string;
  commonConfusion?: { term: string; distinction: string }[];
  vivaQuestion?: string;
  vivaAnswer?: string;
  relatedTerms: string[];
  usedIn: string[];
  realWorldContext?: string;
  interactiveExampleType?: 'Cardinality' | 'Density' | 'Selectivity' | 'BitmapAnd' | 'BitmapOr' | 'BitmapNot' | 'RLE' | 'TableScan' | 'BTree' | 'BitmapVector';
  route?: string;
}

export const GLOSSARY_CATEGORIES: Category[] = [
  'Core Bitmap',
  'Data Characteristics',
  'Bitmap Operations',
  'Compression',
  'Query Execution',
  'B-Tree',
  'Advanced'
];

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: 'bitmap-index',
    name: 'Bitmap Index',
    aliases: ['bitmap'],
    category: 'Core Bitmap',
    difficulty: 'Intermediate',
    shortDefinition: 'A database index that represents matching rows using bitmap structures.',
    inOneSentence: 'An index that uses bitmap representations to identify qualifying rows.',
    beginnerExplanation: 'Instead of keeping a long list of row numbers for every value, a bitmap index creates a sequence of bits (0s and 1s) for each possible value. If the 5th bit is a 1, it means the 5th row has that value.',
    technicalExplanation: 'A bitmap index is an indexing structure that uses bit arrays to represent the presence or absence of a value in a column for each row in a relation. It allows rapid logical operations (AND, OR, NOT) directly on the bit arrays.',
    whyItMatters: 'Bitmap indexes can efficiently represent and combine conditions, particularly for low-cardinality attributes and analytical workloads, significantly speeding up complex queries.',
    commonConfusion: [
      { term: 'Bitmap Vector', distinction: 'A Bitmap Index is the entire indexing structure. A Bitmap Vector is the specific bit array associated with a single value within that index.' }
    ],
    vivaQuestion: 'What makes a bitmap index different from a traditional B-Tree index?',
    vivaAnswer: 'A bitmap index uses bit arrays to represent row membership for distinct values, enabling fast bitwise operations for multi-predicate queries, whereas a B-Tree uses a balanced tree structure storing individual pointers, which is better for high-cardinality exact matches.',
    relatedTerms: ['bitmap-vector', 'cardinality', 'selectivity', 'bitwise-and', 'heap-table-fetch'],
    usedIn: ['Dataset', 'Matrix', 'Algebra', 'Compression', 'Query Plan', 'Compare'],
    realWorldContext: 'Bitmap indexes are heavily used in data warehouses and analytical systems where queries combine multiple low-cardinality filters.',
    interactiveExampleType: 'BitmapVector',
    route: 'Matrix'
  },
  {
    id: 'bitmap-vector',
    name: 'Bitmap Vector',
    aliases: ['bit array', 'bit string'],
    category: 'Core Bitmap',
    difficulty: 'Intermediate',
    shortDefinition: 'A sequence of bits where each position corresponds to a row.',
    inOneSentence: 'A string of 0s and 1s representing whether each row satisfies a specific condition.',
    beginnerExplanation: 'Think of a bitmap vector as a checklist. If you have 10 rows, the vector has 10 spots. A 1 means "Yes, this row matches", and a 0 means "No, it does not match".',
    technicalExplanation: 'A contiguous array of bits where the bit at index N represents the boolean state of a predicate for the Nth physical row (or row ID) in a database table.',
    whyItMatters: 'Vectors allow CPUs to evaluate query conditions using extremely fast bitwise hardware instructions instead of comparing values row by row.',
    vivaQuestion: 'How does the position of a bit in a bitmap vector relate to the underlying table?',
    vivaAnswer: 'The bit position directly maps to a physical or logical Row ID in the underlying table, allowing the database to instantly locate the data block once a bit is identified as set.',
    relatedTerms: ['bitmap-index', 'row-id', 'density', 'sparse-bitmap', 'dense-bitmap'],
    usedIn: ['Matrix', 'Algebra', 'Compare'],
    interactiveExampleType: 'BitmapVector'
  },
  {
    id: 'bitmap-index-lookup',
    name: 'Bitmap Index Lookup',
    aliases: ['index lookup', 'bitmap scan'],
    category: 'Query Execution',
    difficulty: 'Intermediate',
    shortDefinition: 'The process of retrieving the appropriate bitmap vector for a given query condition.',
    inOneSentence: 'Finding the specific string of 0s and 1s that answers a WHERE condition.',
    beginnerExplanation: 'When you ask the database for "Year = 2", it does not check the table yet. First, it looks up the pre-calculated bitmap vector for "Year = 2" from the index.',
    technicalExplanation: 'The access path step where the database traverses the index structure (often a specialized B-tree) to locate and retrieve the bitmap vector corresponding to a specific key value.',
    whyItMatters: 'This is the first step in bitmap query execution. It prevents the need to scan the entire table to find qualifying rows.',
    relatedTerms: ['bitmap-index', 'query-execution-plan', 'access-path'],
    usedIn: ['Query Plan', 'Compare'],
    route: 'QueryPlan'
  },
  {
    id: 'cardinality',
    name: 'Cardinality',
    aliases: ['distinct values', 'unique values'],
    category: 'Data Characteristics',
    difficulty: 'Beginner',
    shortDefinition: 'The number of distinct, unique values in a column.',
    inOneSentence: 'How many different unique values exist in a specific column.',
    beginnerExplanation: 'If you have a "Coin Flip" column, it only has two possible values: Heads or Tails. That means its cardinality is 2. If you have a "Student ID" column where every student is unique, its cardinality is very high.',
    technicalExplanation: 'The cardinality of a column is the number of distinct values in its domain relative to the specific dataset. It determines the number of bitmap vectors required to index the column.',
    whyItMatters: 'Bitmap indexes are generally most effective for low-cardinality attributes. High cardinality requires many bitmaps, which can consume significant memory and reduce compression efficiency.',
    example: 'Hostel → {true, false}. Cardinality = 2',
    commonConfusion: [
      { term: 'Selectivity', distinction: 'Cardinality is the number of unique values in a column. Selectivity is the fraction of rows that match a specific query condition.' }
    ],
    vivaQuestion: 'Why are bitmap indexes typically recommended for low-cardinality columns?',
    vivaAnswer: 'Because a bitmap index creates a vector for every distinct value. If cardinality is high, it creates too many vectors, consuming excessive space and reducing the efficiency of bitwise operations. Low cardinality keeps the index compact and efficient.',
    relatedTerms: ['selectivity', 'bitmap-index', 'density', 'low-cardinality', 'high-cardinality'],
    usedIn: ['Dataset', 'Compare'],
    realWorldContext: 'Gender, Status, and Region are classic examples of low-cardinality columns perfect for bitmap indexing.',
    interactiveExampleType: 'Cardinality',
    route: 'Dataset'
  },
  {
    id: 'selectivity',
    name: 'Selectivity',
    aliases: ['filter factor'],
    category: 'Data Characteristics',
    difficulty: 'Intermediate',
    shortDefinition: 'The fraction of rows that satisfy a query condition.',
    inOneSentence: 'How small the result set is compared with the total table.',
    beginnerExplanation: 'If a query asks for "All students in Year 2", and there are 10 students but only 3 are in Year 2, the query is quite selective (it filters out 70% of the data).',
    technicalExplanation: 'Selectivity is the ratio of rows satisfying a predicate to the total number of rows. It is a value between 0 and 1. Highly selective predicates return very few rows (values closer to 0).',
    formula: 'Selectivity = Matching Rows / Total Rows',
    whyItMatters: 'Selectivity drives the query optimizer. If a query is not very selective (returns almost all rows), scanning the whole table might actually be faster than using an index.',
    vivaQuestion: 'How does selectivity influence the choice between a table scan and an index scan?',
    vivaAnswer: 'If a query has low selectivity (returns most rows), the overhead of reading the index and then fetching heap blocks exceeds the cost of a sequential table scan. Indexes are preferred for highly selective queries.',
    relatedTerms: ['cardinality', 'query-optimizer', 'table-scan', 'cost-estimation'],
    usedIn: ['Compare'],
    interactiveExampleType: 'Selectivity',
    route: 'Compare'
  },
  {
    id: 'density',
    name: 'Density',
    aliases: ['bitmap density', 'fill factor'],
    category: 'Data Characteristics',
    difficulty: 'Intermediate',
    shortDefinition: 'The proportion of set bits (1s) to total bits in a bitmap vector.',
    inOneSentence: 'What percentage of a bitmap vector is made of 1s instead of 0s.',
    beginnerExplanation: 'A dense bitmap has a lot of 1s. A sparse bitmap is mostly 0s.',
    technicalExplanation: 'Density is the ratio of set bits (population count) to the total length of the bitmap. It directly affects the performance of compression algorithms like RLE.',
    formula: 'Density = Number of 1 bits / Total bits',
    whyItMatters: 'Density determines compression ratio. Extremely sparse or extremely dense bitmaps compress very well with Run-Length Encoding. Highly alternating bitmaps (moderate density around 50%) compress poorly.',
    relatedTerms: ['sparse-bitmap', 'dense-bitmap', 'run-length-encoding', 'compression-ratio'],
    usedIn: ['Compression'],
    interactiveExampleType: 'Density',
    route: 'Compression'
  },
  {
    id: 'bitwise-and',
    name: 'Bitwise AND',
    aliases: ['bitmap AND', 'logical AND'],
    category: 'Bitmap Operations',
    difficulty: 'Beginner',
    shortDefinition: 'An operation that combines vectors, resulting in 1 only if BOTH input bits are 1.',
    inOneSentence: 'A fast hardware operation that keeps a row only if it matches all combined conditions.',
    beginnerExplanation: 'To find students who are "Year 2 AND in a Hostel", we take the bitmap for "Year 2" and the bitmap for "Hostel". We line them up. Only rows that have a 1 in BOTH bitmaps get a 1 in the final result.',
    technicalExplanation: 'A CPU-level operation applied sequentially to words (e.g., 64-bit blocks) of two bitmap vectors. It resolves SQL logical AND predicates without needing to evaluate the complex condition row-by-row.',
    whyItMatters: 'It is the primary reason bitmap indexes are so fast for complex analytical queries. CPUs can process 64 or 128 rows in a single clock cycle using bitwise operations.',
    commonConfusion: [
      { term: 'SQL AND', distinction: 'SQL AND is a logical Boolean operator in a query predicate. Bitwise AND is the physical operation used to execute it when using bitmap vectors.' }
    ],
    vivaQuestion: 'Why is Bitwise AND so efficient for executing complex queries?',
    vivaAnswer: 'Because it leverages low-level CPU instructions to process multiple rows simultaneously (word-aligned processing), avoiding branching and row-by-row predicate evaluation overhead.',
    relatedTerms: ['bitwise-or', 'bitwise-not', 'bitmap-combination'],
    usedIn: ['Algebra', 'Query Plan', 'Compare'],
    interactiveExampleType: 'BitmapAnd',
    route: 'Algebra'
  },
  {
    id: 'bitwise-or',
    name: 'Bitwise OR',
    aliases: ['bitmap OR', 'logical OR'],
    category: 'Bitmap Operations',
    difficulty: 'Beginner',
    shortDefinition: 'An operation that combines vectors, resulting in 1 if ANY input bit is 1.',
    inOneSentence: 'A fast hardware operation that keeps a row if it matches at least one condition.',
    beginnerExplanation: 'To find students who are "Year 2 OR in a Hostel", we take both bitmaps. If a row has a 1 in EITHER bitmap, it gets a 1 in the final result.',
    technicalExplanation: 'A CPU-level bitwise operation used to efficiently evaluate SQL logical OR conditions by merging multiple bitmap vectors into a candidate row set.',
    whyItMatters: 'OR conditions are notoriously slow to evaluate with traditional B-Trees, but are resolved almost instantly using bitwise OR on bitmap vectors.',
    relatedTerms: ['bitwise-and', 'bitmap-combination'],
    usedIn: ['Algebra'],
    interactiveExampleType: 'BitmapOr',
    route: 'Algebra'
  },
  {
    id: 'bitwise-not',
    name: 'Bitwise NOT',
    aliases: ['bitmap NOT', 'logical NOT', 'inversion'],
    category: 'Bitmap Operations',
    difficulty: 'Beginner',
    shortDefinition: 'An operation that flips all bits in a vector (1 becomes 0, 0 becomes 1).',
    inOneSentence: 'Flipping a bitmap to quickly find rows that DO NOT match a condition.',
    beginnerExplanation: 'If you want everyone who is NOT in a hostel, you just take the "Hostel" bitmap and flip every 1 to a 0, and every 0 to a 1.',
    technicalExplanation: 'A unary bitwise operation used to evaluate SQL NOT or != conditions by inverting the bits of an existing vector.',
    whyItMatters: 'It completely eliminates the need to scan the table to find non-matching records, provided NULL semantics are handled correctly.',
    relatedTerms: ['bitwise-and', 'bitmap-combination'],
    usedIn: ['Algebra'],
    interactiveExampleType: 'BitmapNot',
    route: 'Algebra'
  },
  {
    id: 'run-length-encoding',
    name: 'Run-Length Encoding (RLE)',
    aliases: ['RLE', 'bitmap compression'],
    category: 'Compression',
    difficulty: 'Intermediate',
    shortDefinition: 'A compression algorithm that stores sequences of identical bits as a single value and count.',
    inOneSentence: 'A compression technique that stores repeated values as "runs" to save space.',
    beginnerExplanation: 'Instead of storing "0000000000", RLE just stores "Ten 0s". This makes the bitmap index much smaller, especially for large tables.',
    technicalExplanation: 'A form of lossless data compression where runs (sequences of the same data value) are stored as a single data value and count, rather than as the original run. Word-Aligned Hybrid (WAH) is a common database variant of RLE.',
    whyItMatters: 'Without compression, a bitmap index for a 1-billion-row table requires 125MB per distinct value. RLE significantly shrinks this footprint, making the index cacheable and I/O efficient.',
    vivaQuestion: 'When does Run-Length Encoding fail to compress a bitmap effectively?',
    vivaAnswer: 'RLE fails when the bitmap is highly alternating (e.g., 10101010), because there are no long contiguous runs of identical bits to summarize, potentially increasing the storage size due to metadata overhead.',
    relatedTerms: ['compression-ratio', 'density', 'sparse-bitmap', 'dense-bitmap'],
    usedIn: ['Compression'],
    realWorldContext: 'Modern databases like Oracle and Postgres (via extensions) use advanced variants of RLE like WAH or Roaring Bitmaps to compress indexes.',
    interactiveExampleType: 'RLE',
    route: 'Compression'
  },
  {
    id: 'compression-ratio',
    name: 'Compression Ratio',
    aliases: ['compression factor'],
    category: 'Compression',
    difficulty: 'Intermediate',
    shortDefinition: 'The ratio comparing the uncompressed data size to the compressed data size.',
    inOneSentence: 'A number showing how much smaller the data became after compression.',
    beginnerExplanation: 'If a bitmap originally took 100 bytes, and after compression it takes 25 bytes, the compression ratio is 4.0x.',
    technicalExplanation: 'A metric used to quantify the reduction in data-representation size produced by a compression algorithm like RLE.',
    formula: 'Compression Ratio = Uncompressed Size / Compressed Size',
    whyItMatters: 'A higher compression ratio means less disk I/O to read the index into memory, which is a primary performance bottleneck in databases.',
    relatedTerms: ['run-length-encoding', 'density'],
    usedIn: ['Compression'],
    route: 'Compression'
  },
  {
    id: 'table-scan',
    name: 'Table Scan',
    aliases: ['sequential scan', 'seq scan'],
    category: 'Query Execution',
    difficulty: 'Beginner',
    shortDefinition: 'A query execution strategy that examines every row in a table.',
    inOneSentence: 'Reading the entire table from top to bottom to find matching rows.',
    beginnerExplanation: 'A table scan is like reading an entire book to find a specific word, instead of using the index at the back of the book.',
    technicalExplanation: 'A database access path where the executor sequentially reads every page/block of a table to evaluate a predicate against each row.',
    whyItMatters: 'It is the fallback strategy when no index exists or when the query optimizer decides an index scan would be too expensive (e.g., due to low selectivity).',
    vivaQuestion: 'Is a table scan always slower than an index scan?',
    vivaAnswer: 'No. If a query requires reading a large percentage of the table (low selectivity), a sequential table scan is often faster than an index scan because it avoids random I/O and index traversal overhead.',
    relatedTerms: ['access-path', 'query-execution-plan', 'heap-table-fetch'],
    usedIn: ['Query Plan', 'Compare'],
    interactiveExampleType: 'TableScan',
    route: 'Compare'
  },
  {
    id: 'heap-table-fetch',
    name: 'Heap Table Fetch',
    aliases: ['heap fetch', 'table access by index rowid'],
    category: 'Query Execution',
    difficulty: 'Intermediate',
    shortDefinition: 'The physical retrieval of table rows after identifying their locations via an index.',
    inOneSentence: 'Going to the actual table to get the full row data after the index tells you where to look.',
    beginnerExplanation: 'The bitmap index only tells you WHICH rows match (e.g., Row 5 and 9). To get the actual data (like the student name), the database must perform a Heap Table Fetch to grab Rows 5 and 9 from the main table.',
    technicalExplanation: 'The phase of query execution where the database uses Row IDs (TIDs) extracted from an index to access the underlying heap storage (table blocks) and retrieve the projected column values.',
    whyItMatters: 'This is often the most expensive part of an indexed query. If a query requires fetching millions of scattered rows from the heap, the random I/O cost will be immense.',
    commonConfusion: [
      { term: 'Index Scan', distinction: 'An Index Scan traverses the index. A Heap Table Fetch is the subsequent step of actually visiting the table data.' }
    ],
    vivaQuestion: 'Why does a query optimizer sometimes ignore an index even if one exists?',
    vivaAnswer: 'Because the cost of the Heap Table Fetch (which involves random disk I/O for each matching row) might exceed the cost of sequentially reading the entire table into memory via a Table Scan.',
    relatedTerms: ['row-id-extraction', 'table-scan', 'access-path', 'cost-estimation'],
    usedIn: ['Query Plan', 'Compare'],
    route: 'Compare'
  },
  {
    id: 'row-id-extraction',
    name: 'Row ID Extraction',
    aliases: ['TID extraction', 'bitmap to row ID'],
    category: 'Bitmap Operations',
    difficulty: 'Advanced',
    shortDefinition: 'The process of converting the set bits in a resulting bitmap into physical Row IDs.',
    inOneSentence: 'Translating the final string of 1s and 0s back into actual row numbers.',
    beginnerExplanation: 'After we do our Bitwise AND and get our final bitmap (e.g., 0 1 0 0 1), we have to convert that back into a list: "Go fetch Row 2 and Row 5".',
    technicalExplanation: 'The translation layer where a logical bitmap is iterated to identify the ordinal positions of set bits, generating a set of Tuple Identifiers (TIDs) that can be used to address physical heap blocks.',
    whyItMatters: 'It bridges the gap between the logical bitmap operations and the physical table storage.',
    relatedTerms: ['bitmap-vector', 'heap-table-fetch', 'row-id'],
    usedIn: ['Query Plan', 'Compare'],
    route: 'QueryPlan'
  },
  {
    id: 'b-tree-index',
    name: 'B-Tree Index',
    aliases: ['balanced tree', 'btree'],
    category: 'B-Tree',
    difficulty: 'Intermediate',
    shortDefinition: 'A balanced tree data structure used widely as the default database index.',
    inOneSentence: 'The standard database index that organizes data like a balanced tree for fast exact and range lookups.',
    beginnerExplanation: 'A B-Tree organizes data in a sorted tree. When searching for the number 50, it starts at the top, asks "Is 50 less than or greater than 100?", and navigates down the branches until it finds the exact row.',
    technicalExplanation: 'A self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time. It is optimized for systems that read and write large blocks of data.',
    whyItMatters: 'While bitmap indexes excel at low-cardinality data and complex AND/OR queries, B-Trees are universally superior for high-cardinality exact matches (like Primary Keys) and range queries (like "Date > 2023").',
    vivaQuestion: 'When would you choose a B-Tree index over a Bitmap index?',
    vivaAnswer: 'I would choose a B-Tree for high-cardinality columns (like IDs or emails), for workloads with heavy concurrent inserts/updates (as bitmaps suffer from locking issues), and for range queries.',
    relatedTerms: ['bitmap-index', 'b-tree-node', 'leaf-node'],
    usedIn: ['B-Tree Lab', 'Compare'],
    realWorldContext: 'B-Trees are the default index created when you define a PRIMARY KEY in almost any relational database.',
    interactiveExampleType: 'BTree',
    route: 'BTree'
  },
  {
    id: 'query-execution-plan',
    name: 'Query Execution Plan',
    aliases: ['explain plan', 'query plan'],
    category: 'Query Execution',
    difficulty: 'Intermediate',
    shortDefinition: 'The sequence of steps chosen by the database engine to execute a SQL query.',
    inOneSentence: 'The roadmap the database optimizer creates to find your data as efficiently as possible.',
    beginnerExplanation: 'When you send a SQL query, the database first acts like a GPS planner, mapping out the best route to get your data. This route is the Query Execution Plan.',
    technicalExplanation: 'A tree of operations generated by the query optimizer detailing the access paths, join algorithms, and execution order required to resolve a SQL statement optimally based on cost estimations.',
    whyItMatters: 'Understanding execution plans is the most important skill for a database engineer to debug slow queries and verify that indexes are actually being used.',
    relatedTerms: ['query-optimizer', 'cost-estimation', 'access-path', 'table-scan'],
    usedIn: ['Query Plan'],
    route: 'QueryPlan'
  },
  {
    id: 'sparse-bitmap',
    name: 'Sparse Bitmap',
    aliases: ['low density bitmap'],
    category: 'Data Characteristics',
    difficulty: 'Intermediate',
    shortDefinition: 'A bitmap vector containing very few 1s and predominantly 0s.',
    inOneSentence: 'A bitmap vector that is almost entirely made of 0s.',
    beginnerExplanation: 'If you have a column for "Has Won Nobel Prize" in a dataset of normal people, the bitmap will be almost entirely 0s. This is a sparse bitmap.',
    technicalExplanation: 'A bitmap with low density. Sparse bitmaps compress extremely well using Run-Length Encoding because they contain massive contiguous runs of zeros.',
    relatedTerms: ['dense-bitmap', 'density', 'run-length-encoding'],
    usedIn: ['Compression'],
    route: 'Compression'
  },
  {
    id: 'dense-bitmap',
    name: 'Dense Bitmap',
    aliases: ['high density bitmap'],
    category: 'Data Characteristics',
    difficulty: 'Intermediate',
    shortDefinition: 'A bitmap vector containing a high proportion of 1s.',
    inOneSentence: 'A bitmap vector that is predominantly made of 1s.',
    beginnerExplanation: 'If you have a column for "Is Human" in a dataset of normal people, the bitmap will be almost entirely 1s. This is a dense bitmap.',
    technicalExplanation: 'A bitmap with high density. Like sparse bitmaps, highly dense bitmaps compress very well because they contain long runs of ones.',
    relatedTerms: ['sparse-bitmap', 'density', 'run-length-encoding'],
    usedIn: ['Compression'],
    route: 'Compression'
  },
  {
    id: 'row-id',
    name: 'Row ID',
    aliases: ['TID', 'Tuple Identifier'],
    category: 'Query Execution',
    difficulty: 'Beginner',
    shortDefinition: 'A unique physical or logical identifier for a specific row in a database table.',
    inOneSentence: 'The exact physical address or number of a row in the database.',
    beginnerExplanation: 'If the database is a filing cabinet, the Row ID is the specific drawer, folder, and paper number where a record is physically stored.',
    technicalExplanation: 'A Tuple Identifier (TID) consisting of a block/page number and an offset within that block, allowing the database engine to directly access the physical memory location of a row.',
    whyItMatters: 'Indexes (both Bitmap and B-Tree) do not store the actual row data; they store the Row IDs. They are pointers to the real data.',
    relatedTerms: ['heap-table-fetch', 'row-id-extraction'],
    usedIn: ['Matrix', 'Compare']
  },
  {
    id: 'bitmap-combination',
    name: 'Bitmap Combination',
    aliases: ['vector combination'],
    category: 'Bitmap Operations',
    difficulty: 'Intermediate',
    shortDefinition: 'The process of merging multiple bitmap vectors using logical operations.',
    inOneSentence: 'Using AND, OR, and NOT to combine multiple bitmaps to answer complex queries.',
    beginnerExplanation: 'Bitmap indexes are powerful because you can grab the bitmap for "Age > 20" and the bitmap for "City = NY" and combine them instantly before ever looking at the actual data table.',
    technicalExplanation: 'The phase in bitmap index query execution where the executor performs bitwise boolean algebra on multiple retrieved bitmaps to resolve multi-predicate WHERE clauses prior to row fetch.',
    relatedTerms: ['bitwise-and', 'bitwise-or', 'bitwise-not'],
    usedIn: ['Algebra', 'Query Plan']
  },
  {
    id: 'sequential-scan',
    name: 'Sequential Scan',
    aliases: ['seq scan'],
    category: 'Query Execution',
    difficulty: 'Beginner',
    shortDefinition: 'PostgreSQL specific terminology for a Table Scan.',
    inOneSentence: 'PostgreSQL\'s term for reading a table from start to finish.',
    beginnerExplanation: 'It is the exact same thing as a Table Scan. PostgreSQL calls it a Sequential Scan because it reads the storage blocks sequentially.',
    technicalExplanation: 'The physical access path in PostgreSQL that sequentially reads through all pages of a relation from the heap, evaluating filter conditions on every tuple.',
    relatedTerms: ['table-scan', 'access-path'],
    usedIn: ['Compare'],
    route: 'Compare'
  },
  {
    id: 'access-path',
    name: 'Access Path',
    aliases: ['scan method'],
    category: 'Advanced',
    difficulty: 'Advanced',
    shortDefinition: 'The specific technique the database uses to retrieve rows for a query.',
    inOneSentence: 'The method chosen by the database (like Table Scan vs Index Scan) to find your data.',
    beginnerExplanation: 'If you want to find a book in a library, your access path could be "Walk every aisle" (Table Scan) or "Look in the catalog" (Index Scan).',
    technicalExplanation: 'The physical implementation chosen by the query optimizer to retrieve tuples from a relation, such as Seq Scan, Index Scan, Bitmap Heap Scan, or Index Only Scan.',
    relatedTerms: ['query-execution-plan', 'table-scan', 'query-optimizer'],
    usedIn: ['Query Plan']
  },
  {
    id: 'predicate',
    name: 'Predicate',
    aliases: ['condition', 'filter'],
    category: 'Query Execution',
    difficulty: 'Beginner',
    shortDefinition: 'A condition in a SQL query used to determine which rows qualify.',
    inOneSentence: 'The rule in your WHERE clause that filters the data.',
    beginnerExplanation: 'In the query `SELECT * FROM Students WHERE Year = 2`, the predicate is `Year = 2`.',
    technicalExplanation: 'A logical expression that evaluates to TRUE, FALSE, or UNKNOWN. The query executor evaluates predicates against tuples to filter the result set.',
    relatedTerms: ['selectivity', 'bitwise-and', 'table-scan'],
    usedIn: ['Dataset', 'Compare']
  },
  {
    id: 'low-cardinality',
    name: 'Low Cardinality',
    aliases: [],
    category: 'Data Characteristics',
    difficulty: 'Beginner',
    shortDefinition: 'An attribute with very few distinct values compared with the number of rows.',
    inOneSentence: 'A column that repeats the same few values over and over.',
    beginnerExplanation: 'A "Gender" column in a table of a billion people only has a few distinct values. This is low cardinality.',
    technicalExplanation: 'A column whose distinct value count is extremely small relative to the relation size. These are the optimal targets for bitmap indexes.',
    relatedTerms: ['cardinality', 'bitmap-index', 'high-cardinality'],
    usedIn: ['Dataset', 'Matrix']
  },
  {
    id: 'high-cardinality',
    name: 'High Cardinality',
    aliases: [],
    category: 'Data Characteristics',
    difficulty: 'Beginner',
    shortDefinition: 'An attribute with many distinct values, often unique to each row.',
    inOneSentence: 'A column where almost every value is unique.',
    beginnerExplanation: 'A "Student ID" or "Email" column where no two rows have the same value.',
    technicalExplanation: 'A column with a high number of distinct values. Bitmap indexes degrade in performance and storage efficiency on high cardinality columns, making B-Trees the preferred structure.',
    relatedTerms: ['cardinality', 'low-cardinality', 'b-tree-index'],
    usedIn: ['Dataset']
  },
  {
    id: 'query-optimizer',
    name: 'Query Optimizer',
    aliases: ['planner'],
    category: 'Advanced',
    difficulty: 'Advanced',
    shortDefinition: 'The database component that determines the most efficient way to execute a query.',
    inOneSentence: 'The brain of the database that decides whether to use an index or scan the table.',
    beginnerExplanation: 'The query optimizer acts like a GPS routing engine. It looks at the query, looks at the indexes, and estimates whether using a bitmap index or doing a table scan will be faster.',
    technicalExplanation: 'A complex cost-based engine that evaluates multiple valid algebraic execution plans for a SQL statement and selects the one with the lowest estimated execution cost based on statistics.',
    whyItMatters: 'An index is useless if the optimizer refuses to use it. Understanding optimizer decisions is key to database tuning.',
    vivaQuestion: 'Why might a Query Optimizer choose a sequential scan over an available bitmap index?',
    vivaAnswer: 'The optimizer relies on table statistics. If the selectivity is low (meaning a large percentage of rows match the predicate), the estimated cost of index traversal plus random heap fetches will exceed the cost of sequentially scanning the heap.',
    relatedTerms: ['cost-estimation', 'query-execution-plan', 'selectivity'],
    usedIn: ['Query Plan', 'Compare']
  },
  {
    id: 'cost-estimation',
    name: 'Cost Estimation',
    aliases: ['optimizer cost'],
    category: 'Advanced',
    difficulty: 'Advanced',
    shortDefinition: 'The mathematical model used by the optimizer to predict how much work an execution plan will take.',
    inOneSentence: 'The database\'s educated guess on how long a query will take.',
    beginnerExplanation: 'The database calculates "points" for different actions. Reading from disk costs more points than reading from memory. It calculates the total points for an Index Scan vs a Table Scan and picks the winner.',
    technicalExplanation: 'The process of assigning abstract cost units to plan nodes based on estimated disk I/O, CPU cycles, and memory usage. It relies heavily on up-to-date table statistics.',
    relatedTerms: ['query-optimizer', 'query-execution-plan'],
    usedIn: ['Query Plan']
  },
  {
    id: 'candidate-rows',
    name: 'Candidate Rows',
    aliases: ['qualifying rows'],
    category: 'Query Execution',
    difficulty: 'Intermediate',
    shortDefinition: 'Rows that have been identified by an index as potentially matching the query, but haven\'t been fetched yet.',
    inOneSentence: 'Rows that the index says we should check out.',
    beginnerExplanation: 'When the Bitmap AND operation finishes, the resulting 1s tell us which rows are candidate rows. We then fetch them to ensure they truly have the data we want.',
    technicalExplanation: 'Tuples whose IDs have been yielded by an access method (like a bitmap index scan) and are now pending heap fetch and potentially further Recheck conditions.',
    relatedTerms: ['heap-table-fetch', 'row-id-extraction'],
    usedIn: ['Compare']
  },
  {
    id: 'b-tree-node',
    name: 'B-Tree Node',
    aliases: ['node', 'internal node'],
    category: 'B-Tree',
    difficulty: 'Advanced',
    shortDefinition: 'A block of data in a B-Tree structure containing keys and pointers to child nodes.',
    inOneSentence: 'A routing block inside a B-Tree that helps narrow down the search.',
    beginnerExplanation: 'In a B-Tree, an internal node acts like a signpost. It says "Values less than 50 go left, values greater than 50 go right".',
    technicalExplanation: 'A logical page within a B-Tree index containing an array of pivot keys and child pointers, guiding the search traversal down to the leaf level.',
    relatedTerms: ['b-tree-index', 'leaf-node'],
    usedIn: ['B-Tree Lab']
  },
  {
    id: 'leaf-node',
    name: 'Leaf Node',
    aliases: [],
    category: 'B-Tree',
    difficulty: 'Advanced',
    shortDefinition: 'The bottom-most nodes in a B-Tree that contain the actual index keys and row pointers.',
    inOneSentence: 'The bottom of the B-Tree where the actual Row IDs are stored.',
    beginnerExplanation: 'After following the signposts (internal nodes) down the tree, you reach the leaf node. This is the destination that actually tells you where the data is stored on disk.',
    technicalExplanation: 'The lowest level of a B-Tree index containing the indexed key values and the Tuple Identifiers (TIDs) pointing to the physical heap tuples.',
    relatedTerms: ['b-tree-index', 'b-tree-node'],
    usedIn: ['B-Tree Lab']
  }
];
