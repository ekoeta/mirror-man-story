const fs = require('fs');
const path = require('path');

const dist = 'dist';
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const assets = fs.readdirSync(path.join(dist, 'assets'));
const jsFile = assets.find(f => f.endsWith('.js'));
const cssFile = assets.find(f => f.endsWith('.css'));
const js = fs.readFileSync(path.join(dist, 'assets', jsFile), 'utf8');
const css = fs.readFileSync(path.join(dist, 'assets', cssFile), 'utf8');

html = html.replace(/<script.*><\/script>/, '');
html = html.replace(/<link.*>/, `<style>\n${css}\n<\/style>`);
html = html.replace('</body>', `<script>\n${js}\n<\/script>\n</body>`);

fs.writeFileSync('dist/镜中人.html', html);
fs.writeFileSync('镜中人.html', html);
console.log('单文件已生成: 镜中人.html (' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB)');
