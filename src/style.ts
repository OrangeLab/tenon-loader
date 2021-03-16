import postcss, { Root, Rule } from 'postcss'
import { styleTransformer } from '@hummer/tenon-utils'

enum MatchType {
  Class,
  ID,
  Attr
}
interface RuleNode {
  selector: string
  relation: string
  matchType: MatchType
  style: Record<string, string>
}
interface RuleSet {
  tagList: Array<RuleNode>
  classList: Array<RuleNode>
  idList: Array<RuleNode>
  attrList: Array<RuleNode>
}

interface RuleSetMap {
  global: RuleSet
  [key: string]: RuleSet
}

interface CompileStyleOptions {
  scoped: boolean
  id?: string
}
const isClassSelectorReg = /^\./
const isTagSelectorReg = /\[.+\]/
const isAttrSelectorReg = /\[.+\]/
const isIDSelectorReg = /^\#/

/**
 * 针对Class的Selector进行特殊处理
 * 支持的Selectors如下：
 * 基础选择器：
 * #id ID选择器
 * .class Class选择器
 * view Tag选择器
 * 复杂选择器：属性选择器
 * .class[attr] 属性选择器
 * @param selector
 */
function handleSelector(
  ruleSetMap: RuleSetMap,
  selector: string,
  node: Rule,
  options: CompileStyleOptions
) {
  let selectorList = selector.split(/\s/).filter(item => !!item)
  let lastSelector = selectorList.pop() as string
  let style = getRuleStyle(node)
  let { scoped, id = '' } = options
  if (isTagSelectorReg.test(lastSelector)) {
    return
  }
  if (isClassSelectorReg.test(lastSelector)) {
    let className = lastSelector.slice(1)
    let classRule = {
      selector: className,
      matchType: MatchType.Class,
      relation: '',
      style: style
    }
    // 处理样式隔离问题
    if (scoped) {
      if (!ruleSetMap[id]) {
        ruleSetMap[id] = {
          tagList: [],
          classList: [],
          idList: [],
          attrList: []
        }
      }
      ruleSetMap[id].classList.push(classRule)
    } else {
      ruleSetMap.global.classList.push(classRule)
    }
    return
  }
  if (isAttrSelectorReg.test(lastSelector)) {
  }
  if (isIDSelectorReg.test(lastSelector)) {
  }
  return ''
}

function getCollectPlugin(
  ruleSetMap: RuleSetMap,
  customOptions: CompileStyleOptions
) {
  const collectRulePlugin = postcss.plugin(
    'collect-rule',
    (options: any) => (root: Root) => {
      root.each(function collectRule(node) {
        if (node.type !== 'rule') {
          // 不支持媒体查询
          return
        }
        let { selector } = node
        handleSelector(ruleSetMap, selector, node, customOptions)
      })
    }
  )
  return collectRulePlugin
}

function generateCode(ruleSetMap: RuleSetMap, options: CompileStyleOptions) {
  let styleCode = `
    var ruleSetMap = ${JSON.stringify(ruleSetMap)};
    var options = ${JSON.stringify(options)};
  `
  return `
    import {collectStyle} from '@hummer/tenon-vue';
    export default (function(){
      ${styleCode}
      return collectStyle(ruleSetMap, options);
    })();
  `
}

function getRuleStyle(node: Rule): Record<string, string> {
  let style: any = {}
  node.each((item: any) => {
    let { prop, value } = item
    style[prop] = value
  })
  style = styleTransformer.transformStyle(style)
  return style
}

export const compileStyle = function(
  source: string,
  options: CompileStyleOptions = { scoped: false }
) {
  let ruleSetMap: RuleSetMap = {
    global: {
      tagList: [],
      classList: [],
      idList: [],
      attrList: []
    }
  }
  postcss([getCollectPlugin(ruleSetMap, options)]).process(source, {
    from: undefined
  }).css
  let code = generateCode(ruleSetMap, options)
  return code
}
