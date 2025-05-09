import outdent from 'outdent'

export function html(params: {
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
  const text = escapeHTML(params.text).replaceAll('\n', '<br/>')
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

function escapeHTML(str: string){
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\'': '&#39;',
    '"': '&quot;'
  }[tag] ?? tag))
}