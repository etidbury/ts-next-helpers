// More info here:
// @link https://github.com/etidbury/ts-next-helpers/blob/master/docs/next.config.md
// module.exports = require('@etidbury/ts-next-helpers/config/next')()
// module.exports = require('/Users/edwardtidbury/Documents/ts-next-helpers.git/config/next.js')()

// next.config.js
const path = require('path')
const fs = require('fs')

require('dotenv-safe').config({
    path: path.join(process.cwd(), '.env'),
    safe: true,
    debug: process.env.DEBUG
})
const webpack = require('webpack')

const { PWD } = process.env

// const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

const glob = require('glob')

const isProd = process.env.NODE_ENV === 'production'

const withTypescript = require('@zeit/next-typescript')
const withSass = require('@zeit/next-sass')
const withCss = require('@zeit/next-css')
const nextBuildId = require('next-build-id')

// const withLess = require('@zeit/next-less')
// const lessToJS = require('less-vars-to-js')

// // fix: prevents error when .css files are required by node
// if (typeof require !== 'undefined') {
//     require.extensions['.css'] = file => {}
// }

// Where your antd-custom.less file lives
// const themeVariables = lessToJS(
//     fs.readFileSync(path.resolve(process.cwd(), './styles/antd-custom.less'), 'utf8')
// )

// fix: prevents error when .less files are required by node
if (typeof require !== 'undefined') {
    require.extensions['.less'] = file => { }
    require.extensions['.css'] = file => { }
}

// Note: Order is very important! 1. withLess, 2. withSass, 3. withCss, 4. withTypescript...
const nextConfig =
    // withLess(
    withSass(
        withCss(
            withTypescript({
                // cssModules: true,
                // sassLoaderOptions: {},
                // typescriptLoaderOptions: {
                //     transpileOnly: false,
                // },
                // lessLoaderOptions: {
                //     javascriptEnabled: true,
                //     modifyVars: themeVariables // make your antd custom effective
                // },
                // generateBuildId: async () => {
                //     const fromGit = await nextBuildId({ dir: process.cwd() })
                //     return fromGit.id
                // },
                distDir:
                    '.build.next' +
                    (isProd
                        ? ''
                        : '.' +
                        (process.env.NODE_ENV
                            ? process.env.NODE_ENV
                            : 'development')),

                // ,assetPrefix: process.env.NODE_ENV === "production" ? 'https://cdn.mydomain.com' : ''
                webpack(config, { isServer }) {
                    // ////
                    process.chdir(PWD)

                    // Add polyfills
                    const originalEntry = config.entry
                    config.entry = async () => {
                        const entries = await originalEntry()

                        if (entries['main.js']) {
                            entries['main.js'].unshift('./config/polyfills.js')
                        }

                        return entries
                    }

                    // Switch React with Preact
                    if (process.env.USE_PREACT) {
                        if (isServer) {
                            config.externals = [
                                'react',
                                'react-dom',
                                ...config.externals
                            ]
                        }

                        config.resolve.alias = Object.assign(
                            {},
                            config.resolve.alias,
                            {
                                react$: 'preact-compat',
                                'react-dom$': 'preact-compat',
                                react: 'preact-compat',
                                'react-dom': 'preact-compat'
                            }
                        )
                    }

                    // const vars = require('./config/define-vars')

                    // Object.keys(vars).forEach((varName)=>{
                    //     if (vars[varName]) {
                    //         vars[varName] = JSON.stringify( vars[varName] )
                    //     }else{
                    //         console.warn(`Variable '${varName}' is specified in config/expose-vars.js but value is undefined`)
                    //     }
                    // }) // parse all as string values

                    // config.plugins.push(new webpack.DefinePlugin(require('./config/define-vars')))

                    try {
                        const exposeVars = require(path.join(
                            process.cwd(),
                            './config/expose-vars'
                        ))

                        let _extendedDefinePlugin

                        const _extendDefinePluginWithEnvVars = plugin => {
                            // exposeVars.forEach((exposeVar)=>{
                            //     plugin.definitions[`process.env.${exposeVar}`] = JSON.stringify(process.env[exposeVar])
                            // })
                            if (!plugin.definitions) {
                                plugin.definitions = {}
                            }

                            plugin.definitions['process'] = {
                                browser: !isServer,
                                isBrowser: !isServer,
                                isServer,
                                env: {}
                            }

                            exposeVars.forEach(exposeVar => {
                                plugin.definitions['process']['env'][
                                    exposeVar
                                ] = JSON.stringify(process.env[exposeVar])
                            })

                            return plugin
                        }

                        config.plugins = config.plugins.map(plugin => {
                            if (plugin instanceof webpack.DefinePlugin) {
                                plugin = _extendDefinePluginWithEnvVars(plugin)

                                _extendedDefinePlugin = true
                            }
                            return plugin
                        })

                        if (!_extendedDefinePlugin) {
                            const definePlugin = new webpack.DefinePlugin()
                            config.plugins.push(
                                _extendDefinePluginWithEnvVars(definePlugin)
                            )
                        }
                    } catch (err) {
                        console.error('Failed to define vars')
                        throw err
                    }

                    // {
                    //     loader: 'babel-loader',
                    //     exclude: /node_modules/,
                    //     test: /\.js$/,
                    //     options: {
                    //       presets: [...]
                    //       plugins: [
                    //         ['import', { libraryName: "antd", style: true }]
                    //       ]
                    //     },
                    //   }

                    // {
                    //     test: /\.m?js$/,
                    //     exclude: /(node_modules|bower_components)/,
                    //     use: {
                    //       loader: 'babel-loader',
                    //       options: {
                    //         presets: ['@babel/preset-env'],
                    //         plugins: ['@babel/plugin-proposal-object-rest-spread']
                    //       }
                    //     }
                    //   }

                    // config.module.rules.push({
                    //     test: /\.js$/,
                    //     use: [
                    //         {
                    //             loader: 'babel-loader',
                    //             options: {
                    //                 exclude: '/node_modules/',
                    //                 plugins: [
                    //                     [
                    //                         '@babel/plugin-syntax-dynamic-import',
                    //                         { libraryName: 'antd', style: true }
                    //                     ]
                    //                 ]
                    //             }
                    //         }
                    //         // 'raw-loader',
                    //         // 'postcss-loader'
                    //     ]
                    // })
                    // todo: add type-checking and validation
                    // config.plugins.push(new webpack.EnvironmentPlugin(require('./config/expose-vars')))

                    // console.log('config.plugins',config.plugins)

                    // if (!isProd) {
                    //     config.devtool = 'source-map'
                    // }

                    return config
                } // end webpack
            })
        )
    )
//  )

module.exports = () => {
    return nextConfig
}
