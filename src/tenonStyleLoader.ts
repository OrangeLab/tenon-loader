import webpack from 'webpack'
import { compileStyle } from './style'
import qs from 'querystring'

const StylePostLoader: webpack.loader.Loader = function(source: string) {
  const query = qs.parse(this.resourceQuery.slice(1))
  const { id, scoped } = query
  const scopedId = `data-v-${id}`

  let code = compileStyle(source, {
    scoped: scoped === 'true' ? true : false,
    id: scopedId
  })
  return code
}

export default StylePostLoader
