import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface BTreeNode {
  id: string;
  keys: number[];
  children?: BTreeNode[];
  isLeaf?: boolean;
}

// Educational static B-Tree structure for a generic integer column
const bTreeData: BTreeNode = {
  id: 'root',
  keys: [50],
  children: [
    {
      id: 'L1',
      keys: [20, 35],
      children: [
        { id: 'L2-1', keys: [5, 10, 15], isLeaf: true },
        { id: 'L2-2', keys: [25, 30], isLeaf: true },
        { id: 'L2-3', keys: [40, 45], isLeaf: true }
      ]
    },
    {
      id: 'R1',
      keys: [75, 90],
      children: [
        { id: 'R2-1', keys: [55, 60, 70], isLeaf: true },
        { id: 'R2-2', keys: [80, 85], isLeaf: true },
        { id: 'R2-3', keys: [95, 100], isLeaf: true }
      ]
    }
  ]
};

export function BTreeVisualizer() {
  const [searchValue, setSearchValue] = useState<number>(30);
  const [traversalPath, setTraversalPath] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>('');

  const simulateSearch = () => {
    const path: string[] = [];
    const target = searchValue;
    
    let currentNode: BTreeNode | undefined = bTreeData;
    let desc = "Search begins at the Root Node.\n";
    
    while (currentNode) {
      path.push(currentNode.id);
      
      // Find the first key that is greater than or equal to target
      let i = 0;
      while (i < currentNode.keys.length && target > currentNode.keys[i]) {
        i++;
      }

      if (i < currentNode.keys.length && target === currentNode.keys[i]) {
        desc += `Found exact match ${target} in node ${currentNode.id}. `;
        if (currentNode.isLeaf) {
          desc += `This is a leaf node; it contains the direct pointer (Row ID) to the heap table.`;
        } else {
          desc += `Following internal pointer down to find the leaf...`;
          if (currentNode.children) currentNode = currentNode.children[i + 1];
        }
        break; // Simplified educational break
      } else if (currentNode.isLeaf) {
        desc += `Reached leaf node ${currentNode.id}, but exact value ${target} is not present. Search ends.`;
        break;
      } else {
        desc += `${target} is ${i === 0 ? 'less than' : 'between'} keys in node ${currentNode.id}. Following pointer ${i} downwards.\n`;
        currentNode = currentNode.children?.[i];
      }
    }

    setTraversalPath(path);
    setExplanation(desc);
  };

  const renderNode = (node: BTreeNode) => {
    const isVisited = traversalPath.includes(node.id);
    
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className={`border-2 rounded-md p-2 flex gap-2 font-mono text-sm transition-colors duration-500
          ${isVisited ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-neutral-700 bg-neutral-900 text-neutral-400'}
        `}>
          {node.keys.map((k, i) => (
            <span key={i} className="px-1 border-r border-neutral-700/50 last:border-0">{k}</span>
          ))}
        </div>
        
        {node.children && (
          <div className="flex gap-4 mt-8 relative">
            {/* Draw connecting lines conceptually using borders */}
            <div className="absolute top-[-32px] left-[50%] w-px h-8 bg-neutral-700"></div>
            <div className="absolute top-[-16px] left-[10%] right-[10%] h-px bg-neutral-700"></div>
            
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-blue-900/20 border border-blue-800 text-blue-300 p-4 rounded text-sm leading-relaxed">
        <strong>Educational Simulation:</strong> This represents a standard B-Tree index (used in PostgreSQL by default), which is structurally different from a Bitmap Index. B-Trees are excellent for high-cardinality unique data, but consume significantly more space.
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg overflow-x-auto">
          <div className="flex justify-center min-w-[800px]">
            {renderNode(bTreeData)}
          </div>
        </div>

        <div className="w-80 border border-neutral-800 bg-neutral-900/50 p-6 rounded-lg flex flex-col shrink-0">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Traversal Controls</h3>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="number" 
              value={searchValue} 
              onChange={e => setSearchValue(Number(e.target.value))}
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded p-2 text-sm outline-none focus:border-amber-500"
            />
            <button 
              onClick={simulateSearch}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 rounded transition-colors flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-4 text-sm leading-relaxed text-neutral-300 overflow-y-auto whitespace-pre-wrap">
            {explanation || "Enter a value and click search to simulate B-Tree traversal."}
          </div>
        </div>
      </div>
    </div>
  );
}
