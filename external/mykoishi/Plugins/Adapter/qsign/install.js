const { apply, version_gocq_default } = require('./lib/index')
const { Context } = require('koishi')
apply(new Context(), { version_gocq: version_gocq_default, source: "https://gitee.com/initencunter/go-cqhttp-dev/releases/download" })