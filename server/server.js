const express = require('express')
const ReactSSR = require('react-dom/server')
const fs = require('fs')
const favicon = require('serve-favicon')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

const app = express()

app.use(favicon(path.join(__dirname, '../favicon.ico')))

if (!isDev) {
  const serverEnter = require('../dist/server-entry').default

  // 读取打包文件，指定‘utf8’才会读出string格式，否则是buffer
  const template = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8')

  // 处理静态文件请求
  app.use('/public', express.static(path.join(__dirname, '../dist')))
  // 从浏览器发出的任何请求，都让它返回服务端渲染的代码，服务端代码在server-entry.js里，所有需要引入它
  app.get('*', function (req, res) {
    const appString = ReactSSR.renderToString(serverEnter)
    res.send(template.replace('<!-- app -->', appString))
  })

} else {
  const devStatic = require('./util/dev-static')
  devStatic(app)
}
// 回调函数报告启动服务成功，启动命令放入package.json里
app.listen(7777, function () {
  console.log('server is listening on 7777')
})