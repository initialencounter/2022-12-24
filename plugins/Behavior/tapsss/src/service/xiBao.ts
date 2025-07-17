import {Context, Service} from "koishi";
import {XiBaoConfig} from "../types/xibao";
import outdent from 'outdent'
import {readFileSync} from 'fs'
import path from 'path'
import Puppeteer  from "koishi-plugin-puppeteer";

declare module 'koishi' {
  interface Context {
    puppeteer: Puppeteer;
  }
}

const img = readFileSync(path.resolve(__dirname, './xiBao.jpg'))

class XiBao extends Service {
  static inject = ['puppeteer']
  private readonly pluginConfig: XiBaoConfig;
  constructor(ctx: Context, config: XiBaoConfig) {
    super(ctx, 'xiBao');
    this.pluginConfig = config;
  }

  html(params: {
    text: string,
    fontFamily: string,
    fontColor: string,
    strokeColor: string,
    maxFontSize: number,
    minFontSize: number,
    offsetWidth: number,
    img: Buffer,
    importCSS: string
  }) {
    const text = this.escapeHTML(params.text).replaceAll('\n', '<br/>')
    return outdent`
  <head>
    <style>
      @import url('${params.importCSS}');
      body {
        width: 960px;
        height: 768px;
        padding: 0 32;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        margin: 0;
        font-weight: 900;
        font-family: ${params.fontFamily};
        color: ${params.fontColor};
        -webkit-text-stroke: 2.5px ${params.strokeColor};
        background-image: url(data:image/png;base64,${params.img.toString('base64')});
        background-repeat: no-repeat;
      }
    </style>
  </head>
  <body>
    <div>${text}</div>
  </body>
  <script>
    const dom = document.querySelector('body')
    const div = dom.querySelector('div')
    let fontSize = ${params.maxFontSize}
    dom.style.fontSize = fontSize + 'px'
    while (div.offsetWidth >= ${params.offsetWidth} && fontSize > ${params.minFontSize}) {
      dom.style.fontSize = --fontSize + 'px'
    }
  </script>`
  }

  escapeHTML(str: string) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '\'': '&#39;',
      '"': '&quot;'
    }[tag] ?? tag))
  }

  async render(text: string) {
    const config = this.pluginConfig;
    return await this.ctx.puppeteer.render(
      this.html({
        text,
        fontFamily: config.xiBao.fontFamily,
        fontColor: '#ff0a0a',
        strokeColor: '#ffde00',
        maxFontSize: config.xiBao.maxFontSize,
        minFontSize: config.xiBao.minFontSize,
        offsetWidth: config.xiBao.offsetWidth,
        img,
        importCSS: config.advanced.importCSS === 'custom' ? config.advanced.custom : config.advanced.importCSS
      })
    )
  }

}


export default XiBao;
