const express = require('express')
const { green } = require('chalk')

const server = args => {
	let app = express();
	app.use('/', express.static(args.dir));	
	app.listen(args.port, () => {
		console.log(green(`Servindo diretório '${args.dir}' com sucesso na porta '${args.port}'`))
	});
}

module.exports = server;