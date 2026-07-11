// אורז את בניית ההדגמה (dist-demo) לקובץ HTML עצמאי אחד עבור תצוגה מקדימה
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const dist = process.argv[2] || 'dist-demo'
const out = process.argv[3] || 'artifact.html'

const assets = readdirSync(join(dist, 'assets'))
const jsFile = assets.find((f) => f.endsWith('.js'))
const cssFile = assets.find((f) => f.endsWith('.css'))

const js = readFileSync(join(dist, 'assets', jsFile), 'utf8').replaceAll('</script>', '<\\/script>')
const css = readFileSync(join(dist, 'assets', cssFile), 'utf8')

const html = `<title>הספרייה שלי — גרסת הדגמה</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`

writeFileSync(out, html)
console.log(`written ${out} (${Math.round(html.length / 1024)} KB)`)
