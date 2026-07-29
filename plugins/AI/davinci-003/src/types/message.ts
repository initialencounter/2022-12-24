export interface Msg {
  role: string
  content: string
}

export interface Personality {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PersonalityConfig {
  name: string
  personality: Personality[]
}

export interface Payload {
  engine: string
  prompt: string
  temperature: number
  max_tokens?: number
  top_p: number
  frequency_penalty: number
  presence_penalty: number
}

export interface ModelUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  prompt_tokens_details?: {
    cached_tokens?: number
  }
  prompt_cache_hit_tokens?: number
  prompt_cache_miss_tokens?: number
}

export interface RunStats {
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  reasoningTokenCount?: number
  totalCost?: number
  durationMs: number
}

export interface ChatResult {
  output: string
  usage: ModelUsage
}
