const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'ppt', 'ZipAI_프로젝트_발표자료_v3_최종수정본.pptx');
const SCRIPT_OUT = path.join(ROOT, 'ppt', 'ZipAI_발표대본_v3_최종수정본.txt');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'ZipAI Team';
pptx.subject = 'ZipAI 프로젝트 발표';
pptx.title = 'ZipAI: 데이터로 찾고, 안전하게 계약하는 청년 주거 플랫폼';
pptx.company = 'ZipAI';
pptx.lang = 'ko-KR';
pptx.theme = {
  headFontFace: 'Malgun Gothic', bodyFontFace: 'Malgun Gothic', lang: 'ko-KR'
};
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'F7FAF9' },
  objects: [
    { line: { x: 0.55, y: 7.13, w: 12.2, h: 0, line: { color: 'D9E7E2', width: 1 } } },
    { text: { text: 'ZIPAI · AI 기반 청년 주거 안전 플랫폼', options: { x: 0.58, y: 7.18, w: 5.4, h: 0.16, fontFace: 'Malgun Gothic', fontSize: 8, color: '668078', margin: 0 } } },
  ],
  slideNumber: { x: 12.1, y: 7.16, w: 0.55, h: 0.18, color: '668078', fontFace: 'Malgun Gothic', fontSize: 8, align: 'right', margin: 0 }
});

const C = { navy:'102A43', ink:'173B36', green:'1B7F6B', mint:'DDF3EC', aqua:'52C7B8', blue:'2F6FED', pale:'EAF1FF', orange:'F07C55', peach:'FCE9E2', yellow:'F7C948', gray:'60746F', line:'D9E7E2', white:'FFFFFF', bg:'F7FAF9' };
const scripts = [];
const src = '[Sources]\n- 프로젝트 저장소의 README.md 및 구현 파일(2026-08-07 확인)\n[/Sources]';

function tx(s, text, x,y,w,h,size=18,color=C.ink,bold=false,opts={}) {
  s.addText(text,{x,y,w,h,fontFace:'Malgun Gothic',fontSize:size,color,bold,margin:0,breakLine:false,fit:'shrink',valign:opts.valign||'top',align:opts.align||'left',bullet:opts.bullet,paraSpaceAfterPt:opts.paraSpaceAfterPt||0,isTextBox:true});
}
function rect(s,x,y,w,h,fill=C.white,line=C.line,r=0.12){s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:r,fill:{color:fill},line:{color:line,width:1}})}
function pill(s,t,x,y,w,fill=C.mint,color=C.green){rect(s,x,y,w,0.34,fill,fill,0.17);tx(s,t,x,y+0.075,w,0.16,10,color,true,{align:'center'});}
function title(s,kicker,headline,sub=''){tx(s,kicker.toUpperCase(),0.62,0.38,3.4,0.22,11,C.green,true);tx(s,headline,0.62,0.78,12.05,0.58,26,C.navy,true);if(sub)tx(s,sub,0.62,1.42,11.8,0.38,13,C.gray,false);}
function addNote(s, no, name, text){const full=`슬라이드 ${no}. ${name}\n\n${text}\n\n${src}`; if(s.addNotes) s.addNotes(full); scripts.push(full.replace(src,'').trim());}
function img(s, rel,x,y,w,h){const p=path.join(ROOT,rel); if(fs.existsSync(p)) s.addImage({path:p,x,y,w,h,sizing:'crop'});}
function icon(s,n,x,y,color=C.green){s.addShape(pptx.ShapeType.ellipse,{x,y,w:0.48,h:0.48,fill:{color},line:{color}});tx(s,String(n),x,y+0.13,0.48,0.16,11,C.white,true,{align:'center'});}

// 1 Cover
{
 const s=pptx.addSlide();s.background={color:'0C2824'};
 s.addShape(pptx.ShapeType.rect,{x:8.95,y:0,w:4.38,h:7.5,fill:{color:'145447'},line:{color:'145447'}});
 s.addShape(pptx.ShapeType.ellipse,{x:9.6,y:0.65,w:3.1,h:3.1,fill:{color:'52C7B8',transparency:24},line:{color:'52C7B8',transparency:100}});
 s.addShape(pptx.ShapeType.ellipse,{x:10.55,y:3.55,w:1.8,h:1.8,fill:{color:'F7C948',transparency:15},line:{color:'F7C948',transparency:100}});
 tx(s,'ZIPAI PROJECT',0.72,0.58,3.6,0.28,13,'86E0D2',true);
 tx(s,'데이터로 찾고,\n안전하게 계약하다',0.72,1.52,8.0,1.55,37,C.white,true);
 tx(s,'AI 기반 청년 주거 안전 플랫폼',0.75,3.35,6.1,0.38,20,'CDECE6',false);
 tx(s,'매물 탐색 · 위험 진단 · 금융 정책 · 방문 예약을 하나의 여정으로',0.75,4.05,7.4,0.55,15,'A7CBC4');
 tx(s,'ZipAI 팀 프로젝트 발표  |  2026',0.75,6.65,6.0,0.24,11,'86AAA3');
 addNote(s,1,'표지','안녕하세요. 저희는 청년과 사회초년생이 집을 찾는 순간부터 계약을 준비하는 단계까지 더 안전하게 의사결정할 수 있도록 돕는 ZipAI를 개발했습니다. 오늘은 왜 이 서비스를 기획했는지, 어떤 기능과 구조로 구현했는지, 그리고 앞으로 어떻게 발전시킬지 순서대로 말씀드리겠습니다.');
}

// 2 intro
{
 const s=pptx.addSlide('MASTER'); title(s,'01 · PROJECT','집을 찾는 문제는 가격 검색만으로 끝나지 않습니다','흩어진 매물·안전·계약·정책 정보를 하나의 사용자 여정으로 연결했습니다.');
 const cards=[['문제','치안·사기·정책 정보를 여러 기관과 사이트에서 각각 확인해야 합니다.',C.peach,C.orange],['해결','지도 탐색에서 계약 안전 진단과 정책 확인까지 한 서비스에서 이어집니다.',C.mint,C.green],['목표','초보 임차인이 복잡한 정보를 이해하고 다음 행동을 선택하도록 돕습니다.',C.pale,C.blue]];
 cards.forEach((v,i)=>{const x=0.62+i*4.12;rect(s,x,2.18,3.72,2.45,v[2],v[2]);pill(s,v[0],x+0.24,2.44,0.82,C.white,v[3]);tx(s,v[1],x+0.25,3.08,3.2,1.03,16,C.navy,true);});
 tx(s,'핵심 기대 효과',0.65,5.22,2.2,0.3,16,C.green,true);tx(s,'탐색 시간 단축  ·  계약 위험 신호 조기 발견  ·  청년 주거 정보 접근성 향상',2.45,5.2,9.95,0.36,17,C.ink,true);
 addNote(s,2,'프로젝트 소개','주거 선택은 단순히 가격과 위치를 비교하는 일이 아닙니다. 청년 임차인은 매물 정보뿐 아니라 주변 안전, 전세사기 위험, 대출과 지원 정책까지 따로 확인해야 합니다. ZipAI는 이 분절된 과정을 하나의 흐름으로 묶어, 사용자가 정보를 이해하고 실제 행동으로 옮길 수 있게 하는 것을 목표로 했습니다.');
}

// 3 roles
{
 const s=pptx.addSlide('MASTER');title(s,'02 · TEAM','기능 영역을 나누고 공통 사용자 경험으로 결합했습니다','README에 명시된 담당 범위를 기준으로 정리했습니다.');
 const team=[['윤태석','팀장','프로젝트 방향·통합 조율'],['유준서','팀원','공통 협업·기능 통합'],['송성근','핵심 구현','회원가입·로그인·마이페이지와 공통 헤더·푸터\n지도 기반 매물 탐색·필터·찜하기 / 사기방지·계약 안전·지역 위험안전도'],['김해원','금융지원','청년 정책·대출 추천·금리 계산'],['이혜경','위험도 진단','지역 검색·치안시설·위험안전도 화면']];
 const teamY=[1.88,2.68,3.48,4.72,5.52];
 team.forEach((v,i)=>{const y=teamY[i];const detail=i===2;icon(s,i+1,0.72,y+0.05,detail?C.orange:C.green);tx(s,v[0],1.42,y,1.35,0.31,17,C.navy,true);tx(s,v[1],2.85,y+0.02,1.25,0.26,12,detail?C.orange:C.green,true);tx(s,v[2],4.3,y,7.9,detail?0.78:0.36,detail?13.5:15,C.ink,detail);s.addShape(pptx.ShapeType.line,{x:1.4,y:y+(detail?0.94:0.57),w:10.7,h:0,line:{color:C.line,width:1}});});
 addNote(s,3,'팀 소개 및 역할','저희 팀은 영역별로 기능을 나누되 공통 헤더와 푸터, 디자인 언어, 데이터 흐름을 맞추는 방식으로 협업했습니다. 특히 매물 탐색과 계약 안전, 금융 정책, 지역 위험도처럼 서로 다른 기능이 사용자 입장에서는 하나의 서비스처럼 이어지도록 통합하는 데 집중했습니다.');
}

// 4 env
{
 const s=pptx.addSlide('MASTER');title(s,'03 · DEVELOPMENT','빠른 프로토타입과 확장 가능한 백엔드를 함께 구성했습니다','프론트 시연성과 서버 확장성을 동시에 확보한 하이브리드 구조입니다.');
 const cols=[['FRONTEND',['HTML5 · CSS3 · JavaScript','Leaflet.js 지도·마커·오버레이','반응형 UI · localStorage']],['BACKEND',['Java 21 · Spring Boot 3.5.x','REST API · JPA · Flyway','Node.js 데이터 중계']],['DATA & OPS',['MySQL 8.4 · Aiven','Netlify · Render · Docker','Git · GitHub Actions']]];
 cols.forEach((v,i)=>{const x=0.62+i*4.13;tx(s,v[0],x,2.08,3.45,0.3,14,[C.blue,C.green,C.orange][i],true);s.addShape(pptx.ShapeType.line,{x,y:2.52,w:3.5,h:0,line:{color:[C.blue,C.green,C.orange][i],width:4}});v[1].forEach((t,j)=>{tx(s,t,x,2.9+j*0.78,3.55,0.32,16,C.navy,j===0);});});
 rect(s,0.62,5.55,11.95,0.8,'0F3B34','0F3B34');tx(s,'프로토타입은 브라우저만으로 시연하고, 핵심 도메인은 API·DB로 점진적 전환',0.92,5.82,11.35,0.26,16,C.white,true,{align:'center'});
 addNote(s,4,'개발 환경','프론트엔드는 HTML, CSS, JavaScript와 Leaflet을 중심으로 빠르게 시연할 수 있게 만들었습니다. 동시에 Java 21과 Spring Boot 3.5.x, JPA, Flyway, MySQL을 도입해 회원, 매물, 문의, 방문 예약 같은 핵심 데이터를 서버에 저장할 수 있는 구조를 마련했습니다. 배포는 Netlify와 Render를 활용하고 Docker와 GitHub 기반 협업 환경을 구성했습니다.');
}

// 5 architecture
{
 const s=pptx.addSlide('MASTER');title(s,'04 · ARCHITECTURE','화면–API–서비스–DB를 분리해 기능 확장을 준비했습니다','브라우저 데모와 Spring Boot API가 공존하며 단계적으로 서버 기능을 넓힙니다.');
 const ys=[2.08,3.28,4.48]; const labels=[['VIEW','HTML templates · CSS · Vanilla JS',C.blue,C.pale],['API / DOMAIN','Controller → Service → Repository',C.green,C.mint],['DATA','MySQL · Flyway migration · 외부 공공데이터',C.orange,C.peach]];
 labels.forEach((v,i)=>{rect(s,1.0,ys[i],11.3,0.78,v[3],v[3]);pill(s,v[0],1.25,ys[i]+0.22,1.45,C.white,v[2]);tx(s,v[1],3.0,ys[i]+0.22,8.7,0.28,17,C.navy,true);if(i<2)s.addShape(pptx.ShapeType.downArrow,{x:6.32,y:ys[i]+0.86,w:0.42,h:0.3,fill:{color:C.gray},line:{color:C.gray}});});
 tx(s,'대표 코드 흐름',1.0,5.72,2.0,0.28,14,C.green,true);tx(s,'PropertyController → 서비스/저장소 → PropertyListing   |   AuthController → AuthService → UserRepository',2.55,5.69,9.4,0.38,14,C.ink,true);
 addNote(s,5,'프로젝트 구조 및 코드 설계','이 페이지는 사용자가 화면에서 버튼을 눌렀을 때, 그 요청이 내부에서 어떻게 처리되는지를 보여 줍니다. 예를 들어 사용자가 매물을 검색한다고 가정해 보겠습니다. 먼저 사용자가 보는 웹 화면에서 검색 조건을 입력합니다. 그러면 Controller가 이 요청을 가장 먼저 받아서 어떤 기능이 필요한지 확인합니다. 다음으로 Service가 실제 검색 규칙과 처리 과정을 담당합니다. Repository는 데이터베이스에서 조건에 맞는 매물 정보를 가져옵니다. 마지막으로 MySQL에 저장된 결과가 반대 순서로 화면에 전달되어 사용자가 매물 목록을 보게 됩니다. 쉽게 비유하면 Controller는 접수 창구, Service는 실제 업무 담당자, Repository는 자료를 찾아오는 담당자, 데이터베이스는 자료가 보관된 창고입니다. 이렇게 역할을 나누면 한 부분을 수정해도 다른 기능에 미치는 영향을 줄일 수 있고, 나중에 추천이나 자동 데이터 수집 기능도 더 쉽게 추가할 수 있습니다.');
}

// 6 journey
{
 const s=pptx.addSlide('MASTER');title(s,'05 · USER JOURNEY','사용자는 탐색에서 계약 준비까지 끊김 없이 이동합니다','각 기능의 결과가 다음 행동으로 자연스럽게 연결되도록 설계했습니다.');
 const steps=[['1','매물 탐색','지도·목록·필터'],['2','안전 비교','치안시설·위험도'],['3','계약 진단','체크리스트·전세가율'],['4','지원 확인','금융정책·공공임대'],['5','행동','찜·방문예약·문의']];
 s.addShape(pptx.ShapeType.line,{x:1.05,y:3.2,w:11.1,h:0,line:{color:C.line,width:5}});
 steps.forEach((v,i)=>{const x=0.78+i*2.47;icon(s,v[0],x+0.75,2.96,i===4?C.orange:C.green);tx(s,v[1],x,3.76,2.0,0.32,17,C.navy,true,{align:'center'});tx(s,v[2],x,4.25,2.0,0.55,13,C.gray,false,{align:'center'});});
 rect(s,2.12,5.5,9.15,0.72,C.navy,C.navy);tx(s,'핵심 가치  |  정보 통합 → 판단 지원 → 다음 행동',2.42,5.73,8.55,0.25,16,C.white,true,{align:'center'});
 addNote(s,6,'서비스 기획 및 사용자 동선','사용자는 먼저 지도와 목록에서 후보 매물을 찾습니다. 다음으로 지역 안전과 계약 위험을 비교하고, 필요한 금융 정책이나 공공임대 정보를 확인합니다. 마지막에는 찜하기, 방문 예약, 문의로 이어집니다. 중요한 점은 기능을 나열한 것이 아니라 각 결과가 다음 행동을 안내하도록 연결했다는 것입니다.');
}

// 7 property
{
 const s=pptx.addSlide('MASTER');title(s,'06 · CORE SCREEN','지도와 목록을 함께 보며 후보를 빠르게 좁힙니다','매물 유형·가격·옵션 필터가 목록과 지도에 동시에 반영됩니다.');
 rect(s,0.62,1.95,7.85,4.65,'E7F0E9',C.line); // stylized map
 [[1.1,2.5,6.7,0],[2.2,1.98,0,4.55],[5.0,1.98,0,4.55],[0.7,5.2,7.65,0]].forEach(a=>s.addShape(pptx.ShapeType.line,{x:a[0],y:a[1],w:a[2],h:a[3],line:{color:C.white,width:9,transparency:10}}));
 [['55',1.55,3.0],['LH',4.25,2.75],['48',5.8,4.25],['1.6억',3.0,5.42]].forEach((m,i)=>{s.addShape(pptx.ShapeType.ellipse,{x:m[1],y:m[2],w:0.65,h:0.65,fill:{color:i===1?C.orange:C.blue},line:{color:C.white,width:2}});tx(s,m[0],m[1],m[2]+0.2,0.65,0.16,9,C.white,true,{align:'center'});});
 tx(s,'실제 구현 기능',8.9,2.02,3.2,0.35,18,C.green,true);['경기도 31개 시·군 검색','보증금·월세·주택 유형 필터','주차·엘리베이터·반려동물 옵션','상세 패널·찜하기 동기화','일반 매물 등록 흐름'].forEach((t,i)=>{icon(s,'✓',8.92,2.66+i*0.68,C.green);tx(s,t,9.58,2.72+i*0.68,2.85,0.28,14,C.ink,i===3);});
 addNote(s,7,'핵심 구현 화면 - 매물 탐색','메인 화면은 목록과 지도를 동시에 보여 줍니다. 사용자가 지역, 보증금, 월세, 주택 유형과 옵션을 선택하면 결과가 함께 갱신됩니다. 매물 카드를 선택하면 상세 패널을 열고 찜하기 상태를 로컬 저장소와 동기화합니다. 또한 경기도 매물을 등록하는 시연 흐름도 구현했습니다.');
}

// 8 safety
{
 const s=pptx.addSlide('MASTER');title(s,'07 · SAFETY','복잡한 계약 위험을 점수와 행동 가이드로 바꿨습니다','‘위험하다’는 경고에서 끝나지 않고 무엇을 확인할지 안내합니다.');
 const left=[['3단계 체크리스트','계약 전·당일·입주 후 확인 항목'],['전세가율 계산기','매매가·보증금·선순위 채권 반영'],['안전 결과 리포트','안전/주의/위험 등급과 취약점'],['지역 안전 지도','CCTV·비상벨·지구대·주의구간']];
 left.forEach((v,i)=>{const y=1.98+i*1.08;icon(s,i+1,0.7,y+0.03,[C.green,C.orange,C.blue,C.aqua][i]);tx(s,v[0],1.38,y,3.2,0.28,16,C.navy,true);tx(s,v[1],1.38,y+0.42,4.8,0.3,13,C.gray);});
 rect(s,7.25,1.98,5.1,4.45,C.navy,C.navy);tx(s,'안전 결과',7.68,2.35,2.2,0.3,16,'BCECE3',true);tx(s,'76',7.7,2.95,2.0,0.9,50,C.white,true);tx(s,'/ 100',9.15,3.42,1.1,0.3,15,'A7CBC4',true);pill(s,'주의',10.48,2.58,1.2,C.peach,C.orange);tx(s,'계약 전 확인 필요',7.7,4.08,3.7,0.32,18,C.white,true);tx(s,'• 최신 등기부등본 재확인\n• 보증보험 가입 가능 여부 확인\n• 특약 사항을 계약서에 기록',7.7,4.72,4.0,1.15,14,'D7ECE8');
 addNote(s,8,'핵심 구현 화면 - 계약·지역 안전','안전 기능은 네 부분으로 구성됩니다. 계약 단계별 체크리스트, 전세가율 계산기, 결과 리포트, 지역 안전 지도입니다. 단순히 점수만 보여 주는 것이 아니라 위험 신호가 발견되면 등기부등본 재확인이나 보증보험 가능 여부처럼 사용자가 바로 실행할 행동을 안내합니다.');
}

// 9 additional screens
{
 const s=pptx.addSlide('MASTER');title(s,'08 · EXTENDED EXPERIENCE','집을 고른 뒤 필요한 정보와 행동까지 지원합니다','공공임대·금융정책·방문·커뮤니티가 핵심 여정을 보완합니다.');
 const cards=[['공공임대','LH 공고·행복주택 안내\n자격 조건 사전 확인','static/images/happy-housing-hero-v3.png',C.green],['금융 정책','대상·목적별 상품 필터\n금리·상환 스케줄 계산','static/img/properties/public-housing.jpg',C.blue],['방문과 계약','방문 예약·상태 알림\n안전 계약 흐름','static/images/room-connect/visit-reservation.png',C.orange]];
 cards.forEach((v,i)=>{const x=0.62+i*4.13;rect(s,x,1.98,3.72,4.35,C.white,C.line);img(s,v[2],x+0.08,2.06,3.56,1.66);tx(s,v[0],x+0.23,4.03,2.6,0.32,19,C.navy,true);tx(s,v[1],x+0.23,4.58,3.15,0.7,14,C.gray);s.addShape(pptx.ShapeType.line,{x:x+0.23,y:5.66,w:2.9,h:0,line:{color:v[3],width:4}});});
 addNote(s,9,'주요 확장 화면','ZipAI는 집을 찾는 화면에서 끝나지 않습니다. LH 공고와 행복주택 자격 정보를 확인하고, 청년 금융 정책을 조건별로 찾으며, 금리와 상환 계획을 계산할 수 있습니다. 이후에는 방문 예약과 알림, 커뮤니티와 문의 기능을 통해 실제 행동까지 이어집니다.');
}

// 10 implementation highlights
{
 const s=pptx.addSlide('MASTER');title(s,'09 · IMPLEMENTATION','시연용 기능을 실제 서비스 구조로 전환하고 있습니다','동일한 사용자 경험을 유지하면서 저장·권한·운영 기능을 서버로 확장했습니다.');
 const rows=[['인증','회원가입·로그인·역할 기반 접근','AuthController / AuthService / UserRepository'],['매물','Excel·일반 매물 조회 및 등록','PropertyController / PropertyRepository'],['소통','문의·커뮤니티·댓글·알림','Inquiry · Post · Comment · Notification'],['방문','방문 요청·상태 변경·알림 연계','VisitController / VisitService 흐름'],['운영','관리자 API·DB 마이그레이션·배포','Flyway / Docker / Render']];
 const xs=[0.62,2.35,7.0],ws=[1.73,4.65,5.55];['영역','사용자 가치','구현 단위'].forEach((h,i)=>{s.addShape(pptx.ShapeType.rect,{x:xs[i],y:1.95,w:ws[i],h:0.55,fill:{color:i===0?C.green:C.navy},line:{color:C.white,width:1}});tx(s,h,xs[i],2.13,ws[i],0.18,12,C.white,true,{align:'center'});});
 rows.forEach((r,ri)=>r.forEach((v,i)=>{const y=2.5+ri*0.69;s.addShape(pptx.ShapeType.rect,{x:xs[i],y,w:ws[i],h:0.69,fill:{color:i===0?C.mint:(ri%2?'FFFFFF':'F1F6F4')},line:{color:C.line,width:0.7}});tx(s,v,xs[i]+0.13,y+0.18,ws[i]-0.26,0.28,i===0?14:12.5,i===0?C.green:C.ink,i===0,{align:i===0?'center':'left'});}));
 addNote(s,10,'구현 기능','프론트 시연으로 시작한 기능을 서버 구조로 옮기고 있습니다. 인증은 컨트롤러, 서비스, 저장소로 분리했고 매물, 문의, 커뮤니티, 알림, 방문 요청 도메인을 구현했습니다. Flyway로 스키마를 관리하고 Docker와 Render 배포 구성을 마련해 실제 운영에 필요한 기반을 갖췄습니다.');
}

// 11 demo
{
 const s=pptx.addSlide('MASTER');title(s,'10 · DEMO','한 명의 사용자가 집을 찾고 방문을 준비하는 흐름입니다','시연은 기능 단위가 아니라 의사결정 과정 순서로 진행합니다.');
 const st=[['01','지역·조건 검색','후보 매물 좁히기'],['02','상세·찜하기','비교할 집 저장'],['03','안전 진단','계약 위험 확인'],['04','정책 확인','대출·지원 검토'],['05','방문 예약','실제 행동 연결']];
 st.forEach((v,i)=>{const x=0.62+i*2.48;rect(s,x,2.2,2.12,3.15,i===2?C.peach:C.white,i===2?C.orange:C.line);pill(s,v[0],x+0.2,2.46,0.62,i===2?C.orange:C.mint,i===2?C.white:C.green);tx(s,v[1],x+0.2,3.18,1.72,0.5,17,C.navy,true);tx(s,v[2],x+0.2,4.18,1.72,0.55,13,C.gray);if(i<4)s.addShape(pptx.ShapeType.chevron,{x:x+2.18,y:3.48,w:0.24,h:0.45,fill:{color:C.line},line:{color:C.line}});});
 tx(s,'시연 포인트',0.65,5.87,1.6,0.28,14,C.green,true);tx(s,'필터 반응성  ·  데이터 유지  ·  결과에서 다음 행동으로 이어지는 연결성',2.18,5.84,9.9,0.34,15,C.ink,true);
 addNote(s,11,'프로젝트 시연','시연은 한 사용자의 흐름을 따라갑니다. 먼저 지역과 조건으로 후보를 좁히고, 상세 화면에서 찜합니다. 이어서 계약 안전을 진단하고 관련 정책을 확인한 뒤 방문 예약까지 진행합니다. 이때 필터가 즉시 반영되는지, 데이터가 유지되는지, 각 결과가 다음 행동으로 연결되는지를 중심으로 봐 주시면 됩니다.');
}

// 12 roadmap
{
 const s=pptx.addSlide('MASTER');title(s,'11 · ROADMAP','자동 수집과 개인화가 다음 단계의 핵심입니다','백엔드 안정화 이후 데이터 자동화와 AI 기능을 순차 도입합니다.');
 const phases=[['NOW','서비스 기반','회원·로그인·게시판\nMySQL 연동·운영 안정화'],['NEXT','RPA 데이터 수집','부동산·공공 데이터 자동 수집\n시세·매물·정책 정기 업데이트'],['FUTURE','AI 개인화','맞춤 매물·가격 예측\n지역 분석·챗봇·선호 기반 추천']];
 s.addShape(pptx.ShapeType.line,{x:1.15,y:3.25,w:10.9,h:0,line:{color:C.line,width:3}});
 phases.forEach((v,i)=>{const x=0.76+i*4.15;s.addShape(pptx.ShapeType.ellipse,{x:x+0.16,y:3.03,w:0.45,h:0.45,fill:{color:[C.green,C.orange,C.blue][i]},line:{color:C.white,width:2}});pill(s,v[0],x,1.95,1.0,[C.mint,C.peach,C.pale][i],[C.green,C.orange,C.blue][i]);tx(s,v[1],x,2.5,3.5,0.36,19,C.navy,true);tx(s,v[2],x,3.83,3.55,0.95,14,C.gray);});
 rect(s,1.0,5.55,11.25,0.68,'0F3B34','0F3B34');tx(s,'원칙  |  데이터 신뢰성과 개인정보 보호를 먼저 확보한 뒤 자동화·AI를 적용',1.3,5.78,10.65,0.25,15,C.white,true,{align:'center'});
 addNote(s,12,'향후 개발 계획','다음 단계는 세 구간입니다. 먼저 회원, 게시판, DB 연동을 안정화합니다. 이후 RPA를 활용해 부동산과 공공 데이터를 정기적으로 수집하고 갱신합니다. 마지막으로 충분한 데이터와 검증 체계를 확보한 뒤 맞춤 매물 추천, 가격 예측, 지역 분석, AI 챗봇을 도입할 계획입니다.');
}

// 13 KPT
{
 const s=pptx.addSlide('MASTER');title(s,'12 · RETROSPECTIVE','잘된 점은 유지하고, 데이터 품질과 통합은 더 개선합니다','Keep · Problem · Try를 다음 개발 주기의 실행 항목으로 연결했습니다.');
 const cs=[['KEEP','사용자 여정 중심의 기능 연결\n공통 UI와 역할 분담\n프론트·백엔드 병행 확장',C.mint,C.green],['PROBLEM','일부 기능의 가상 데이터 의존\n공공데이터 형식·갱신 주기 차이\n통합 과정의 중복 코드',C.peach,C.orange],['TRY','API 응답·오류 규격 통일\n자동 수집·검증 파이프라인\n추천 전 데이터 품질 지표화',C.pale,C.blue]];
 cs.forEach((v,i)=>{const x=0.62+i*4.13;rect(s,x,2.0,3.72,3.9,v[2],v[2]);pill(s,v[0],x+0.25,2.28,1.12,C.white,v[3]);tx(s,v[1],x+0.27,3.18,3.12,1.72,16,C.navy,true);s.addShape(pptx.ShapeType.line,{x:x+0.27,y:5.28,w:2.9,h:0,line:{color:v[3],width:4}});});
 addNote(s,13,'프로젝트 회고','잘된 점은 사용자 여정을 중심으로 기능을 연결하고, 역할을 나눠 빠르게 구현한 것입니다. 아쉬운 점은 일부 기능이 가상 데이터에 의존하고 외부 데이터의 형식과 갱신 주기가 다르다는 것입니다. 다음에는 API 규격과 오류 처리를 통일하고, 자동 수집 뒤 데이터 품질을 검증하는 과정을 먼저 만들겠습니다.');
}

// 14 close
{
 const s=pptx.addSlide();s.background={color:'0C2824'};tx(s,'Q&A',0.75,0.6,2.0,0.3,14,'86E0D2',true);tx(s,'좋은 집을 찾는 순간부터\n안전한 계약까지',0.75,1.65,9.7,1.25,36,C.white,true);tx(s,'ZipAI는 흩어진 정보를 하나의 의사결정 여정으로 연결합니다.',0.78,3.42,8.5,0.4,18,'CDECE6');rect(s,0.78,5.3,5.2,0.72,'145447','145447');tx(s,'질문 감사합니다',1.08,5.55,4.6,0.25,16,C.white,true);tx(s,'ZIPAI · 데이터로 찾고, 안전하게 계약하다',0.78,6.72,6.3,0.24,11,'86AAA3');
 addNote(s,14,'마무리 및 Q&A','정리하면 ZipAI는 매물 정보를 더 많이 보여 주는 서비스가 아니라, 청년 임차인이 흩어진 정보를 이해하고 안전한 결정을 내리도록 돕는 플랫폼입니다. 지도 탐색, 계약 진단, 정책 확인과 방문 행동을 하나로 연결했다는 점이 핵심입니다. 이상으로 발표를 마치겠습니다. 질문 부탁드립니다.');
}

async function main(){
 await pptx.writeFile({fileName:OUT});
 const script='ZipAI 프로젝트 발표 대본\n================================\n\n'+scripts.join('\n\n--------------------------------\n\n')+'\n';
 fs.writeFileSync(SCRIPT_OUT,script,'utf8');
 console.log(OUT);console.log(SCRIPT_OUT);
}
main().catch(e=>{console.error(e);process.exit(1)});
