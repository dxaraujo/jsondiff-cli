const path = require('path')
const fs = require('fs')

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

function filterFiles(files, nbsToFilter, typeToFilter) {
	let filteredFiles = files
	if (nbsToFilter) {
		if (typeToFilter) {
			filteredFiles = nbsToFilter.map(nb => files.filter(file => file == `${nb}-${typeToFilter}-cws.json`)).flatMap(file => file)
		} else {
			filteredFiles = nbsToFilter.map(nb => files.filter(file => file.startsWith(nb) && file.endsWith('-cws.json'))).flatMap(file => file)
		}
	} else {
		if (typeToFilter) {
			filteredFiles = files.filter(file => file.endsWith(`${typeToFilter}-cws.json`))
		}
	}
	return filteredFiles
}

function fileToSave(nbsToFilter, typeToFilter, singleFile, nb, tipo) {
	let fileToSave = undefined
	if (singleFile) {
		if (typeToFilter) {
			fileToSave = `${tipo}.diff`
		} else {
			if (nbsToFilter) {
				fileToSave = `${nb}.diff`
			} else {
				fileToSave = 'all.diff'
			}
		}
	} else {
		if (nbsToFilter) {
			if (typeToFilter) {
				fileToSave = `${nb}-${tipo}.diff`
			} else {
				fileToSave = `${nb}.diff`
			}
		} else {
			fileToSave = `${tipo}.diff`
		}
	}
	return fileToSave
}

function writeFile(fileName, content) {
	fs.appendFileSync(fileName, content)
}

function compareAttribute(cwsValue, javaValue, parent, attribute, ignoreJavaMissingValues, propsToIgnore, buffer) {
	if (cwsValue instanceof Object) {
		if (cwsValue instanceof Array) {
			for (let i = 0; i < cwsValue.length; i++) {
				const cwsElementValue = cwsValue[i]
				const javaElementValue = javaValue ? javaValue[i] : undefined
				buffer = compareAttribute(cwsElementValue, javaElementValue, `${parent ? parent : ''}`, `${attribute}[${i}]`, ignoreJavaMissingValues, propsToIgnore, buffer)
			}
		} else {
			for (let objAttribute in cwsValue) {
				const cwsAttrValue = cwsValue[objAttribute]
				const javaAttrValue = javaValue ? javaValue[objAttribute] : undefined
				buffer = compareAttribute(cwsAttrValue, javaAttrValue, `${parent ? parent + '.' : ''}${attribute}`, objAttribute, ignoreJavaMissingValues, propsToIgnore, buffer)
			}
		}
	} else {
		if (cwsValue != javaValue && !propsToIgnore.includes(attribute)) {
			if (javaValue) {
				buffer += `\n     Campo[\'${parent ? parent + '.' : ''}${attribute}\']`
				buffer += `\n-         CWS: |${cwsValue}|`
				buffer += `\n+        JAVA: |${javaValue}|`
			} else if (!ignoreJavaMissingValues) {
				buffer += `\n     Campo[\'${parent ? parent + '.' : ''}${attribute}\']`
				buffer += `\n-         CWS: |${cwsValue}|`
				buffer += `\n+        JAVA:`
			}
		}
	}
	return buffer
}

const diff = (args) => {

	const nbsToFilter = args.nbs
	const typeToFilter = args.type
	const propsToIgnore = args.propsToIgnore || []
	const ignoreJavaMissingValues = args.ignoreJavaMissingValues === true || args.ignoreJavaMissingValues === 'true' ? true : false
	const singleFile = args.singleFile === true || args.singleFile === 'true' ? true : false

	createOutputDirIfNotExist(args.diffDir)
	const files = listFilesInDir(args.cwsDir)

	let filteredFiles = filterFiles(files, nbsToFilter, typeToFilter)

	for (let i = 0; i < filteredFiles.length; i++) {

		const file = filteredFiles[i]
		const nb = file.split('-')[0]
		const tipo = file.split('-')[1]

		const cwsFileName = path.join(args.cwsDir, file)
		const javaFileName = path.join(args.javaDir, file.replace('cws', 'java'))
		const diffFileName = path.join(args.diffDir, fileToSave(nbsToFilter, typeToFilter, singleFile, nb, tipo))

		try {
			let buffer = ` NB: ${nb}${typeToFilter ? '' : ' / ' + tipo}`
			const cws = JSON.parse(fs.readFileSync(cwsFileName))
			try {
				const java = JSON.parse(fs.readFileSync(javaFileName))
				let attributeBuffer = ''
				for (let attribute in cws) {
					const cwsValue = cws[attribute]
					const javaValue = java[attribute]
					attributeBuffer = compareAttribute(cwsValue, javaValue, undefined, attribute, ignoreJavaMissingValues, propsToIgnore, attributeBuffer)
				}

				buffer += attributeBuffer.length > 0 ? attributeBuffer : (ignoreJavaMissingValues ? '\n!    BENEFICIO SEM ERROS OU COM PROPRIEDADES IGNORADAS' : '\n+    BENEFICIO SEM ERROS')
			} catch (errJava) {
				buffer += `\n!    ARQUIVO JAVA COM ERRO NA LEITURA OU INEXISTENTE: ${javaFileName}`
			}
			buffer += '\n --------------------------------------------------\n'
			writeFile(diffFileName, buffer)
		} catch (errCWS) {
			console.error(errCWS)
		}
	}
}

module.exports = diff