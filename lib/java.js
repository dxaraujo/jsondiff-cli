const path = require('path')
const fs = require('fs')
const axios = require('axios');
const { writeFile } = require('fs').promises

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
			console.error(`Diretório não possui arquivos do tipo '*-cws.json': ${inputDir}`);	
			files = []
		}
	} else {
		console.error(`Diretório não encontrado: ${inputDir}`);
	}
	return files
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
	createOutputDirIfNotExist(args.outputDir)
	const files = listFilesInDir(args.inputDir)
	for (let i = 0; i < files.length; i++) {
		setTimeout(() => {
			const url = getUrl(files[i])
			instance.get(url)
				.then(response => writeOutputFile(response.data, files[i], args.outputDir))
				.then(message => console.log(message))
				.catch(err => console.error(err))
		}, i * process.env['delay'])
	}
}

module.exports = download;