const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry:{
        index: path.resolve(__dirname, 'public/src/connect.js')
    },
    output:{
        path: path.resolve(__dirname, './public/src'),
        filename:  '[name].bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public/index.html')
        })
    ],
    mode: 'development'
}