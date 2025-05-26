export const inferType = (value: string): string => {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === 'true' || trimmed === 'false') return 'boolean';

  const num = Number(trimmed);
  if (!isNaN(num)) {
    return Number.isInteger(num) ? 'integer' : 'double';
  }

  if (!isNaN(Date.parse(trimmed))) return 'datetime';

  return 'string';
};
