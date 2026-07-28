/**
 * @cline/* 是纯 ESM 包(exports 只声明 import 条件),
 * 而本插件产物为 CJS,无法直接 require。
 * 这里通过运行时动态 import 加载(esbuild 不会改写 new Function 里的 import),
 * 类型则通过 type-only import 在编译期获得。
 */

export type ClineCore = typeof import('@cline/core')
export type ClineAgents = typeof import('@cline/agents')

const importer = new Function('name', 'return import(name)') as <T>(name: string) => Promise<T>

let corePromise: Promise<ClineCore> | undefined
let agentsPromise: Promise<ClineAgents> | undefined

export function loadCore(): Promise<ClineCore> {
  return (corePromise ??= importer<ClineCore>('@cline/core'))
}

export function loadAgents(): Promise<ClineAgents> {
  return (agentsPromise ??= importer<ClineAgents>('@cline/agents'))
}
