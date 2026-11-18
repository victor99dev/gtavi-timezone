const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const cities=JSON.parse(fs.readFileSync(path.join(ROOT,'src/regions.json'),'utf8'));
function fixture(live=false){
  const all=[];const ids=new Map();const make=(tag)=>{
    const o={tag,children:[],dataset:{},style:{},className:'',textContent:'',hidden:true,
      classList:{add(){},toggle(){},contains(v){return v==='live-page'&&live}},
      append(...e){this.children.push(...e);all.push(...e)},appendChild(e){this.append(e)},replaceChildren(...e){this.children=e;all.push(...e)},
      addEventListener(name,fn){this['on'+name]=fn},setAttribute(){}};return o;
  };
  const document={body:make('body'),getElementById(id){if(!ids.has(id))ids.set(id,make(id));return ids.get(id)},createElement:make,querySelectorAll(selector){return all.filter(c=>c.tag==='button'&&c.className==='map-pin')}};
  const window={GTA_CITIES:cities,APP_LANG:'pt',APP_SELECTED:null};
  const context={window,document,Intl,Date,console,location:{href:'https://example.invalid/'},navigator:{clipboard:{writeText:async()=>{}}},setInterval(){},setTimeout(){return 1},clearTimeout(){}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8'),context,{filename:'src/app.js'});
  assert.notStrictEqual(ids.get('clock-days').textContent,'', 'Clock not updated');
  assert.strictEqual(ids.get('region-list').children.length,35,'Expected 35 city entries');
  assert(ids.get('world-map').children.length>=10,'Missing map pins');
  if(live) assert(ids.get('live-target').textContent.length>0,'Missing live region');
  ids.get('region-search').oninput({target:{value:'Manaus'}});
  assert.equal(ids.get('region-list').children.length,1,'Search filter failed');
  ids.get('region-list').children[0].onclick();
  assert.equal(ids.get('focus-city').textContent,live?'Auckland':'Manaus','Region selection behavior failed');
  ids.get('reset-target').onclick();
  console.log('Runtime PT',live?'OBS':'home','OK');
}
fixture(false);fixture(true);
