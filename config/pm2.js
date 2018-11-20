const {
    PWD
} = process.env

require('dotenv').config({ path: path.join(PWD, '.env') })

const path = require('path')

const pkgName = require(path.join(PWD,'package')).name

if (!pkgName || !pkgName.length){
    throw new TypeError('PM2 Config: Invalid package name. Make sure you specify a name in your package.json file')
}

module.exports = {
    'apps': [
        {
            'cwd': PWD,
            'script': './index.js',
            'name': pkgName,
            // 'watch': [
            //     './routes'
            // ],
            'env': {
                NODE_ENV: 'production'
            },
            'node_args': '-r dotenv/config'
            // 'interpreter': './node_modules/.bin/babel-node'
        }
        // {
        // 	'script': '*',
        // 	'name': 'test-watch',
        // 	'env': {
        // 		'CLIENT_BASE_URL':CLIENT_BASE_URL
        // 	},
        // 	'node_args':'--config jest.config.js -i --no-cache --watch',
        // 	'interpreter': './node_modules/.bin/jest'
        // },
    ]
}