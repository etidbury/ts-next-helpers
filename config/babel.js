module.exports = {
    'presets': [
        'next/babel',
        '@zeit/next-typescript/babel'
    ],
    'plugins': [
        '@babel/plugin-proposal-class-properties',
        [
            '@babel/plugin-proposal-decorators',
            {
                'decoratorsBeforeExport': true
            }
        ],
        [
            'import',
            {
                'libraryName': 'antd',
                'style': true
            }
        ]
    ]
}