#!/usr/bin/env node
var fs = require('fs')
var args = process.argv.splice(2)
let consumingFlags = new Set('t,o'.split(','))

var flags = {}
var modules = []
for (let i = 0; i < args.length; i++) {
    let arg = args[i]
    if (arg[0] == '-') {
        let letter = arg[1]
        let consume = consumingFlags.has(letter)
        flags[letter] = consume ? args[++i] : true
    } else {
        modules.push(args[i])
    }
}

if (flags.o == undefined || modules.length == 0) {
    console.log('Usage: brion <modules> -o <output> <optional flags>')
    console.log('Optional flags:')
    console.log('  -w;             Will watch modules and regenerate automatically.')
    console.log('  -t <template>;  Output will be the template with <brion> tags replaced with imports.')
    return
}

function buildImport() {
    let imports = []
    for (let module of modules) {
        let path = module == '.' ? 'lib' : 'node_modules/' + module + '/lib'
        let files = JSON.parse(fs.readFileSync(path + '/manifest.json', 'utf8')).files
        for (let file of files) imports.push(`<script src='${path}/${file}'></script>`)
    }

    let template
    if (flags.t != undefined)
        template = fs.readFileSync(flags.t, 'utf8')
    else
        template = '<brion>'

    let output = template.replace('<brion>', imports.join('\n'))

    fs.writeFileSync(flags.o, output)
}

buildImport()
console.log('Finished building imports')

if (flags.w) {
    let paths = []

    if (flags.t != undefined)
        paths.push(flags.t)

    for (let module of modules) {
        let path = module == '.' ? 'lib' : 'node_modules/' + module + '/lib/manifest.json'
        paths.push(path)
    }

    for (let path of paths) {
        fs.watch(path, () => {
            buildImport()
            console.log('Rebuilt imports.')
        })
    }
}