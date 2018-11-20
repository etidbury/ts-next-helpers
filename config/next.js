// next.config.js
const path = require('path')
require('dotenv-safe').config({ path: path.join(process.cwd(),'.env'), safe: true, debug: process.env.DEBUG })
const webpack = require('webpack')

const {
    PWD
} = process.env

// const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

const glob = require('glob')

const isProd = process.env.NODE_ENV === 'production'

const withTypescript = require('@zeit/next-typescript')
const withSass = require('@zeit/next-sass')

const nextConfig = withSass(withTypescript({
    distDir:
        '.build.next' +
        (isProd
            ? ''
            : '.' +
              (process.env.NODE_ENV ? process.env.NODE_ENV : 'development')),

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
                config.externals = ['react', 'react-dom', ...config.externals]
            }

            config.resolve.alias = Object.assign({}, config.resolve.alias, {
                react$: 'preact-compat',
                'react-dom$': 'preact-compat',
                react: 'preact-compat',
                'react-dom': 'preact-compat'
            })
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
        
            const exposeVars = require(path.join(process.cwd(),'./config/expose-vars'))

            let _extendedDefinePlugin
        
            const _extendDefinePluginWithEnvVars = (plugin)=>{
            // exposeVars.forEach((exposeVar)=>{
            //     plugin.definitions[`process.env.${exposeVar}`] = JSON.stringify(process.env[exposeVar])
            // })
                if (!plugin.definitions){
                    plugin.definitions = {}
                }
            
                plugin.definitions['process'] = {
                    browser: !isServer,
                    isBrowser: !isServer,
                    isServer,
                    env: {}
                }

                exposeVars.forEach((exposeVar)=>{
                    plugin.definitions['process']['env'][exposeVar] = JSON.stringify(process.env[exposeVar])
                })   
            
                return plugin
            }

            config.plugins = config.plugins.map((plugin)=>{
                if (plugin instanceof webpack.DefinePlugin){
               
                    plugin = _extendDefinePluginWithEnvVars(plugin)

                    _extendedDefinePlugin = true            
                }
                return plugin
            })
        
            if (!_extendedDefinePlugin){
                const definePlugin = new webpack.DefinePlugin()
                config.plugins.push(_extendDefinePluginWithEnvVars(definePlugin))
            }

        }catch (err){
            console.error('Failed to define vars')
            throw err
        }
        // todo: add type-checking and validation
        // config.plugins.push(new webpack.EnvironmentPlugin(require('./config/expose-vars')))

        // console.log('config.plugins',config.plugins)
        // Compile SASS/SCSS
        // config.module.rules.push(
        //     {
        //         test: /\.(css|scss)/,
        //         loader: 'emit-file-loader',
        //         options: {
        //             name: 'dist/[path][name].[ext]'
        //         }
        //     },
        //     {
        //         test: /\.css$/,
        //         use: [ {
        //             loader: 'babel-loader',
        //             options: {
        //                 exclude: '/node_modules/' 
        //             }
        //         }, 'raw-loader', 'postcss-loader']
        //     },
        //     {
        //         test: /\.s(a|c)ss$/,
        //         use: [
        //             {
        //                 loader: 'babel-loader',
        //                 options: {
        //                     exclude: '/node_modules/' 
        //                 }
        //             },
        //             'raw-loader',
        //             'postcss-loader',
        //             {
        //                 loader: 'sass-loader',
        //                 options: {
        //                     includePaths: ['styles', 'scss', 'node_modules']
        //                         .map(d => path.join(__dirname, d))
        //                         .map(g => glob.sync(g))
        //                         .reduce((a, c) => a.concat(c), [])
        //                 }
        //             }
        //         ]
        //     }
        // )

        // if (!isProd) {
        //     config.devtool = 'source-map'
        // }

        return config
    } // end webpack
}))

module.exports = ()=>{
    return nextConfig
}