import type { LoaderDefinitionFunction } from 'webpack'
import * as qs from 'querystring'
import { VueLoaderOptions } from './'
import { formatError } from './formatError'
// import type { TemplateCompiler } from 'vue/compiler-sfc'
import { getDescriptor } from './descriptorCache'
import { resolveScript } from './resolveScript'
import { getOptions, resolveTemplateTSOptions } from './util'
import { compiler } from './compiler'

const { compileTemplate } = compiler
import * as TenonCompiler from '@hummer/tenon-compiler'

// Loader that compiles raw template into JavaScript functions.
// This is injected by the global pitcher (../pitch) for template
// selection requests initiated from vue files.
const TemplateLoader: LoaderDefinitionFunction = function (source, inMap: any) {
  source = String(source)
  const loaderContext = this
  // although this is not the main vue-loader, we can get access to the same
  // vue-loader options because we've set an ident in the plugin and used that
  // ident to create the request for this loader in the pitcher.
  const options = (getOptions(loaderContext) || {}) as VueLoaderOptions

  // const isServer = options.isServerBuild ?? loaderContext.target === 'node'
  // const isProd =
  //   loaderContext.mode === 'production' || process.env.NODE_ENV === 'production'
  const query = qs.parse(loaderContext.resourceQuery.slice(1))
  // 为了每个组件都在render时执行setScopedId方法,所以都默认传一个scopeId
  const scopeId = query.id as string
  // const scopeId = query.scoped ? `data-v-${query.id}` : null
  const descriptor = getDescriptor(loaderContext.resourcePath)
  const script = resolveScript(
    descriptor,
    query.id as string,
    options,
    loaderContext
  )

  // let templateCompiler: TemplateCompiler | undefined
  // if (typeof options.compiler === 'string') {
  //   templateCompiler = require(options.compiler)
  // } else {
  //   templateCompiler = options.compiler
  // }

  const compiled = compileTemplate({
    source,
    filename: loaderContext.resourcePath,
    inMap,
    id: scopeId,
    scoped: !!query.scoped,
    slotted: descriptor.slotted,
    compiler: TenonCompiler as any,
    compilerOptions: {
      ...options.compilerOptions,
      scopeId: `data-v-${scopeId}`,
      runtimeModuleName: '@hummer/tenon-vue',
      bindingMetadata: script ? script.bindings : undefined,
      ...resolveTemplateTSOptions(descriptor, options),
    },

    transformAssetUrls: options.transformAssetUrls || true,
  })

  // tips
  if (compiled.tips.length) {
    compiled.tips.forEach((tip) => {
      loaderContext.emitWarning(new Error(tip))
    })
  }

  // errors
  if (compiled.errors && compiled.errors.length) {
    compiled.errors.forEach((err) => {
      if (typeof err === 'string') {
        loaderContext.emitError(new Error(err))
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
  loaderContext.callback(null, code, map as any)
}

export default TemplateLoader
