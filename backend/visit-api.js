'use strict';
const { database } = require('./database');
const { currentUser } = require('./auth');
const { createNotification } = require('./notification-api');
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));}
function body(req){return new Promise((resolve,reject)=>{const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>{try{resolve(chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{});}catch(e){reject(Object.assign(new Error('JSON 형식이 올바르지 않습니다.'),{status:400}));}});req.on('error',reject);});}
function user(req,res){const value=currentUser(req);if(!value)json(res,401,{message:'로그인이 필요합니다.'});return value;}
function visit(row){return{id:row.id,roomId:row.room_id,title:row.room_title,date:row.visit_date,time:row.visit_time,phone:row.phone,question:row.question,status:row.status,createdAt:row.created_at};}
async function handleVisitRoute(req,res,path){
  if(!path.startsWith('/api/visits')&&!path.startsWith('/api/room-offers'))return false;
  try{
    const member=user(req,res);if(!member)return true;
    if(path==='/api/visits'&&req.method==='GET'){const rows=database.prepare('SELECT * FROM visit_requests WHERE requester_id=? ORDER BY id DESC').all(member.userId);json(res,200,{items:rows.map(visit)});return true;}
    if(path==='/api/visits'&&req.method==='POST'){const p=await body(req);if(!p.roomId||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!/^([01]\d|2[0-3]):00$/.test(p.time)){json(res,400,{message:'방, 날짜와 시간을 확인해 주세요.'});return true;}const now=new Date().toISOString();const r=database.prepare('INSERT INTO visit_requests(requester_id,room_id,room_title,visit_date,visit_time,phone,question,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(member.userId,String(p.roomId),String(p.title||''),p.date,p.time,String(p.phone||''),String(p.question||''),now,now);json(res,201,{item:visit(database.prepare('SELECT * FROM visit_requests WHERE id=?').get(Number(r.lastInsertRowid)))});return true;}
    const match=/^\/api\/visits\/(\d+)\/(approve|reject)$/.exec(path);
    if(match&&req.method==='PATCH'){if(member.role!=='admin'){json(res,403,{message:'현재 방문 승인·거절은 관리자만 처리할 수 있습니다.'});return true;}const status=match[2]==='approve'?'approved':'rejected';const row=database.prepare('SELECT * FROM visit_requests WHERE id=?').get(Number(match[1]));if(!row){json(res,404,{message:'방문 요청을 찾을 수 없습니다.'});return true;}try{database.prepare('UPDATE visit_requests SET status=?,updated_at=? WHERE id=?').run(status,new Date().toISOString(),row.id);}catch(e){if(String(e.message).includes('UNIQUE')){json(res,409,{message:'같은 시간에 이미 확정된 예약이 있습니다.'});return true;}throw e;}createNotification(row.requester_id,'visit_result','방문 신청 처리 결과',`${row.room_title || '방문 신청'}이 ${status==='approved'?'승인':'거절'}되었습니다.`,'visit',row.id);json(res,200,{item:visit(database.prepare('SELECT * FROM visit_requests WHERE id=?').get(row.id))});return true;}
    if(path==='/api/room-offers'&&req.method==='GET'){const rows=database.prepare('SELECT * FROM room_offers WHERE owner_id=? ORDER BY id DESC').all(member.userId);json(res,200,{items:rows.map(r=>({...JSON.parse(r.payload_json),id:r.id,status:r.status}))});return true;}
    if(path==='/api/room-offers'&&req.method==='POST'){const p=await body(req);if(!p.title||!p.moveIn){json(res,400,{message:'방 제목과 입주 가능일을 확인해 주세요.'});return true;}const now=new Date().toISOString();const r=database.prepare('INSERT INTO room_offers(owner_id,payload_json,created_at,updated_at) VALUES(?,?,?,?)').run(member.userId,JSON.stringify(p),now,now);json(res,201,{item:{...p,id:Number(r.lastInsertRowid),status:'active'}});return true;}
    json(res,405,{message:'지원하지 않는 요청입니다.'});return true;
  }catch(e){json(res,e.status||500,{message:e.status?e.message:'예약 데이터를 처리하지 못했습니다.'});return true;}
}
module.exports={handleVisitRoute};
