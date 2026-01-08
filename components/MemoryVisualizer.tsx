
import React, { useMemo } from 'react';
import { MemoryBlock } from '../types';
import { toHex, formatSize } from '../utils/memory-utils';

interface Props {
  blocks: MemoryBlock[];
  onSelect: (block: MemoryBlock) => void;
}

const MemoryVisualizer: React.FC<Props> = ({ blocks, onSelect }) => {
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => (a.startAddress < b.startAddress ? -1 : 1));
  }, [blocks]);

  const totalRange = useMemo(() => {
    if (sortedBlocks.length === 0) return BigInt(0);
    const min = sortedBlocks[0].startAddress;
    const max = sortedBlocks[sortedBlocks.length - 1].startAddress + sortedBlocks[sortedBlocks.length - 1].size;
    return max - min;
  }, [sortedBlocks]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 h-full overflow-hidden flex flex-col shadow-inner">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${blocks.length > 0 ? 'bg-cyan-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
        Physical Layout Preview
      </h3>
      
      <div className="flex-1 relative overflow-y-auto pr-2 min-h-[200px]">
        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-slate-100 dark:bg-slate-950/20">
            <svg className="w-10 h-10 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-700">Waiting for Data Input</p>
            <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-800">Visual mapping will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {sortedBlocks.map((block, idx) => {
              const safeTotalRange = totalRange === BigInt(0) ? BigInt(1) : totalRange;
              const heightFactor = Number(block.size) / Number(safeTotalRange);
              const minHeight = 40;
              const calculatedHeight = Math.max(minHeight, heightFactor * 800);
              
              const prevBlock = idx > 0 ? sortedBlocks[idx - 1] : undefined;
              const gap: bigint = prevBlock 
                ? (block.startAddress - (prevBlock.startAddress + prevBlock.size)) 
                : BigInt(0);
              
              return (
                <React.Fragment key={block.id}>
                  {gap > BigInt(0) && (
                    <div className="flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded py-2 opacity-30 text-[10px] mono text-slate-600 dark:text-slate-400">
                      UNMAPPED GAP: {formatSize(gap)}
                    </div>
                  )}
                  <div 
                    onClick={() => onSelect(block)}
                    className={`
                      group relative flex flex-col justify-center border transition-all cursor-pointer rounded-lg p-3
                      ${block.type === 'Reserved' ? 'bg-slate-200 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700' : 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]'}
                    `}
                    style={{ height: calculatedHeight }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs truncate max-w-[150px] text-slate-900 dark:text-slate-200">{block.name}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 mono">{block.type}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] mono text-slate-500 dark:text-slate-500">{toHex(block.startAddress)}</span>
                        <span className="text-[10px] mono text-cyan-600 dark:text-cyan-400">{toHex(block.startAddress + block.size - BigInt(1))}</span>
                      </div>
                      <span className="text-[10px] text-slate-600 dark:text-slate-500 font-medium">{formatSize(block.size)}</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryVisualizer;
