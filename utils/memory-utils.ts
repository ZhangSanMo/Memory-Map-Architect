
import { MemoryBlock } from '../types';

/**
 * Memory Utilities for high-precision address calculations.
 */

export const toHex = (value: bigint, prefix: boolean = true): string => {
  const hexValue = value.toString(16).toUpperCase().padStart(8, '0');
  return prefix ? `0x${hexValue}` : hexValue;
};

export const parseHex = (value: string): bigint => {
  if (!value) return BigInt(0);
  try {
    // Remove prefix and any non-hex characters like underscores for readability
    const clean = value.replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '');
    if (!clean) return BigInt(0);
    return BigInt('0x' + clean);
  } catch {
    return BigInt(0);
  }
};

export const formatSize = (bytes: bigint): string => {
  if (bytes === BigInt(0)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(bytes);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const formatted = size.toFixed(2).replace(/\.00$/, '');
  return `${formatted} ${units[unitIndex]}`;
};

export const parseHumanSize = (input: string): bigint => {
  if (!input) return BigInt(0);
  
  // Match standard human sizes like "1KB", "512 MB", "2.5G"
  const match = input.match(/^(\d+(?:\.\d+)?)\s*([KMGT]B?|B)?$/i);
  
  if (!match) {
    // Fallback to hex parsing if human size pattern doesn't match
    return parseHex(input);
  }
  
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  const multipliers: Record<string, bigint> = {
    'B': BigInt(1),
    'K': BigInt(1024),
    'KB': BigInt(1024),
    'M': BigInt(1024 * 1024),
    'MB': BigInt(1024 * 1024),
    'G': BigInt(1024 * 1024 * 1024),
    'GB': BigInt(1024 * 1024 * 1024),
    'T': BigInt(1024) * BigInt(1024 * 1024 * 1024),
    'TB': BigInt(1024) * BigInt(1024 * 1024 * 1024),
  };
  
  const mult = multipliers[unit] || BigInt(1);
  return BigInt(Math.floor(val * Number(mult)));
};

export const checkOverlap = (b1: {start: bigint, size: bigint}, b2: {start: bigint, size: bigint}): boolean => {
  const end1 = b1.start + b1.size;
  const end2 = b2.start + b2.size;
  return b1.start < end2 && b2.start < end1;
};

/**
 * Parse a Markdown table exported by copyAsMarkdown function.
 * Expected format:
 * | Region | Start Address | End Address | Size | Type | Description |
 * | :--- | :--- | :--- | :--- | :--- | :--- |
 * | FLASH_BOOT | 0x00000000 | 0x000003FF | 1 KB | FLASH | Boot region |
 */
export const parseMarkdownTable = (markdown: string): MemoryBlock[] => {
  const lines = markdown.trim().split('\n');
  const blocks: MemoryBlock[] = [];
  
  // Skip header and separator lines (first two lines)
  const dataLines = lines.filter((line, index) => {
    // Skip empty lines
    if (!line.trim()) return false;
    // Skip header line (contains "Region" or "Start Address")
    if (line.includes('Region') && line.includes('Start Address')) return false;
    // Skip separator line (contains only |, :, -, and spaces)
    if (/^[\s|:\-]+$/.test(line)) return false;
    return true;
  });
  
  const validTypes: MemoryBlock['type'][] = ['Reserved', 'SRAM', 'FLASH', 'Peripheral', 'Stack', 'Heap', 'MMIO'];
  
  for (const line of dataLines) {
    // Split by | and filter empty cells
    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
    
    if (cells.length >= 5) {
      const [name, startAddr, endAddr, size, type, ...descParts] = cells;
      const description = descParts.join(' | ').trim() || `${name} region`;
      
      // Validate type
      const blockType = validTypes.includes(type as MemoryBlock['type'])
        ? (type as MemoryBlock['type'])
        : 'SRAM';
      
      const startAddress = parseHex(startAddr);
      const endAddress = parseHex(endAddr);
      
      // Calculate size from start and end addresses
      const calculatedSize = endAddress >= startAddress
        ? endAddress - startAddress + 1n
        : parseHumanSize(size);
      
      blocks.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        startAddress,
        size: calculatedSize,
        type: blockType,
        description: description.trim()
      });
    }
  }
  
  // Sort by start address
  return blocks.sort((a, b) => (a.startAddress < b.startAddress ? -1 : 1));
};
