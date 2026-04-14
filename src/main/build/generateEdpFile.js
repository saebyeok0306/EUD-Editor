import fs from 'fs'
import path from 'path'

export function generateEdpFile(buildDir, mapPath, outputPath) {
  const eddContent = `[main]
input: ${mapPath}
output: ${outputPath}

[eudTurbo]
[EEData.py]

[../main.eps]
`
  const configDir = path.join(buildDir, '.eudeditor')
  fs.writeFileSync(path.join(configDir, 'build.edd'), eddContent, 'utf-8')
  fs.writeFileSync(path.join(configDir, 'build.eds'), eddContent, 'utf-8')
}
