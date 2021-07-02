module.exports = {
	entry: './src/App.tsx',
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.(js|ts|tsx)$/,
				exclude: /node_modules/,
				use: ['ts-loader']
			},
			{
				test: /\.(css|scss)$/,
				exclude: /node_modules/,
				use: ['style-loader', 'css-loader', 'sass-loader']
			},
			{
				test: /\.(png|jpg)$/,
				exclude: /node_modules/,
				use: ['url-loader']
			}
		]
	},
	resolve: {
		extensions: ['.js', '.ts', '.tsx']
	},
	output: {
		filename: 'App.js',
		path: __dirname + '/dist'
	}
};