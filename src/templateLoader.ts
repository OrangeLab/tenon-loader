import webpack from 'webpack'
import qs from 'querystring'
import loaderUtils from 'loader-utils'
import { VueLoaderOptions } from './'
import { formatError } from './formatError'
import { compileTemplate, TemplateCompiler } from '@vue/compiler-sfc'
import * as CompilerTenon from '@hummer/tenon-compiler'

// Loader that compiles raw template into JavaScript functions.
// This is injected by the global pitcher (../pitch) for template
// selection requests initiated from vue files.
const TemplateLoader: webpack.loader.Loader = function(source, inMap) {
  source = String(source)
  const loaderContext = this
  // although this is not the main vue-loader, we can get access to the same
  // vue-loader options because we've set an ident in the plugin and used that
  // ident to create the request for this loader in the pitcher.
  const options = (loaderUtils.getOptions(loaderContext) ||
    {}) as VueLoaderOptions

  // const isServer = loaderContext.target === 'node'
  // const isProduction = options.productionMode || loaderContext.minimize || process.env.NODE_ENV === 'production'
  const query = qs.parse(loaderContext.resourceQuery.slice(1))
  // 为了每个组件都在render时执行setScopedId方法,所以都默认传一个scopeId
  const scopeId = `data-v-${query.id}`
  // const scopeId = query.scoped ? `data-v-${query.id}` : null

  let compiler: TemplateCompiler | undefined
  if (typeof options.compiler === 'string') {
    compiler = require(options.compiler)
  } else {
    compiler = options.compiler
  }

  compiler = CompilerTenon
  const compiled = compileTemplate({
    id: scopeId,
    source,
    inMap,
    filename: loaderContext.resourcePath,
    compiler,
    compilerOptions: {
      ...options.compilerOptions,
      runtimeModuleName: '@hummer/tenon-vue',
      scopeId
    },

    transformAssetUrls: options.transformAssetUrls || true
  })

  // tips
  if (compiled.tips.length) {
    compiled.tips.forEach(tip => {
      loaderContext.emitWarning(tip)
    })
  }

  // errors
  if (compiled.errors && compiled.errors.length) {
    compiled.errors.forEach(err => {
      if (typeof err === 'string') {
        loaderContext.emitError(err)
      } else {
        formatError(
          err,
          inMap ? inMap.sourcesContent![0] : (source as string),
          loaderContext.resourcePath
        )
        loaderContext.emitError(err)
      }
    })
  }

  const { code, map } = compiled
  loaderContext.callback(null, code, map)
}

export default TemplateLoader
