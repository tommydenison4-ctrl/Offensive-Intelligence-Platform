import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('api/scoreboard.js','utf8').replace(/^import .*;\r?\n/,'').replace('export default async function handler','async function handler');
const game={id:'401871091',shortName:'LT @ ULM',date:'2026-10-18T00:00Z',competitions:[{status:{type:{shortDetail:'10/17 - 8:00 PM EDT'}}}]};
let scoreboard={events:[]},schedule={events:[game,{...game,id:'next-day',date:'2026-10-19T00:00Z'}]},failBoard=false,failSchedule=false;
const c=vm.createContext({Intl,Date,Map,Promise,console,espn:async p=>{if(p.startsWith('scoreboard')){if(failBoard)throw Error('offline');return scoreboard}if(failSchedule)throw Error('offline');return schedule}});vm.runInContext(source,c);
async function call(){const res={setHeader(){},status(n){this.code=n;return this},json(data){this.data=data;return this}};c.req={method:'GET',query:{date:'20261017'}};c.res=res;await vm.runInContext('handler(req,res)',c);return res}
let r=await call();assert.equal(r.code,200);assert.equal(r.data.events.length,1);assert.equal(r.data.events[0].id,game.id);assert(r.data.events[0].status.type.shortDetail);
scoreboard={events:[{...game,status:game.competitions[0].status}]};assert.equal((await call()).data.events.length,1);
failBoard=true;assert.equal((await call()).data.events.length,1);failBoard=false;failSchedule=true;assert.equal((await call()).data.events.length,1);failBoard=true;assert.equal((await call()).code,502);
console.log('PASS: omitted pregame event restored, local game date handles UTC midnight, duplicates removed, and either ESPN feed can fail independently.');