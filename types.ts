
export interface MemoryBlock {
  id: string;
  name: string;
  startAddress: bigint;
  size: bigint;
  description: string;
  type: 'Reserved' | 'SRAM' | 'FLASH' | 'Peripheral' | 'Stack' | 'Heap' | 'MMIO';
}

export interface MemoryMapState {
  blocks: MemoryBlock[];
}

export type SortOrder = 'asc' | 'desc';
