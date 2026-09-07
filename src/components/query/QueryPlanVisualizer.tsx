import React, { useState, useCallback } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, useNodesState, useEdgesState, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Info } from 'lucide-react';

const initialNodes: Node[] = [
  { 
    id: '1', 
    position: { x: 250, y: 50 }, 
    data: { label: 'SQL: SELECT * FROM DatasetRow\nWHERE Year = 2 AND Hostel = true' },
    style: { background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px' }
  },
  { 
    id: '2', 
    position: { x: 100, y: 150 }, 
    data: { label: 'Bitmap Index Lookup\n(Year = 2)' },
    style: { background: '#0f172a', color: '#60a5fa', border: '1px solid #1e3a8a', borderRadius: '8px' }
  },
  { 
    id: '3', 
    position: { x: 400, y: 150 }, 
    data: { label: 'Bitmap Index Lookup\n(Hostel = true)' },
    style: { background: '#0f172a', color: '#60a5fa', border: '1px solid #1e3a8a', borderRadius: '8px' }
  },
  { 
    id: '4', 
    position: { x: 250, y: 250 }, 
    data: { label: 'Bitmap AND' },
    style: { background: '#064e3b', color: '#34d399', border: '1px solid #047857', borderRadius: '8px' }
  },
  { 
    id: '5', 
    position: { x: 250, y: 350 }, 
    data: { label: 'Bitmap to Row IDs\n(Extraction)' },
    style: { background: '#4c1d95', color: '#a78bfa', border: '1px solid #5b21b6', borderRadius: '8px' }
  },
  { 
    id: '6', 
    position: { x: 250, y: 450 }, 
    data: { label: 'Heap Table Fetch\n(Fetch records by ID)' },
    style: { background: '#7f1d1d', color: '#f87171', border: '1px solid #991b1b', borderRadius: '8px' }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e4-5', source: '4', target: '5', animated: true },
  { id: 'e5-6', source: '5', target: '6', animated: true }
];

export function QueryPlanVisualizer() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeData, setSelectedNodeData] = useState<string | null>(null);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    let explanation = "";
    switch(node.id) {
      case '1': explanation = "The query parser reads the SQL and identifies two predicates joined by an AND operator."; break;
      case '2': explanation = "Instead of scanning the whole table, the engine looks up the pre-calculated bitmap vector for Year = 2."; break;
      case '3': explanation = "Simultaneously, it looks up the bitmap vector for Hostel = true."; break;
      case '4': explanation = "The execution engine performs a lightning-fast bitwise AND operation on the two vectors. 1 AND 1 = 1 (match), everything else is 0."; break;
      case '5': explanation = "The resulting bitmap (e.g. 01001) is translated into actual Row IDs (Row 2, Row 5) that satisfy the query."; break;
      case '6': explanation = "The database visits the actual physical table blocks to fetch the full row data for Row 2 and Row 5."; break;
    }
    setSelectedNodeData(explanation);
  }, []);

  return (
    <div className="h-[600px] border border-neutral-800 rounded-lg bg-neutral-950 flex relative">
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          colorMode="dark"
          className="bg-neutral-900/20"
        >
          <Background color="#334155" gap={16} size={1} />
          <Controls />
          <Panel position="top-right" className="bg-blue-900/40 text-blue-300 p-2 rounded text-xs border border-blue-800">
            Click nodes to inspect execution
          </Panel>
        </ReactFlow>
      </div>

      <div className="w-80 border-l border-neutral-800 bg-neutral-900/50 p-6 flex flex-col shrink-0">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" /> Node Inspector
        </h3>
        
        {selectedNodeData ? (
          <div className="text-sm leading-relaxed text-neutral-300">
            {selectedNodeData}
          </div>
        ) : (
          <div className="text-sm text-neutral-500 italic">
            Select a node in the graph to see its educational execution details.
          </div>
        )}
      </div>
    </div>
  );
}
