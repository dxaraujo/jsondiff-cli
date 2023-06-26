const path = require('path')
const fs = require('fs')
const { red, green } = require('chalk')

const init = (args) => {
	const programDirectory = path.join(args.dir)
	if (!fs.existsSync(programDirectory)) {
        fs.mkdirSync(programDirectory)
        console.log(green(`Diretório ${args.dir} criado com sucesso!`))
        const envFile = fs.readFileSync(path.join(__dirname, 'templates', '.env'))
        fs.writeFileSync(`${rgs.dir}/.env`, envFile)
        console.log(green(`Arquivo de propriedades ${args.dir}/.env inicializado com sucesso!`))
	} else {
        console.log(red(`Não foi possível criar o diretório ${args.dir}, pois ele já existe.`))
    }
}

module.exports = init