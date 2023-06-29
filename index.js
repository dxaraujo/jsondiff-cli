#! /usr/bin/env node

require('dotenv').config()
const { Command, Option } = require('commander')

const init = require('./lib/init')
const cws = require('./lib/cws')
const java = require('./lib/java')
const diff = require('./lib/diff')
const htmlDiff = require('./lib/htmlDiff')
const server = require('./lib/server')

const program = new Command()

program
	.name('jsondiff-util')
	.description('Programa utilitário para geração e comparação entre arquivos jsons')
	.version('0.0.1')

program.command('init')
	.description('Realiza a criação da pasta e do arquivos de variáveis de ambientte')
	.requiredOption('-d, --dir <string>', 'Diretório onde o programa será executado')
	.action((args) => {
		init(args)
	})

program.command('cws')
	.description('Realiza a geração dos arquivos de origem para os NB\'s informados')
	.requiredOption('-n, --nbs <string...>', 'Lista de benefícios que serão consultados', undefined)
	.requiredOption('-o, --outputDir <string>', 'Diretório onde os arquivos serão gravados', 'origin')
	.action((args) => {
		cws(args)
	})

program.command('java')
	.description('Realiza a geração dos arquivos de destino com base nos arquivos de origem')
	.option('-n, --nbs <string...>', 'Lista de benefícios que serão consultados', undefined)
	.addOption(new Option('-t, --type <string>', 'Realiza a comparação pelo tipo informado').choices(['dados', 'memoria1', 'memoria2', 'memoria3']))
	.option('-i, --inputDir <string>',  'Diretório onde os arquivos serão lidos', 'origin')
	.option('-o, --outputDir <string>', 'Diretório onde os arquivos serão gravados', 'destiny')
	.action((args) => {
		java(args)
	})

program.command('diff')
	.description('Realiza a comparação entre arquivos json')
	.option('-n, --nbs <string...>', 'Benefícios que serão comparados', undefined)
	.addOption(new Option('-t, --type <string>', 'Realiza a comparação pelo tipo informado').choices(['dados', 'memoria1', 'memoria2', 'memoria3']))
	.option('-c, --cwsDir <string>', 'Diretório onde os Json\'s CWS serão lidos', 'origin')
	.option('-j, --javaDir <string>', 'Diretório onde os Json\'s JAVA serão lidos', 'destiny')
	.option('-d, --diffDir <string>', 'Diretório de onde o(s) arquivo(s) de diferença(s) serão gravado(s)', 'diff')
	.option('-p, --propsToIgnore <string...>', 'Propriedades que serão ignoradas na comparação dos arquivos', [])
	.option('-s, --singleFile', 'Grava todas as diferenças em um único arquivo ou em arquivos separados', false)
	.option('-i, --ignoreJavaMissingValues', 'Ignora a comparação quando a propriedade não é encontrada no arquivo de destino', false)
	.action((args) => {
		diff(args)
	})

program.command('htmlDiff')
	.description('Realiza a comparação entre arquivos Java e CWS e retorna em formato HTML')
	.option('-n, --nbs <string...>', 'Benefícios que serão comparados', undefined)
	.addOption(new Option('-t, --type <string>', 'Realiza a comparação pelo tipo informado').choices(['dados', 'memoria1', 'memoria2', 'memoria3']))
	.option('-c, --cwsDir <string>', 'Diretório onde os Json\'s de origem serão lidos', 'cws')
	.option('-j, --javaDir <string>', 'Diretório onde os Json\'s de destino serão lidos', 'java')
	.option('-d, --diffDir <string>', 'Diretório de onde o(s) arquivo(s) de diferença(s) serão gravado(s)', 'htmlDiff')
	.action((args) => {
		htmlDiff(args)
	})

program.command('server')
	.description('Cria um servidor para os arquivos criados no htmlDiff')
	.option('-p, --port <string>', 'Porta que o seervidor será executado', '8081')
	.option('-d, --dir <string>', 'Diretório de onde onde serão lidos os arquivos html', 'htmlDiff')
	.action((args) => {
		server(args)
	})

program.parse(process.argv)