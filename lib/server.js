const express = require('express')
const { magenta } = require('chalk')

const server = args => {
	let app = express();
	app.use('/', express.static(args.dir));	
	app.listen(args.port, () => {
		console.log(magenta(`Servindo diretório '${args.dir}' com sucesso na porta '${args.port}'`))
	});
}

module.exports = server;