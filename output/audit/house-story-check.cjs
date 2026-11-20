const {chromium}=require('/Users/jashan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[];
 for(const width of [1920,1440,900,768,390,320]){
  const page=await browser.newPage({viewport:{width,height:width>=900?1000:844},deviceScaleFactor:2,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://localhost:3000/house',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.fonts.ready);
  const hero=page.locator('[aria-labelledby="house-heading"]');
  await hero.locator('img').evaluate(img=>img.decode());
  const heroInfo=await hero.evaluate(el=>{
    const img=el.querySelector('img');const r=img.getBoundingClientRect();const copy=el.querySelector('h1').getBoundingClientRect();
    const overlaps=Math.min(r.right,copy.right)>Math.max(r.left,copy.left)&&Math.min(r.bottom,copy.bottom)>Math.max(r.top,copy.top);
    return {src:img.currentSrc,width:r.width,height:r.height,overlaps,retinaSufficient:r.width*2<=1024.1,quality:new URL(img.currentSrc).searchParams.get('q'),alt:img.alt};
  });
  const text=await page.locator('main').innerText();
  const noDimensions=!/2\s*[×x]\s*2\s*cm/i.test(text);
  const making=page.locator('[aria-labelledby="making-h"]');
  const count=await making.locator('ol > li').count();
  const noLabelChapter=await making.getByRole('heading',{name:'The label',exact:true}).count()===0;
  const headings=await page.locator('main h1').allTextContents();
  if(width===1440||width===390||width===320)await hero.screenshot({path:`output/audit/house-model-story-hero-${width}.png`,scale:'css',animations:'disabled'});
  const story=page.locator('#our-story');
  await hero.getByRole('link',{name:'Discover our story'}).click();
  await page.waitForURL('**/house#our-story');
  await page.waitForFunction(()=>{const rect=document.querySelector('#our-story').getBoundingClientRect();return rect.top<innerHeight&&rect.bottom>0});
  if(width===1440||width===390)await story.screenshot({path:`output/audit/house-model-story-copy-${width}.png`,scale:'css',animations:'disabled'});
  const chapters=[];
  for(let i=0;i<count;i++){
   const chapter=making.locator('ol > li').nth(i);
   await chapter.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top+el.getBoundingClientRect().height/2-innerHeight*.55,behavior:'instant'}));
   const title=await chapter.locator('h3').innerText();
   let image;
   if(width>=1000){
    const plate=making.locator('div[aria-hidden]');
    await page.waitForFunction(title=>document.querySelector('[aria-labelledby="making-h"] div[aria-hidden] p')?.textContent.includes(title),title);
    image=plate.locator('img').nth(i);
   }else image=chapter.locator('img');
   await image.evaluate(img=>img.decode());
   chapters.push({title,loaded:await image.evaluate(img=>img.complete&&img.naturalWidth>0)});
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const result={width,status:response.status(),errors,overflow,hero:heroInfo,noDimensions,noLabelChapter,chapterCount:count,headings,storyAnchorWorks:true,chapters};
  results.push(result);console.log(JSON.stringify(result));
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});
 await page.addInitScript(()=>sessionStorage.setItem('ab-intro','1'));
 await page.goto('http://localhost:3000/house',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.page-in')).opacity==='1');
 const anchor=page.getByRole('link',{name:'Discover our story'});
 await anchor.focus();
 const focused=await anchor.evaluate(el=>document.activeElement===el);
 await anchor.click();await page.waitForURL('**/house#our-story');
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#house-story-heading')).opacity==='1');
 const normal={normalMotionStoryVisible:true,storyLinkKeyboardFocusable:focused};
 for(const slug of ['amber-hour','open-sky','iron-crown']){
   await page.goto(`http://localhost:3000/fragrances/${slug}`,{waitUntil:'domcontentloaded'});
   const text=await page.locator('main').innerText();
   normal[slug]={noDimensions:!/2\s*[×x]\s*2\s*cm/i.test(text),engravedCapCopy:text.includes('Engraved gold cap')};
 }
 results.push(normal);
 fs.writeFileSync('output/audit/house-story-results.json',JSON.stringify(results,null,2)+'\n');
 await browser.close();
 if(results.some(r=>r.status&&(r.status!==200||r.errors.length||r.overflow||r.hero.overlaps||!r.hero.retinaSufficient||!r.hero.src.includes('house-model-ritual-v1')||!r.noDimensions||!r.noLabelChapter||r.chapterCount!==3||r.headings.length!==1||r.chapters.some(c=>!c.loaded))))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
