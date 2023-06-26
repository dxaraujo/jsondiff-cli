#! /usr/bin/env node

require('dotenv').config()
const { Command, Option } = require('commander')

const init = require('./lib/init')
const cws = require('./lib/cws')
const java = require('./lib/java')
const diff = require('./lib/diff')
const htmlDiff = require('./lib/htmlDiff')

const program = new Command()

program
	.name('concal-util')
	.description('Programa utilitário para geração e comparação de arquivos gerados pelo CWS e Java')
	.version('0.0.1')

program.command('cws')
	.description('Realiza a geração dos arquivos CWS para os NB\'s informados')
	.requiredOption('-n, --nbs <string...>', 'Lista de benefícios que serão consultados no CWS', undefined)
	.requiredOption('-o, --outputDir <string>', 'Diretório onde os arquivos serão gravados', 'cws')
	.action((args) => {
		cws(args)
	})

program.command('java')
	.description('Realiza a geração dos arquivos Java com base nos arquivos CWS da pasta de entrada')
	.option('-n, --nbs <string...>', 'Lista de benefícios que serão consultados no CWS', undefined)
	.addOption(new Option('-t, --type <string>', 'Realiza a comparação pelo tipo informado').choices(['dados', 'memoria1', 'memoria2', 'memoria3']))
	.option('-i, --inputDir <string>',  'Diretório onde os arquivos serão lidos', 'cws')
	.option('-o, --outputDir <string>', 'Diretório onde os arquivos serão gravados', 'java')
	.action((args) => {
		java(args)
	})

program.command('diff')
	.description('Realiza a comparação entre arquivos Java e CWS')
	.option('-n, --nbs <string...>', 'Benefícios que serão comparados', undefined)
	.addOption(new Option('-t, --type <string>', 'Realiza a comparação pelo tipo informado').choices(['dados', 'memoria1', 'memoria2', 'memoria3']))
	.option('-c, --cwsDir <string>', 'Diretório onde os Json\'s CWS serão lidos', 'cws')
	.option('-j, --javaDir <string>', 'Diretório onde os Json\'s JAVA serão lidos', 'java')
	.option('-d, --diffDir <string>', 'Diretório de onde o(s) arquivo(s) de diferença(s) serão gravado(s)', 'diff')
	.option('-p, --propsToIgnore <string...>', 'Propriedades que serão ignoradas na comparação dos arquivos', [])
	.option('-s, --singleFile', 'Grava todas as diferenças em um único arquivo ou em arquivos separados', false)
	.option('-i, --ignoreJavaMissingValues', 'Ignora a comparação quando a propriedade não é encontrada no arquivo Java', false)
	.action((args) => {
		diff(args)
	})

program.command('htmlDiff')
	.description('Realiza a comparação entre arquivos Java e CWS e retorna em formato HTML')
	.option('-n, --nbs <string...>', 'Benefícios que serão comparados', undefined)
	.addOption(new Option('-t, --type <string>', 'Realiza a comparação pelo tipo informado').choices(['dados', 'memoria1', 'memoria2', 'memoria3']))
	.option('-c, --cwsDir <string>', 'Diretório onde os Json\'s CWS serão lidos', 'cws')
	.option('-j, --javaDir <string>', 'Diretório onde os Json\'s JAVA serão lidos', 'java')
	.option('-d, --diffDir <string>', 'Diretório de onde o(s) arquivo(s) de diferença(s) serão gravado(s)', 'htmlDiff')
	.action((args) => {
		htmlDiff(args)
	})

program.command('init')
	.description('Realiza a criação da pasta e do arquivos de variáveis de ambientte')
	.option('-d, --dir <string>', 'Diretório onde o programa será executado', 'concal')
	.action((args) => {
		init(args)
	})

program.parse(process.argv)