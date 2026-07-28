import { Context } from '@koishijs/client'
import Page from './page.vue'
import './icon'

import 'virtual:uno.css'

// if you used v1.0.5 or latster ,you should add import "vue3-json-viewer/dist/index.css"
import "vue3-json-viewer/dist/vue3-json-viewer.css";
import JsonViewer from "vue3-json-viewer";

export default (ctx: Context) => {
  ctx.app.use(JsonViewer);
  ctx.page({
    name: 'MCP 服务器',
    path: '/mcp-servers',
    icon: 'Cline',
    component: Page,
  })
}
