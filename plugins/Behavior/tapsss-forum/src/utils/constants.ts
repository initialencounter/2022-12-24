export const TIMING_LEVELS_MAP = [
  '雷帝', 'E', 'D',
  'C', 'B', 'A',
  'S', 'SS', 'SSS',
  '☆', '☆☆'
];
export const TIMING_LEVELS_COLOR = [
  '#DC281E', '#A3AFC2',
  '#607D8B', '#8BCA34',
  '#2196F3', '#673AB7',
  '#FF5722', '#FFBF00',
  '#FB7299', '#DC281E',
  '#DC281E'
];
export const TIMING_LEVELS_TEXT_COLOR = [
  '#FFFF00', '#FFFFFF',
  '#FFFFFF', '#FFFFFF',
  '#FFFFFF', '#FFFFFF',
  '#FFFFFF', '#FFFFFF',
  '#FFFFFF', '#FFFFFF',
  '#FFFFFF',
];

export const recordBgColor = ['#2A2124', '#202329', '#252525', '#292219', '#28261B'];
export const recordTextColor = ['#FB7299', '#5D9CEC', '#F15021', '#F18400', '#EEBF1D'];

export function formatTime(timeValMs: number): string {
  const date = new Date(timeValMs);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${m}-${d} ${h}:${min}`;
}

export function computeType(row: number, column: number, mine: number): string {
  if (row * column === 480 && mine === 99) return "高级";
  if (row === 16 && column === 16 && mine === 40) return "中级";
  if (row === 8 && column === 8 && mine === 10) return "初级";
  return `${row}x${column}x${mine}`;
}

export function computeNonoType(mine: number): string {
  if (mine === 27) return `初级`;
  if (mine === 64) return `中级`;
  if (mine === 90) return `高级`;
  if (mine === 148) return `专家`;
  return String(mine);
}

export function removeImagesAndLinksFromMarkdown(markdownText: string): string {
  let result = markdownText.replace(/!\[.*?]\(.*?\)/g, '');
  result = result.replace(/<img[^>]*>/g, '');
  result = result.replace(/\[(.*?)]\(.*?\)/g, '$1');
  result = result.replace(/<a\b[^>]*>(.*?)<\/a>/g, '$1');
  return result;
}

export function findHashWrappedStrings(input: string): string[] {
  const regex = /#([^#]+)#/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(input)) !== null) {
    matches.push(`#${match[1]}#`);
  }
  return matches;
}

export function removeHashWrappedStrings(input: string): string {
  return input.replace(/#[^#]+#/g, '');
}

export function extractImageLinksFromMarkdown(markdownText: string): string[] {
  const imageRegex = /!\[.*?]\((.*?)\)|<img[^>]+src="([^">]+)"/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = imageRegex.exec(markdownText)) !== null) {
    const link = match[1] || match[2];
    if (link) links.push(link);
  }
  return links;
}
