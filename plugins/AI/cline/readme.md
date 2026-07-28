# koishi-plugin-cline

[![npm](https://img.shields.io/npm/v/koishi-plugin-cline?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-cline)

基于 [@cline/sdk](https://github.com/cline/cline) 的 Koishi AI Agent 插件。

Bot 收到消息后,通用 Agent 接收用户指令,在内部迭代调用工具、评估结果,直到完成任务。

## 能力

- **命令执行**(run_commands):在配置的工作目录中执行 shell 命令
- **文件操作**(read_files / editor / search_codebase):读取、创建、编辑、搜索文件
- **网页抓取**(fetch_web_content)
- **MCP 工具**:读取工作目录下的 `.mcp.json`,将 MCP 服务器工具直接暴露给 Agent
- **多轮会话**:同一频道内保持上下文,`cline.clear` 重置
- **过程转播**:可按配置向用户展示 Agent 的思考与工具调用过程

## 触发方式

- 指令:`cline <任务>`
- 私聊(可配置)
- @机器人(可配置)

## 配置

| 配置项 | 说明 |
| --- | --- |
| providerId / apiKey / baseUrl / modelId | LLM 接入(默认 DeepSeek,OpenAI 兼容) |
| cwd | Agent 工作目录,文件操作与命令执行均在此进行 |
| tools.* | 各内置工具的启用开关 |
| autoApprove | 自动批准所有工具调用(关闭后危险操作需用户回复 y 确认) |
| processLevel | 过程反馈等级:none 仅最终结果 / tools 工具调用 / verbose +思考内容 / debug +工具输出与推理 |
| mcp.settingsPath | MCP 配置文件路径(默认 `<cwd>/.mcp.json`) |
| maxIterations | 单次任务最大迭代次数 |
