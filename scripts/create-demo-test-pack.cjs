// Creates local-only demo materials. Never exports account tokens or private keys.
const { mkdir, writeFile, copyFile } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const React = require('../frontend/node_modules/react');
const { renderToStaticMarkup } = require('../frontend/node_modules/react-dom/server');
const { QRCodeSVG } = require('../frontend/node_modules/qrcode.react');
const { chromium } = require('../frontend/node_modules/playwright');
const { call, login, pickup } = require('./seed-samrit.cjs');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style = '<style>body{font:18px Arial,sans-serif;color:#244557;padding:40px;line-height:1.6}h1,h2{line-height:1.2}small{color:#555}table{border-collapse:collapse;width:100%;margin:24px 0}td,th{padding:12px;border:1px solid #ccc;text-align:left}.badge{color:#537a5a;font-weight:bold}.code{overflow-wrap:anywhere;font:13px monospace}svg{display:block;margin:20px auto}.card{break-inside:avoid;border:1px solid #ccc;border-radius:16px;padding:24px;margin:24px 0}</style>';

async function main(){
  const directory = path.resolve(__dirname, '../releases/demo-test-pack');
  await mkdir(directory, { recursive:true });
  const donor=await login('donor@example.com');
  const ngo=await login('ngo@example.com');
  const overview=await call('/api/samrit/overview','GET',undefined,ngo.token);
  const center=overview.centers.find(c=>c.approved);
  if(!center)throw Error('An approved demo center is required.');
  const items=[
    {name:'Hot vegetable soup',ingredients:['Carrots','Potatoes','Beans','Water','Olive oil'],allergens:[],estimatedServings:30,handlingRequirement:'hot',verified:true},
    {name:'Hot vegetable rice bowls',ingredients:['Rice','Carrots','Peas','Soy sauce','Sesame oil'],allergens:['Soybeans','Sesame'],estimatedServings:20,handlingRequirement:'hot',verified:true},
  ];
  const event=await call('/api/events','POST',{name:'Demo Test Pack - '+new Date().toISOString().slice(0,16).replace('T',' '),scheduledAt:new Date(Date.now()-3600000).toISOString(),location:pickup,items,notes:'Fictional test event. Synthetic food, quantities and evidence. For local demonstration only.'},donor.token);
  const codes=[
    {file:'01-venue-check-in',title:'Shared venue check-in',value:center.locationQrCode,note:'Meal visitors: use Already at a place / Check in. Drivers: use this code at center arrival. No exit QR is needed.'},
    {file:'02-event-pickup',title:'Event pickup - '+event.name,value:'SAMRIT:EVENT:'+event.eventId,note:'Driver scans this only for a batch belonging to the pre-created test event. If you create a different event with OCR, use that event\'s own QR from the app.'},
    {file:'03-container-sticker',title:'Unused demo container sticker',value:'DEMO-PACK-'+randomUUID().slice(0,8).toUpperCase(),note:'Link to one new batch after its pickup photo. Use the same sticker at center intake. A sticker cannot be reused for another batch.'},
  ];
  let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true});
    const page=await browser.newPage({viewport:{width:1100,height:1000},deviceScaleFactor:2});
    let cards='';
    for(const code of codes){
      const svg=renderToStaticMarkup(React.createElement(QRCodeSVG,{value:code.value,size:560,level:'M',marginSize:4,bgColor:'#ffffff',fgColor:'#000000'}));
      await writeFile(path.join(directory,code.file+'.svg'),svg);
      await page.setContent('<body style="margin:0;width:560px;background:white">'+svg+'</body>');
      await page.locator('svg').screenshot({path:path.join(directory,code.file+'.png')});
      cards+='<section class="card"><h2>'+escape(code.title)+'</h2>'+svg.replace('width="560"','width="240"').replace('height="560"','height="240"')+'<p class="code">'+escape(code.value)+'</p><p>'+escape(code.note)+'</p></section>';
    }
    const table='<table><tr><th>Dish</th><th>Ingredients</th><th>Servings</th><th>Handling</th><th>Allergens</th></tr>'+items.map(i=>'<tr><td>'+escape(i.name)+'</td><td>'+escape(i.ingredients.join(', '))+'</td><td>'+i.estimatedServings+'</td><td>Served hot</td><td>'+escape(i.allergens.join(', ')||'None declared in this fictional fixture')+'</td></tr>').join('')+'</table>';
    const menu=style+'<p class="badge">FICTIONAL LOCAL TEST DATA - NOT A REAL MEAL OFFER</p><h1>Green Kitchen NYC - Catering Menu</h1><p>Event: '+escape(event.name)+'</p>'+table+'<p>Staff must verify actual ingredients, allergens, handling and leftover portions. For this test, record 10 soup servings and 5 rice-bowl servings as leftovers.</p>';
    await page.setContent(menu);await page.pdf({path:path.join(directory,'04-sample-menu.pdf'),format:'A4',printBackground:true});await page.screenshot({path:path.join(directory,'04-sample-menu.png'),fullPage:true});
    await page.setContent(style+'<p class="badge">FICTIONAL TEST INVOICE - NOT VALID FOR PAYMENT</p><h1>Catering Invoice DEMO-001</h1><p>Supplier: Green Kitchen NYC Demo<br>Customer: Samrit Hackathon Test<br>Date: '+new Date().toISOString().slice(0,10)+'</p>'+table+'<p>Soup: 30 portions x $4.00 = $120.00<br>Rice bowls: 20 portions x $6.00 = $120.00<br>Test total: $240.00 USD</p><small>Invoice quantities are supplied portions, not leftover quantities. Confirm the dishes actually served before donating leftovers.</small>');await page.pdf({path:path.join(directory,'05-sample-invoice.pdf'),format:'A4',printBackground:true});
    await page.setContent(style+'<h1>Samrit Demo QR Sheet</h1><p>Print or display these codes on another screen. These IDs belong to this local database.</p>'+cards);await page.pdf({path:path.join(directory,'00-printable-qr-sheet.pdf'),format:'A4',printBackground:true});
  }finally{if(browser)await browser.close();}
  for(const stage of [1,2,3])await copyFile(path.resolve(__dirname,`fixtures/stage-${stage}.png`),path.join(directory,`0${stage+5}-synthetic-stage-${stage}-photo.png`));
  const data={createdAt:new Date().toISOString(),fictional:true,event:{id:event.eventId,name:event.name,location:pickup,items},center:{id:center.centerId,name:center.name,location:center.location},qrCodes:codes,exampleLeftovers:[{name:items[0].name,servings:10},{name:items[1].name,servings:5}],preferences:['I cannot eat cold food','I prefer vegan food'],review:'The meal was warm and the staff were helpful.',negativeReview:'I waited a long time and left without getting food.'};
  await writeFile(path.join(directory,'test-data.json'),JSON.stringify(data,null,2)+'\n');
  await writeFile(path.join(directory,'START-HERE.md'),`# Samrit demo test pack

All food, invoices, photos, addresses and quantities here are fictional test fixtures. QR codes match the current local database. No exit QR is required.

## Sign in

Open http://localhost:5173/login

| Role | Email | Password |
| --- | --- | --- |
| Donor | donor@example.com | Demo123! |
| Center | ngo@example.com | Demo123! |
| Driver | driver.maya@example.com | DemoDriver123! |
| Admin | admin.demo@example.com | DemoAdmin123! |

Food seekers use http://localhost:5173/consumer without an account.

## Fast walkthrough with ready-made QR codes

1. Donor: open Leftover triage and choose **${event.name}**. This test event is already created and its menu is verified. Do not create another event if you want to use 02-event-pickup.png.
2. Select **10 servings of Hot vegetable soup** and **5 servings of Hot vegetable rice bowls**. Choose hot handling and a future expiry (for example, 4 hours from now, Eastern). Upload 06-synthetic-stage-1-photo.png. Obtain GPS at the pickup point or use the browser test override below.
3. Admin: Dispatch & routes. Choose an available driver, ready hot-capable truck and this new batch. Existing demo routes may already occupy Maya or a truck. Choose a free driver/vehicle, or cancel an eligible demo route before pickup evidence exists. If choosing another driver, sign in with that driver's credentials for the following steps. Driver Jordan: driver.jordan@example.com / DemoDriver123!.
4. Assigned driver: scan **02-event-pickup.png**, upload **07-synthetic-stage-2-photo.png**, then scan **03-container-sticker.png** and link it. The sticker is single-use.
5. Assigned driver: at the center, scan **01-venue-check-in.png** for arrival.
6. Center: open intake, scan the same **03-container-sticker.png**, upload **08-synthetic-stage-3-photo.png**, and complete intake.
7. Food seeker: Already at a place / Check in. Scan **01-venue-check-in.png**. Tap **Finish visit and leave a review**, select Good experience or Needs attention, and submit text from test-data.json. No exit scan is needed. Timing is approximate.
8. Admin: Private quality reviews. Confirm the review and AI analysis are visible only to the central NGO.

## Test OCR separately

Donor / Event planning: select Menu and upload **04-sample-menu.pdf** or **04-sample-menu.png**. Select Invoice to test **05-sample-invoice.pdf**. Confirm all extracted food details before saving. OCR creates a different event with a different event QR; use the QR shown by the app for that event, not 02-event-pickup.png. The shared venue QR remains the same. Gemini must be configured on the server; a provider failure offers manual entry.

## Location checks during a remote demo

Custody actions require device GPS near the registered pickup/center. A typed address does not change browser GPS. In Chrome desktop DevTools, open More tools / Sensors, choose a custom location and allow this site's location permission. Use pickup coordinates for donor/pickup actions, then center coordinates for arrival/intake. This is only a local test simulation; do not disable production GPS checks.

| Stage | Latitude | Longitude |
| --- | --- | --- |
| Pickup | ${pickup.lat} | ${pickup.lng} |
| Center / meal-visitor check-in | ${center.location.lat} | ${center.location.lng} |

Visitor location permission is optional. Camera access on a phone normally needs HTTPS; you can instead paste the exact printed code from test-data.json into the app's scan field. Opening the local desktop site at localhost supports browser camera testing. Show QR images on a second device or print 00-printable-qr-sheet.pdf.

The three supplied stage photos are synthetic placeholders for UI testing, not proof of actual food. Do not use them for real donations. The pack contains no server API keys or sign-in tokens. Database resets invalidate event/venue IDs; regenerate with: node scripts/create-demo-test-pack.cjs
`);
  console.log('Created demo test pack under releases/demo-test-pack. Fresh test event: '+event.name);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
