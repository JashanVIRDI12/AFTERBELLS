const {chromium}=require('/Users/jashan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000/house',{waitUntil:'domcontentloaded'});
 const making=page.locator('[aria-labelledby="making-h"]');
 const steps=[];
 for(let i=0;i<4;i++){
  const chapter=making.locator('ol > li').nth(i);
  await chapter.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top+el.getBoundingClientRect().height/2-innerHeight*.55,behavior:'instant'}));
  const name=await chapter.locator('h3').innerText();
  await page.waitForFunction(({i,name})=>{
   const plate=document.querySelector('[aria-labelledby="making-h"] div[aria-hidden]');
   const img=plate.querySelectorAll('img')[i];
   const transform=getComputedStyle(img).transform;
   const clip=getComputedStyle(img.parentElement).clipPath;
   const values=clip.match(/[-.\d]+/g)?.map(Number)||[];
   return plate.querySelector('p').textContent.includes(name)&&
    (transform==='none'||transform==='matrix(1, 0, 0, 1, 0, 0)')&&values.length>0&&values.every(v=>Math.abs(v)<.001);
  },{i,name});
  const img=making.locator('div[aria-hidden] img').nth(i);
  await img.evaluate(el=>el.decode());
  steps.push({name,fullyRevealed:true,unscaled:true});
  if(i===0||i===2)await page.screenshot({path:`output/audit/house-craft-viewport-${i}.png`,scale:'css'});
 }
 const fair=page.locator('[aria-labelledby="fair-h"]');
 await fair.scrollIntoViewIfNeeded();
 await fair.locator('img').evaluate(img=>img.decode());
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('[aria-labelledby="fair-h"] [data-reveal]')).opacity==='1');
 await page.screenshot({path:'output/audit/house-closing-viewport.png',scale:'css'});
 const result={normalMotionCrafts:steps,closingPromiseVisible:true,errors};
 fs.writeFileSync('output/audit/house-images-normal-motion.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
