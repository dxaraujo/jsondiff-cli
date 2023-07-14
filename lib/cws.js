const path = require('path')
const fs = require('fs')
const axios = require('axios');
const { writeFile } = require('fs').promises
const { green, red } = require('chalk')

const instance = axios.create({
    baseURL: process.env['cws.baseURL']
});

function eraseAndCreateDir(outputDir) {
    const outputDirectory = path.join(outputDir)
    fs.rmSync(outputDirectory, { recursive: true, force: true });
    fs.mkdirSync(outputDirectory)
}

function writeOutputFile(data, file, outputDir) {
    const cwsFile = path.join(outputDir, file)
    return writeFile(cwsFile, JSON.stringify(data, null, 2)).then(() => `Arquivo gravado com sucesso: ${cwsFile}`)
}

function getUrls(file) {
    const nb = file.split('-')[0]
    return {
        dados: `${process.env['cws.jconcal.web']}/${nb}`,
        memoria1: `${process.env['cws.jconcal.details']}/${nb}X`,
        memoria2: `${process.env['cws.jconcal.details']}/${nb} X`,
        memoria3: `${process.env['cws.jconcal.details']}/${nb}  X`,
    }
}

const download = args => {
    eraseAndCreateDir(args.cwsDir)
    const nbs = args.nbs
    for (let i = 0; i < nbs.length; i++) {
        const nb = nbs[i]
        const urls = getUrls(nb)
        for (let tipo in urls) {
            const url = urls[tipo]
            setTimeout(() => {
                instance.get(url)
                    .then(response => writeOutputFile(response.data, `${nb}-${tipo}-cws.json`, args.outputDir))
                    .then(message => console.log(green(message)))
                    .catch(err => console.error(red(err)))
            }, ((i * 4 ) + j) * process.env['delay'])
        }
    }
}

module.exports = download;