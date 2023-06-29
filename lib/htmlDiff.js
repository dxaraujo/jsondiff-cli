const path = require('path')
const fs = require('fs')

const diff2html = require('diff2html')
const diff = require('diff')
const { JSDOM } = require('jsdom')
const { red, green } = require('chalk')

function listFilesInDir(inputDir) {
	let files = []
	const inputDirectory = path.join(inputDir)
	if (fs.existsSync(inputDirectory)) {
		files = fs.readdirSync(inputDirectory).filter(file => file.includes('-cws.json'))
		if (!files && files.length == 0) {
			console.error(red(`Diretório não possui arquivos do tipo '*-cws.json': ${inputDir}`))
			files = []
		}
	} else {
		console.error(red(`Diretório não encontrado: ${inputDir}`))
	}
	return files
}

function createOutputDirIfNotExist(outputDir) {
	const outputDirectory = path.join(outputDir)
	fs.rmSync(outputDirectory, { recursive: true, force: true })
	fs.mkdirSync(outputDirectory)
}

function createNbDirIfNotExist(outputDir) {
	const outputDirectory = path.join(outputDir)
	if (!fs.existsSync(outputDirectory)) {
		fs.mkdirSync(outputDirectory)
		console.log(`Diretório '${outputDir}' criado com sucesso!`)
	}
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

function writeFile(fileName, content) {
	fs.writeFileSync(fileName, content)
	console.log(green(`Arquivo '${fileName}' criado com sucesso!`))
}

function mountHtmlDiff(fileTree) {

	const svgFolderOpen = fs.readFileSync(path.join(__dirname, 'templates', 'folder-open.svg'))
	const svgFolderClose = fs.readFileSync(path.join(__dirname, 'templates', 'folder-closed.svg'))
	const svgFile = fs.readFileSync(path.join(__dirname, 'templates', 'file.svg'))

	const templateFile = fs.readFileSync(path.join(__dirname, 'templates', 'template.html'))
	let dom = new JSDOM(templateFile)
	let ul = dom.window.document.querySelector('ul')

	const root = createFolderNode(dom, '/', '/', undefined, 1, svgFolderOpen, svgFolderClose)
	ul.appendChild(root)

	for (let nb in fileTree) {
		const nbNode = createFolderNode(dom, nb, `/${nb}`, '/', 2, svgFolderOpen, svgFolderClose)
		ul.appendChild(nbNode)
		for (let type in fileTree[nb]) {
			const typeNode = createFileNode(dom, type, `/${nb}/${type}`, `/${nb}`, 3, svgFile)
			ul.appendChild(typeNode)
		}
	}

	const result = dom.serialize()
	dom.window.document.close()
	dom = null

	return result
}

function writeIFrameDiff(fileName, content) {
	JSDOM.fromFile(path.join(__dirname, 'templates', 'iframe.html')).then(dom => {
		const htmlDiff = htmlToNode(dom, content)
		dom.window.document.querySelector('body').appendChild(htmlDiff)
		writeFile(fileName, dom.serialize())
	});
}

function createFolderNode(dom, label, path, parent, level, svgFolderOpen, svgFolderClose) {
	const node = dom.window.document.createElement('li')
	const nodeLabel = dom.window.document.createElement('span')
	nodeLabel.innerHTML = label
	node.setAttribute('data-type', 'folder')
	node.setAttribute('data-path', path)
	if (parent) {
		node.setAttribute('data-parent', parent)
	}
	node.setAttribute('data-display', false)
	node.setAttribute('style', `padding-left: ${level * 15}px; width: 200px;`)
	node.setAttribute('class', 'vtv__tree-node vtv__tree-node--directory')
	node.setAttribute('class', `vtv__tree-node vtv__tree-node--file hidden`)
	node.setAttribute('tabindex', 0)
	node.appendChild(svgToNode(dom, path, 'open', svgFolderOpen))
	node.appendChild(svgToNode(dom, path, 'closed', svgFolderClose))
	node.appendChild(nodeLabel)
	return node
}

function createFileNode(dom, label, path, parent, level, svgFile) {
	const node = dom.window.document.createElement('li')
	const nodeLabel = dom.window.document.createElement('span')
	nodeLabel.innerHTML = label
	node.setAttribute('data-path', path)
	node.setAttribute('data-parent', parent)
	node.setAttribute('data-type', 'file')
	node.setAttribute('style', `padding-left: ${level * 15}px; width: 200px;`)
	node.setAttribute('class', `vtv__tree-node vtv__tree-node--file hidden`)
	node.setAttribute('tabindex', 0)
	node.innerHTML = ''
	node.appendChild(svgToNode(dom, undefined, 'file', svgFile))
	node.appendChild(nodeLabel)
	return node
}

function htmlToNode(dom, content) {
    let html = dom.window.document.createElement('template')
    html.innerHTML = content
    return html.content
}

function svgToNode(dom, path, name, svg) {
    let html = dom.window.document.createElement('template')
    html.innerHTML = svg
    let node =  html.content.firstChild
	let template = dom.window.document.createElement('span')
	if (path !== undefined) {
		template.setAttribute('data-path', `${path}-${name}`)
		template.setAttribute('class', `hidden`)
	}
	template.appendChild(node)
	return template
}

const htmlDiff = (args) => {

	const nbsToFilter = args.nbs
	const typeToFilter = args.type

	createOutputDirIfNotExist(args.diffDir)
	const diffFileName = path.join(args.diffDir, 'index.html')
	const files = listFilesInDir(args.cwsDir)

	let filteredFiles = filterFiles(files, nbsToFilter, typeToFilter)
	if (filteredFiles && filteredFiles.length > 0) {

		let fileTree = {}

		for (let i = 0; i < filteredFiles.length; i++) {

			const file = filteredFiles[i]
			const nb = file.split('-')[0]
			const tipo = file.split('-')[1]

			const cwsFileName = path.join(args.cwsDir, file)
			const javaFileName = path.join(args.javaDir, file.replace('cws', 'java'))

			try {
				const cws = fs.readFileSync(cwsFileName).toString()
				try {
					const java = fs.readFileSync(javaFileName).toString()
					const jsonDiffs = diff.createTwoFilesPatch(cwsFileName, javaFileName, cws, java)
					const diffHtml = diff2html.html(jsonDiffs, {
						outputFormat: 'side-by-side',
						matching: "none",
					})
					createNbDirIfNotExist(`${args.diffDir}/${nb}`)
					writeIFrameDiff(`${args.diffDir}/${nb}/${tipo}.html`, diffHtml)
					fileTree[nb] = { ...fileTree[nb], [tipo]: diffHtml }
				} catch (errJava) {
					console.error(red(errJava))
				}
			} catch (errCWS) {
				console.error(red(errCWS))
			}
		}
		writeFile(diffFileName, mountHtmlDiff(fileTree))
	}
}

module.exports = htmlDiff