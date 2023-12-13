# Tenon Loader
[![npm](https://img.shields.io/npm/v/@hummer/tenon-loader)](https://npmjs.com/package/@hummer/tenon-loader
)

> PS. Fork From Vue Loader
## update
基于 vue loader tag: v17.3.1 修改

Tenon Vue 专用 Loader, 增加了样式处理相关逻辑，切换 Compiler 的包为 Tenon Compiler
> 备注：由于 Tenon 中样式逻辑需要特殊处理，底层 css 的样式解析下沉到 Tenon Loader 中，针对 less 或者 scss 样式处理等，不需要引入 css-loader 和 style-loader，建议直接使用 [hummer cli](https://hummer.didi.cn/doc-tenon#/zh-CN/cli_doc) 进行开发。
## 使用方式
webpack 配置文件如下
```javascript
const { VueLoaderPlugin } = require('@hummer/tenon-loader')
module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    entry: './index.js',
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: "[name].js"
  },
  resolve: {
    alias: {
    },
    extensions: [".js",'.json',".jsx",".vue", ".css" ]
  },
  module: {
    rules: [{
      test: /\.vue$/,
      loader: '@didi/tenon-loader'
    }, {
      test: /\.less$/,
      use: ['less-loader']
    }, {
      test: /\.js$/,
      exclude: /(node_modules)|(tenon-next)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env', 
              {
                targets: {
                  "ios": "9",
                  "node": "10"
                }
              }
            ]
          ],
          "plugins": [
            ["@babel/plugin-transform-runtime",
              {
                "regenerator": true
              }
            ]
          ]
        }
      }
    }]
  },
  plugins: [new VueLoaderPlugin()]
}
```