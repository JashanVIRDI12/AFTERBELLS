const fs = require('node:fs');
const path = require('node:path');
const sharp = require(require.resolve('sharp', { paths:[require.resolve('next/package.json')] }));
(async()=>{
 const [name,source] = process.argv.slice(2);
 if(!/^[a-z0-9-]+$/.test(name)||!source) throw new Error('Asset name and source required');
 const promptFile=path.join('output/imagegen/house', `${name}-prompt.json`);
 const spec=JSON.parse(fs.readFileSync(promptFile,'utf8'));
 const original=path.join('output/imagegen/house',`${name}.png`);
 const web=path.join('public/media',`${name}.webp`);
 if(fs.existsSync(original)||fs.existsSync(web)) throw new Error('Refusing to overwrite an existing asset');
 fs.copyFileSync(source,original);
 const metadata=await sharp(source).metadata();
 await sharp(source).webp({quality:94,effort:6}).toFile(web);
 const manifest={...spec,mode:'built-in image_gen',source,original,web,width:metadata.width,height:metadata.height};
 fs.writeFileSync(promptFile,JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({name,width:metadata.width,height:metadata.height,web,bytes:fs.statSync(web).size}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
