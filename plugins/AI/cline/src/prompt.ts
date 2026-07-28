import { readFileSync } from 'fs'
import { join } from 'path'
import type { Config } from './config'
import { loadCore } from './sdk'

function readClinerules(cwd: string): string {
  try {
    return readFileSync(join(cwd, '.clinerules'), 'utf-8')
  } catch {
    return ''
  }
}

export async function buildSystemPrompt(config: Config): Promise<string> {
  const { getClineDefaultSystemPrompt } = await loadCore()
  const cwd = config.cwd || process.cwd()
  const rules = [readClinerules(cwd), config.customInstructions].filter(Boolean).join('\n\n')
  return getClineDefaultSystemPrompt({
    ide: 'Koishi Chatbot',
    mode: config.autoApprove ? 'yolo' : 'act',
    platform: process.platform,
    workspaceRoot: cwd,
    rules,
    providerId: config.providerId,
  })
}
