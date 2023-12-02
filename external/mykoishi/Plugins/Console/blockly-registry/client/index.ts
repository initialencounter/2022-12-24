import { Context } from '@koishijs/client'
import Market from './market.vue'
import { } from 'koishi-plugin-blockly-registry'
import {BlocklyDocument} from 'koishi-plugin-blockly'
import './icon'
declare module '@koishijs/plugin-console' {
  interface Events {
    'blockly-registry/upload'(plugin_id: number,desc:string,version:string): Promise<string>
    'blockly-registry/install'(plugin_name: string,plugin_version:string): Promise<string>
    'blockly-registry/query'(): Promise<BlocklyDocument[]>
    'blockly-registry/query-cloud'(): Promise<Packages[]>
    'blockly-registry/query-version'(plugin_name:string): Promise<string[]>
    'blockly-registry/cloud-text'():Promise<string>
    'blockly-registry/init'():Promise<(Packages[]|string|BlocklyDocument[])[]>
  }
}
export interface Packages {
  name: string;
  version: string;
  desc: string;
  author: string;
  isinstalled: boolean;
}

export default (ctx: Context) => {
  ctx.page({
    id: 'blockly-registry',
    path: '/blockly-registry',
    name: 'blockly镜像站',
    order: 0,
    authority: 4,
    icon: 'blk-registry',
    component: Market,
  })
}
