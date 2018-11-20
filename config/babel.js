const {
    NODE_ENV,
    PWD
} = process.env

const path = require('path')

const isProd = NODE_ENV === 'production'

const requiredModules = [
    'babel-plugin-module-resolver',
    'babel-plugin-transform-define',
    '@babel/plugin-proposal-optional-chaining',
    'babel-plugin-transform-flow-strip-types'
]

try {
    for(let i = 0; i < requiredModules.length;i++){
        try {
            require(path.join(PWD,'node_modules',requiredModules[i]))
        }catch (err){
            console.error(`Error requiring module: ${requiredModules[i]}`)
            throw err
        }
    }

} catch (err) {
    console.error('Error: Required Babel plugins/presets not installed')
    console.error(`yarn add ${requiredModules.join(' ')} --dev`)
    console.error('Try running this command:')
    console.error('and try again.')
    
    process.exit(1)
}

const plugins = [
    '@babel/proposal-optional-chaining',
    [
        'module-resolver',
        {
            root: ['./'],
            alias: {
                actions: './actions',
                components: './components',
                container: './container',
                config: './config',
                constants: './constants',
                reducers: './reducers',
                static: './static',
                stories: './stories',
                styles: './styles',
                lib: './lib'
            }
        }
    ], 'transform-flow-strip-types'
]

try {

    const exposeVars = require(path.join(PWD,'config/expose-vars'))

    plugins.push(['transform-define',exposeVars])

}catch(err){
    console.warn('Failed to use babel-plugin-transform-define to expose vars to client',err,'Ignoring...')
}

const presets = [
    [
        'next/babel',
        {
            targets: {
                node: 'current'
            },
            'preset-env': {
                modules: 'commonjs'
            }
        }
    ]
]

module.exports = {
    presets: presets,
    plugins: plugins,
    ignore: [
        '_*',
        '._*',
        'node_modules/**/*',
        'packages'
    ]
}
