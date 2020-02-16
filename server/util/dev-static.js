const axios = require('axios')
const webpack = require('webpack')
const path = require('path')
const MemoryFs = require('memory-fs')
const ReactDomServer = require('react-dom/server')
const proxy = require('http-proxy-middleware')

const serverConfig = require('../../build/webpack.config.server')

const getTemplate = () => {
  return new Promise((resolve, reject) => {
    axios.get('http://localhost:8888/public/index.html')
      .then(res => {
        resolve(res.data)
      })
      .catch(reject) // 出现问题
  })
}
const Module = module.constructor // 使用module的构造函数创建新的Module
const mfs = new MemoryFs

const serverCompiler = webpack(serverConfig)
serverCompiler.outputFileSystem = mfs
let serverBundle

serverCompiler.watch({}, (err, status) => {
  if (err) {
    throw err
  }
  status = status.toJson()
  status.errors.forEach(err => {
    console.error(err)
  })
  status.warnings.forEach(warn => {
    console.warn(warn)
  })

  // 获取bundle文件路径
  const bundlePath = path.join(
    serverConfig.output.path,
    serverConfig.output.filename
  )
  const bundle = mfs.readFileSync(bundlePath, 'utf-8')
  const m = new Module()
  m._compile(bundle, 'server-entry.js')
  serverBundle = m.exports.default

})

module.exports = function (app) {
  app.use('/public', proxy({
    target: 'http://localhost:8888'
  }))
  app.get('*', function (req, res) {
    getTemplate().then(template => {
      const content = ReactDomServer.renderToString(serverBundle)
      res.send(template.replace('<!-- app -->', content))
    })
  })
}