const path = require('path')
const fs = require('fs')
const axios = require('axios');
const { writeFile } = require('fs').promises
const { green, orange, red } = require('chalk')

const instance = axios.create({
	baseURL: process.env['java.baseURL'],
	headers: {
		Authorization: `Bearer ${process.env['java.token']}`
	}
});

function listFilesInDir(inputDir) {
	let files = []
	const inputDirectory = path.join(inputDir)
	if (fs.existsSync(inputDirectory)) {
		files = fs.readdirSync(inputDirectory).filter(file => file.includes('-cws.json'))
		if (!files && files.length == 0) {
			console.error(orange(`Diretório não possui arquivos do tipo '*-cws.json': ${inputDir}`));
			files = []
		}
	} else {
		console.error(red(`Diretório não encontrado: ${inputDir}`));
	}
	return files
}

function filterFiles(files, nbs, type) {
	let filteredFiles = files
	if (nbs) {
		filteredFiles = nbs.map(nb => files.filter(file => file.startsWith(nb) && file.endsWith('-cws.json'))).flatMap(file => file)
	}
	if (type) {
		filteredFiles = filteredFiles.filter(file => file.endsWith(`${type}-cws.json`))
	}
	return filteredFiles
}

function createOutputDirIfNotExist(outputDir) {
	const outputDirectory = path.join(outputDir)
	fs.rmSync(outputDirectory, { recursive: true, force: true });
	fs.mkdirSync(outputDirectory)
}

function writeOutputFile(data, file, outputDir) {
	const javaFile = path.join(outputDir, file.replace('-cws', '-java'))
	return writeFile(javaFile, JSON.stringify(data, null, 2)).then(() => `Arquivo gravado com sucesso: ${javaFile}`)
}

function getUrl(file) {
	const nb = file.split('-')[0]
	let url = ''
	if (file.includes('dados')) {
		url = `${process.env['cws.jconcal.web']}/${nb}`
	} else if (file.includes('memoria1')) {
		url = `${process.env['cws.jconcal.details']}/${nb}X`
	} else if (file.includes('memoria2')) {
		url = `${process.env['cws.jconcal.details']}/${nb} X`
	} else if (file.includes('memoria3')) {
		url = `${process.env['cws.jconcal.details']}/${nb}  X`
	}
	return url
}

const download = args => {
	createOutputDirIfNotExist(args.javaDir)
	const files = listFilesInDir(args.cwsDir, args.nbs)
	const filteredFiles = filterFiles(files, args.nbs, args.type)
	for (let i = 0; i < filteredFiles.length; i++) {
		setTimeout(() => {
			const url = getUrl(filteredFiles[i])
			instance.get(url)
				.then(response => writeOutputFile(response.data, filteredFiles[i], args.javaDir))
				.then(message => console.log(green(message)))
				.catch(err => console.error(red(err)))
		}, i * process.env['delay'])
	}
}

module.exports = download;