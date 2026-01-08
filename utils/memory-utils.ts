
export const toHex = (value: bigint, prefix: boolean = true): string => {
  const hex = value.toString(16).toUpperCase().padStart(8, '0');
  // Add underscores for readability every 4 chars for large numbers
  const formatted = hex.replace(/\B(?=(\x{4})+(?!\x))/g, "_");
  return prefix ? `0x${hex}` : hex;
};

export const parseHex = (value: string): bigint => {
  try {
    const clean = value.replace(/^0x/i, '').replace(/_/g, '');
    if (!clean) return BigInt(0);
    return BigInt(`0x${clean}`);
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
  return `${size.toFixed(2).replace(/\.00$/, '')} ${units[unitIndex]}`;
};

export const parseHumanSize = (input: string): bigint => {
  const match = input.match(/^(\d+(?:\.\d+)?)\s*([KMGT]B?|B)?$/i);
  if (!match) return parseHex(input);
  
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
    'T': BigInt(1024 * 1024 * 1024) * BigInt(1024),
    'TB': BigInt(1024 * 1024 * 1024) * BigInt(1024),
  };
  
  return BigInt(Math.floor(val * Number(multipliers[unit] || 1)));
};

export const checkOverlap = (b1: {start: bigint, size: bigint}, b2: {start: bigint, size: bigint}) => {
  const end1 = b1.start + b1.size;
  const end2 = b2.start + b2.size;
  return b1.start < end2 && b2.start < end1;
};
