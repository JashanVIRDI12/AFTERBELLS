const {chromium}=require('/Users/jashan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[];
 for(const [width,height] of [[1920,1080],[1440,900],[1440,1000],[900,900],[768,1024],[390,844],[320,700],[390,667]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://localhost:3000/house',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.fonts.ready);
  const hero=page.locator('[aria-labelledby="house-heading"]');
  await hero.locator('img').evaluate(img=>img.decode());
  const info=await hero.evaluate(el=>{
   const image=el.querySelector('img'),r=el.getBoundingClientRect(),ir=image.getBoundingClientRect();
   const copy=el.querySelector('h1').parentElement.getBoundingClientRect();
   const phone=innerWidth<768;
   const source=phone?{w:941,h:1672}:{w:1672,h:941};
   const scale=Math.max(ir.width/source.w,ir.height/source.h);
   const pos=phone?.55:.72;
   const offsetX=(ir.width-source.w*scale)*pos;
   const project=(x,y)=>({x:offsetX+x*source.w*scale,y:y*source.h*scale});
   const face=phone?project(.66,.2):project(.78,.29);
   const bottle=phone?project(.38,.42):project(.66,.62);
   const inside=p=>p.x>=0&&p.x<=ir.width&&p.y>=0&&p.y<=ir.height;
   return {src:image.currentSrc,hero:{width:r.width,height:r.height},image:{width:ir.width,height:ir.height,left:ir.left,top:ir.top-r.top},
    fillsHero:Math.abs(ir.width-r.width)<1.1&&Math.abs(ir.height-r.height)<1.1&&Math.abs(ir.left-r.left)<1.1,
    faceVisible:inside(face),bottleVisible:inside(bottle),phoneTextBelowGesture:!phone||bottle.y<copy.top-r.top,
    filter:getComputedStyle(image).filter,transform:getComputedStyle(image).transform,objectPosition:getComputedStyle(image).objectPosition,
    figureCount:el.querySelectorAll('figure').length,heading:el.querySelector('h1').textContent,
    usesCorrectCrop:image.currentSrc.includes(phone?'house-model-hero-mobile-v2':'house-model-hero-wide-v1')};
  });
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const text=await page.locator('main').innerText();
  const noLabelDimensions=!/2\s*[×x]\s*2\s*cm/i.test(text);
  if((width===1440&&height===900)||(width===390&&height===844)||width===320)await hero.screenshot({path:`output/audit/house-full-background-${width}-${height}.png`,scale:'css',animations:'disabled'});
  await hero.getByRole('link',{name:'Discover our story'}).click();await page.waitForURL('**/house#our-story');
  await page.waitForFunction(()=>{const r=document.querySelector('#our-story').getBoundingClientRect();return r.top<innerHeight&&r.bottom>0});
  const storyVisible=await page.locator('#house-story-heading').isVisible();
  const chapters=await page.locator('[aria-labelledby="making-h"] ol > li').count();
  const result={width,height,status:response.status(),errors,overflow,...info,noLabelDimensions,storyVisible,chapters};
  results.push(result);console.log(JSON.stringify(result));await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
 await page.addInitScript(()=>sessionStorage.setItem('ab-intro','1'));
 await page.goto('http://localhost:3000/house',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.page-in')).opacity==='1');
 const link=page.getByRole('link',{name:'Discover our story'});await link.focus();
 const focus=await link.evaluate(el=>document.activeElement===el);await link.click();await page.waitForURL('**/house#our-story');
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#house-story-heading')).opacity==='1');
 results.push({normalMotionStoryLinkWorks:true,keyboardFocusable:focus});
 fs.writeFileSync('output/audit/house-full-background-results.json',JSON.stringify(results,null,2)+'\n');
 await browser.close();
 if(results.some(r=>r.status&&(r.status!==200||r.errors.length||r.overflow||!r.fillsHero||!r.faceVisible||!r.bottleVisible||!r.phoneTextBelowGesture||!r.usesCorrectCrop||!r.noLabelDimensions||r.chapters!==3)))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
