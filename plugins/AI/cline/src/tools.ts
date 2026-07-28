import type { AgentTool } from '@cline/shared'
import type { Config } from './config'
import { loadCore } from './sdk'

export interface KoishiTools {
  tools: AgentTool[]
  /** submit_and_exit 工具提交的最终总结 */
  getSubmitSummary: () => string | undefined
}

/**
 * 组装 Agent 内置工具:文件读写、命令执行、代码搜索、网页抓取、submit_and_exit。
 * 所有 executor 直接使用 @cline/core 的纯 Node 默认实现。
 */
export async function createKoishiTools(config: Config): Promise<KoishiTools> {
  const { createDefaultExecutors, createDefaultTools } = await loadCore()
  const cwd = config.cwd || process.cwd()
  let submitSummary: string | undefined

  const executors = {
    ...createDefaultExecutors(),
    // submit_and_exit:记录总结,供宿主作为最终结果输出
    submit: async (summary: string) => {
      submitSummary = summary
      return 'ok'
    },
    // ask_question 与 submit_and_exit 在 SDK 中互斥,这里选择 submit_and_exit;
    // Agent 需要澄清时会以文本结束本轮,用户回复后经 continue() 继续。
  }

  const tools = createDefaultTools({
    executors,
    cwd,
    enableReadFiles: config.tools.readFiles,
    enableSearch: config.tools.search,
    enableBash: config.tools.bash,
    enableEditor: config.tools.editor,
    enableWebFetch: config.tools.webFetch,
    enableSkills: config.tools.skills,
    enableAskQuestion: false,
    enableSubmitAndExit: true,
  })

  return { tools, getSubmitSummary: () => submitSummary }
}
