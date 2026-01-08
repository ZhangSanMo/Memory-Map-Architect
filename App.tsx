
import React, { useState, useMemo, useRef } from 'react';
import { MemoryBlock } from './types';
import { toHex, parseHex, parseHumanSize, formatSize } from './utils/memory-utils';
import MemoryVisualizer from './components/MemoryVisualizer';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  derivedValue?: string;
  isDerived?: boolean;
  id?: string;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, value, onChange, placeholder, derivedValue, isDerived, id 
}) => (
  <div className={`space-y-1 relative group flex-1`}>
    <label className={`text-[10px] font-bold uppercase ml-1 ${isDerived ? 'text-cyan-600' : 'text-slate-500'}`}>
      {label} {isDerived && <span className="text-[8px] bg-cyan-950 px-1 rounded ml-1">Auto</span>}
    </label>
    <div className="relative">
      <input 
        id={id}
        type="text" 
        disabled={isDerived}
        value={isDerived ? derivedValue : value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={isDerived ? "Calculating..." : placeholder} 
        className={`
          w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all mono
          ${isDerived 
            ? 'bg-slate-900/50 border-slate-800 border-dashed text-slate-500 cursor-not-allowed' 
            : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-500 placeholder:text-slate-800'}
        `}
      />
      {!isDerived && value && (
        <button 
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  </div>
);

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<MemoryBlock[]>([]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newType, setNewType] = useState<MemoryBlock['type']>('SRAM');
  const [newDesc, setNewDesc] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const activeFields = useMemo(() => {
    const fields = [];
    if (newStart.trim()) fields.push('start');
    if (newEnd.trim()) fields.push('end');
    if (newSize.trim()) fields.push('size');
    return fields;
  }, [newStart, newEnd, newSize]);

  const derivation = useMemo(() => {
    const s = parseHex(newStart);
    const e = parseHex(newEnd);
    const sz = parseHumanSize(newSize);

    if (activeFields.length === 2) {
      if (!activeFields.includes('end')) {
        return { target: 'end', value: toHex(s + sz - 1n) };
      }
      if (!activeFields.includes('size')) {
        const calculatedSize = e >= s ? e - s + 1n : 0n;
        return { target: 'size', value: formatSize(calculatedSize).replace(/\s/g, '') };
      }
      if (!activeFields.includes('start')) {
        const calculatedStart = e >= sz - 1n ? e - sz + 1n : 0n;
        return { target: 'start', value: toHex(calculatedStart) };
      }
    }
    return null;
  }, [newStart, newEnd, newSize, activeFields]);

  const hasConflict = activeFields.length === 3;
  const canCommit = activeFields.length >= 2 && !hasConflict && newName.trim();

  const handleCommit = () => {
    if (!canCommit) return;
    const finalStart = derivation?.target === 'start' ? parseHex(derivation.value) : parseHex(newStart);
    const finalSize = derivation?.target === 'size' ? parseHumanSize(derivation.value) : parseHumanSize(newSize);

    if (editingId) {
      setBlocks(prev => prev.map(b => 
        b.id === editingId 
          ? { ...b, name: newName, startAddress: finalStart, size: finalSize, type: newType, description: newDesc }
          : b
      ).sort((a, b) => (a.startAddress < b.startAddress ? -1 : 1)));
    } else {
      const block: MemoryBlock = {
        id: crypto.randomUUID(),
        name: newName,
        startAddress: finalStart,
        size: finalSize,
        type: newType,
        description: newDesc || `${newName} region`
      };
      setBlocks(prev => [...prev, block].sort((a, b) => (a.startAddress < b.startAddress ? -1 : 1)));
    }
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewStart('');
    setNewEnd('');
    setNewSize('');
    setNewDesc('');
    setEditingId(null);
  };

  const handleEdit = (block: MemoryBlock) => {
    setEditingId(block.id);
    setNewName(block.name);
    setNewStart(toHex(block.startAddress));
    setNewSize(formatSize(block.size).replace(/\s/g, ''));
    setNewEnd('');
    setNewType(block.type);
    setNewDesc(block.description);
    nameInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSequenceNext = (block: MemoryBlock) => {
    const nextStart = block.startAddress + block.size;
    resetForm();
    setNewStart(toHex(nextStart));
    nameInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyAsMarkdown = () => {
    if (blocks.length === 0) return;
    let md = "| Region | Start Address | End Address | Size | Type | Description |\n";
    md += "| :--- | :--- | :--- | :--- | :--- | :--- |\n";
    [...blocks].sort((a,b) => a.startAddress < b.startAddress ? -1 : 1).forEach(b => {
      md += `| ${b.name} | ${toHex(b.startAddress)} | ${toHex(b.startAddress + b.size - 1n)} | ${formatSize(b.size)} | ${b.type} | ${b.description} |\n`;
    });
    navigator.clipboard.writeText(md).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-500/30">
      <header className="bg-slate-950 border-b border-slate-800 px-8 py-4 sticky top-0 z-50 flex justify-between items-center backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
            <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Memory Map Architect <span className="text-cyan-400">Pro</span></h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Embedded System Design Suite</p>
          </div>
        </div>
        <button 
          onClick={copyAsMarkdown}
          disabled={blocks.length === 0}
          className={`px-6 py-2 text-sm font-bold rounded-full transition-all border flex items-center gap-2 ${
            copyStatus === 'copied' ? 'bg-green-500 text-slate-950 border-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 disabled:opacity-30'
          }`}
        >
          {copyStatus === 'copied' ? 'Copied Markdown' : 'Export Table'}
        </button>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-8 p-8 overflow-hidden max-w-[1600px] mx-auto w-full">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          <section className={`bg-slate-900 border transition-all duration-500 rounded-2xl p-6 shadow-2xl relative overflow-hidden ${hasConflict ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : editingId ? 'border-amber-500/50 shadow-amber-900/10' : 'border-slate-800 shadow-cyan-900/5'}`}>
            {hasConflict && <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest z-10 animate-pulse">Conflict: Please clear one address-related field</div>}
            <div className="flex flex-col gap-5">
              <div className="flex gap-4">
                <div className="flex-[2] space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Block Name</label>
                  <input ref={nameInputRef} type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. SRAM_L" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none transition-all" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Type</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value as MemoryBlock['type'])} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none">
                    <option>SRAM</option><option>FLASH</option><option>Reserved</option><option>Peripheral</option><option>Stack</option><option>Heap</option><option>MMIO</option>
                  </select>
                </div>
              </div>
              <div className={`flex gap-4 p-4 rounded-xl border transition-all ${hasConflict ? 'bg-red-950/20 border-red-500/50' : 'bg-slate-950/30 border-slate-800/50'}`}>
                <InputField label="Start Address" value={newStart} onChange={setNewStart} placeholder="0x00000000" isDerived={derivation?.target === 'start'} derivedValue={derivation?.value} />
                <InputField label="End Address" value={newEnd} onChange={setNewEnd} placeholder="0x000003FF" isDerived={derivation?.target === 'end'} derivedValue={derivation?.value} />
                <InputField label="Size" value={newSize} onChange={setNewSize} placeholder="1KB" isDerived={derivation?.target === 'size'} derivedValue={derivation?.value} />
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                   <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Description</label>
                   <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Region purpose..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none transition-all" />
                </div>
                <div className="flex gap-2">
                  {editingId && <button onClick={resetForm} className="h-[38px] px-4 rounded-lg font-bold bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all border border-slate-700">Cancel</button>}
                  <button onClick={handleCommit} disabled={!canCommit} className={`h-[38px] px-8 rounded-lg font-bold transition-all flex items-center gap-2 ${canCommit ? (editingId ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20') : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                    {editingId ? 'Update Block' : 'Commit Block'}
                  </button>
                </div>
              </div>
            </div>
          </section>
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
                  <tr>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Range (Hex)</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Size</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {blocks.length > 0 ? (
                    blocks.map(block => (
                      <tr key={block.id} className={`group hover:bg-slate-800/40 transition-colors ${editingId === block.id ? 'bg-cyan-900/10' : ''}`}>
                        <td className="p-4">
                          <span className="font-bold text-slate-200 text-sm">{block.name}</span>
                          <div className="text-[10px] text-slate-600 mt-1 italic">{block.description}</div>
                        </td>
                        <td className="p-4 mono text-[13px] leading-relaxed">
                          <div className="text-cyan-500/80">{toHex(block.startAddress)}</div>
                          <div className="text-slate-600">{toHex(block.startAddress + block.size - 1n)}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">{formatSize(block.size)}</span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleSequenceNext(block)} className="w-8 h-8 flex items-center justify-center rounded-lg text-cyan-500 hover:bg-cyan-500 hover:text-slate-950 transition-all" title="Next Start"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
                            <button onClick={() => handleEdit(block)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-950 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                            <button onClick={() => setBlocks(prev => prev.filter(b => b.id !== block.id))} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-red-500 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-700 italic text-sm">Memory Map is empty.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
          <MemoryVisualizer blocks={blocks} onSelect={(b) => handleEdit(b)} />
        </div>
      </main>
    </div>
  );
};

export default App;
