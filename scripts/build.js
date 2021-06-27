var shell = require('shelljs');

shell.cd("svelte")
shell.exec("npm install")
shell.exec("npm run build")
shell.cp("public/build/bundle*", "../app/")
shell.cp("public/bundle*", "../app/")

shell.cd("../")
shell.exec("npm install")
shell.exec("npx electron-builder")