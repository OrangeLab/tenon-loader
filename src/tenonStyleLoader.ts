import type { LoaderDefinitionFunction } from 'webpack'
import { compileStyle } from './style'
import * as qs from 'querystring'

const StylePostLoader: LoaderDefinitionFunction = function (source: string) {
  const query = qs.parse(this.resourceQuery.slice(1))
  const { id, scoped } = query
  const scopedId = `data-v-${id}`

  let code = compileStyle(source, {
    scoped: scoped === 'true' ? true : false,
    id: scopedId,
  })
  return code
}

export default StylePostLoader
