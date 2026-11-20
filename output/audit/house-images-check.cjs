const {chromium}=require('/Users/jashan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs');
const manifests=JSON.parse(fs.readFileSync('output/imagegen/house/prompts.json','utf8')).assets;
const expected=['house-composition','house-gold-editorial','house-cap','house-label-editorial'];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[];
 for(const width of [1920,1440,1000,768,390,320]){
  const page=await browser.newPage({viewport:{width,height:width>=1000?1000:844},deviceScaleFactor:2,reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://localhost:3000/house',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.fonts.ready);
  const hero=page.locator('[data-media-slot="house-hero"]');
  await hero.locator('img').evaluate(img=>img.decode());
  const heroInfo=await hero.evaluate(el=>{
   const img=el.querySelector('img'); const rect=el.getBoundingClientRect();
   return {src:img.currentSrc,width:rect.width,height:rect.height,position:getComputedStyle(img).objectPosition,transform:getComputedStyle(img).transform,filter:getComputedStyle(img).filter};
  });
  if(width===1440||width===390)await hero.screenshot({path:`output/audit/house-hero-${width}.png`,animations:'disabled'});
  const making=page.locator('[aria-labelledby="making-h"]');
  const chapters=making.locator('ol > li');
  const crafts=[];
  for(let i=0;i<4;i++){
   const chapter=chapters.nth(i);
   await chapter.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top+el.getBoundingClientRect().height/2-innerHeight*.55,behavior:'instant'}));
   const title=await chapter.locator('h3').innerText();
   let photo;
   if(width>=1000){
    const plate=making.locator('div[aria-hidden]');
    await page.waitForFunction(({title})=>document.querySelector('[aria-labelledby="making-h"] div[aria-hidden] p')?.textContent.includes(title),{title});
    photo=plate.locator('img').nth(i);
    await photo.evaluate(img=>img.decode());
    if(width===1440&&(i===0||i===2||i===3))await making.locator('[class*="stage"]').screenshot({path:`output/audit/house-making-${i}-${width}.png`,animations:'disabled'});
   }else{
    photo=chapter.locator('img');
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate(img=>img.decode());
    if(width===390&&(i===0||i===3))await chapter.screenshot({path:`output/audit/house-making-${i}-${width}.png`,animations:'disabled'});
   }
   const metrics=await photo.evaluate(img=>({src:img.currentSrc,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,fit:getComputedStyle(img).objectFit,loaded:img.complete&&img.naturalWidth>0}));
   const native=manifests.find(a=>a.name===expected[i]);
   crafts.push({title,...metrics,correctAsset:metrics.src.includes(expected[i]),retinaSufficient:native.width>=metrics.width*2,uncropped:Math.abs(metrics.width/metrics.height-2/3)<.01});
  }
  const fair=page.locator('[aria-labelledby="fair-h"]');
  await fair.scrollIntoViewIfNeeded();
  await fair.locator('img').evaluate(img=>img.decode());
  const fairInfo=await fair.locator('img').evaluate(img=>({src:img.currentSrc,filter:getComputedStyle(img).filter,transform:getComputedStyle(img).transform}));
  if(width===1440)await fair.screenshot({path:'output/audit/house-closing-1440.png',animations:'disabled'});
  const links=await fair.locator('a').evaluateAll(els=>els.map(a=>a.getAttribute('href')));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const result={width,status:response.status(),errors,overflow,hero:heroInfo,crafts,closing:fairInfo,links};
  results.push(result);
  console.log(JSON.stringify({width,status:result.status,errors,overflow,heroHeight:heroInfo.height,crafts:crafts.map(({title,width,height,correctAsset,retinaSufficient,uncropped})=>({title,width,height,correctAsset,retinaSufficient,uncropped})),closing:fairInfo.src.includes('house-edition')}));
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});
 await page.goto('http://localhost:3000/house',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>{const el=document.querySelector('[data-ph-line]');return getComputedStyle(el).transform==='none'||getComputedStyle(el).transform==='matrix(1, 0, 0, 1, 0, 0)'});
 const heroMotion=await page.locator('[data-media-slot="house-hero"] img').evaluate(img=>getComputedStyle(img).transform);
 await page.goto('http://localhost:3000',{waitUntil:'domcontentloaded'});
 const homeTrio=await page.locator('#first-edition img').getAttribute('src');
 const homepagePhotos=await page.locator('main img').evaluateAll(imgs=>imgs.map(img=>img.getAttribute('src')));
 results.push({normalMotionHouseHeroTransform:heroMotion,homepageTrioPreserved:homeTrio.includes('collection-trio-v2'),houseCraftAssetsExcludedFromHomepage:!homepagePhotos.some(src=>expected.some(name=>src.includes(name)))});
 fs.writeFileSync('output/audit/house-images-results.json',JSON.stringify(results,null,2)+'\n');
 await browser.close();
 if(results.some(r=>r.status&&(r.status!==200||r.errors.length||r.overflow||r.crafts.some(c=>!c.loaded||!c.correctAsset||!c.retinaSufficient||!c.uncropped))))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
