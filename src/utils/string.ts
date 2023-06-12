import crc32 from 'crc/crc32';

export function anonymise(input: string) {
  if (typeof input === 'string') {
    return crc32(input).toString(16);
  }
  return input;
}
