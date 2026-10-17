import {espn} from '../lib/espn.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const d=req.query.date;if(!/^\d{8}$/.test(d||''))return res.status(400).json({error:'Choose a valid game date'});
 // ESPN's scoreboard can omit scheduled games. Supplement it with ULM's team schedule.
 const results=await Promise.allSettled([espn('scoreboard?groups=80&limit=1000&dates='+d),espn('teams/2433/schedule?season='+d.slice(0,4))]);
 if(results.every(r=>r.status==='rejected'))return res.status(502).json({error:'ESPN game discovery is unavailable. Enter a known ESPN event ID to connect directly.'});
 const events=new Map(),day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'});
 const add=e=>events.set(String(e.id),{id:String(e.id),shortName:e.shortName||e.name,status:e.status||e.competitions?.[0]?.status||{type:{shortDetail:'Scheduled'}},date:e.date});
 if(results[0].status==='fulfilled')for(const e of results[0].value.events||[])add(e);
 if(results[1].status==='fulfilled')for(const e of results[1].value.events||[]){if(e.date&&day.format(new Date(e.date)).replaceAll('-','')===d&&!events.has(String(e.id)))add(e)}
 return res.status(200).json({events:[...events.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date)))})
}