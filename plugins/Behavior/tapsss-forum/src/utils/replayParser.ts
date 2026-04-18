import pako from 'pako';

export interface ActionRecord {
  action: number;
  column: number;
  row: number;
  time: number;
}

export function parseReplayHandle(base64Str: string): ActionRecord[] {
  const binaryString = window.atob(base64Str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const decompressed = pako.inflate(bytes, { to: 'string' });
  // The string is likely separated by '-' and fields by ':' e.g., "0:1:1:0-0:0:4:496-..."
  const segments = decompressed.split('-');
  const actions: ActionRecord[] = [];

  for (const seg of segments) {
    if (!seg) continue;
    const parts = seg.split(':');
    if (parts.length === 4) {
      actions.push({
        action: parseInt(parts[0] as string, 10),
        row: parseInt(parts[1] as string, 10) + 1,
        column: parseInt(parts[2] as string, 10) + 1,
        time: parseInt(parts[3] as string, 10) / 1000 // Convert ms to s
      });
    }
  }

  return actions;
}
