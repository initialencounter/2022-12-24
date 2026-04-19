import type { ActionRecord } from '@/types/response/RecordGet';
import type { SchulteActionRecord } from '@/types/response/SchulteRecordGetResponse';
import pako from 'pako';


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

export function parseSchulteReplayHandle(base64Str: string): SchulteActionRecord[] {
  const binaryString = window.atob(base64Str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const decompressed = pako.inflate(bytes, { to: 'string' });
  const segments = decompressed.split('-');
  const actions: SchulteActionRecord[] = [];
  for (const seg of segments) {
    if (!seg) continue;
    const parts = seg.split(':');
    if (parts.length >= 3) {
      actions.push({
        idx: parseInt(parts[0] as string) - 1,
        right: parseInt(parts[1] as string) as 0 | 1,
        time: parseInt(parts[2] as string)
      });
    }
  }
  return actions;
}
