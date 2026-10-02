(function () {
  'use strict';

  const legacyProperties = [
    { id: 101, deal: 'monthly', type: '원룸', deposit: 1000, monthly: 55, maintenance: 7, area: 19.8, floor: '3층', tags: ['풀옵션','역세권'], options: ['에어컨','세탁기','냉장고','인덕션','엘리베이터','CCTV'], parking: false, elevator: true, pet: false, safe: 91, photos: 8, tone: 1 },
    { id: 102, deal: 'monthly', type: '1.5룸', deposit: 3000, monthly: 72, maintenance: 9, area: 27.4, floor: '5층', tags: ['신축','분리형','주차'], options: ['에어컨','세탁기','냉장고','붙박이장','엘리베이터','주차'], parking: true, elevator: true, pet: false, safe: 87, photos: 12, tone: 2 },
    { id: 103, deal: 'jeonse', type: '투룸', deposit: 18500, monthly: 0, maintenance: 5, area: 39.6, floor: '2층', tags: ['투룸','전세','남향'], options: ['에어컨','가스레인지','신발장','베란다','CCTV'], parking: false, elevator: false, pet: true, safe: 82, photos: 10, tone: 3 },
    { id: 104, deal: 'monthly', type: '원룸', deposit: 2000, monthly: 68, maintenance: 8, area: 23.1, floor: '4층', tags: ['테라스','풀옵션'], options: ['에어컨','세탁기','냉장고','전자레인지','테라스'], parking: false, elevator: false, pet: true, safe: 78, photos: 7, tone: 4 },
    { id: 105, deal: 'monthly', type: '투룸', deposit: 1500, monthly: 80, maintenance: 10, area: 42.9, floor: '3층', tags: ['반려동물','투룸','역세권'], options: ['에어컨','세탁기','냉장고','엘리베이터','반려동물'], parking: false, elevator: true, pet: true, safe: 85, photos: 14, tone: 5 },
    { id: 106, deal: 'jeonse', type: '원룸', deposit: 11000, monthly: 0, maintenance: 6, area: 22.5, floor: '6층', tags: ['전세','엘리베이터'], options: ['에어컨','세탁기','냉장고','인덕션','엘리베이터'], parking: false, elevator: true, pet: false, safe: 94, photos: 9, tone: 2 },
    { id: 107, deal: 'jeonse', type: '쓰리룸', deposit: 27000, monthly: 0, maintenance: 0, area: 66.0, floor: '2층', tags: ['쓰리룸','주차','관리비없음'], options: ['에어컨','가스레인지','베란다','주차','반려동물'], parking: true, elevator: false, pet: true, safe: 73, photos: 16, tone: 3 },
    { id: 108, deal: 'monthly', type: '1.5룸', deposit: 5000, monthly: 95, maintenance: 12, area: 31.2, floor: '7층', tags: ['복층','신축','풀옵션'], options: ['시스템에어컨','세탁기','냉장고','건조기','엘리베이터','주차'], parking: true, elevator: true, pet: false, safe: 89, photos: 18, tone: 4 },
    { id: 109, deal: 'monthly', type: '원룸', deposit: 500, monthly: 48, maintenance: 5, area: 18.2, floor: '2층', tags: ['분리형','저렴한월세'], options: ['에어컨','세탁기','냉장고','가스레인지'], parking: false, elevator: false, pet: false, safe: 76, photos: 6, tone: 1 },
    { id: 110, deal: 'monthly', type: '투룸', deposit: 10000, monthly: 45, maintenance: 7, area: 46.2, floor: '3층', tags: ['올수리','투룸','남향'], options: ['에어컨','세탁기','냉장고','붙박이장','CCTV'], parking: false, elevator: false, pet: false, safe: 84, photos: 11, tone: 5 }
  ];

  const sampleOverrides = [
    { title: '수원역 인근 풀옵션 원룸', address: '경기도 수원시 팔달구 매산로', walk: '수원역 도보 6분', lat: 37.2672, lng: 127.0002, district: '수원시', neighborhood: '팔달구' },
    { title: '판교역 생활권 신축 1.5룸', address: '경기도 성남시 분당구 백현동', walk: '판교역 버스 8분', lat: 37.3884, lng: 127.1111, district: '성남시', neighborhood: '분당구' },
    { title: '일산 조용한 주택가 투룸', address: '경기도 고양시 일산동구 마두동', walk: '마두역 도보 8분', lat: 37.6521, lng: 126.7788, district: '고양시', neighborhood: '일산동구' },
    { title: '인덕원역 테라스 원룸', address: '경기도 안양시 동안구 관양동', walk: '인덕원역 도보 7분', lat: 37.4005, lng: 126.9767, district: '안양시', neighborhood: '동안구' },
    { title: '용인시청 인근 반려동물 투룸', address: '경기도 용인시 처인구 삼가동', walk: '용인시청 도보 9분', lat: 37.2408, lng: 127.1777, district: '용인시', neighborhood: '처인구' },
    { title: '광명사거리역 깔끔한 원룸 전세', address: '경기도 광명시 광명동', walk: '광명사거리역 도보 5분', lat: 37.4794, lng: 126.8542, district: '광명시', neighborhood: '광명동' },
    { title: '김포 장기동 주차 가능한 쓰리룸', address: '경기도 김포시 장기동', walk: '장기역 도보 10분', lat: 37.6441, lng: 126.6697, district: '김포시', neighborhood: '장기동' },
    { title: '동탄 센트럴파크 복층 1.5룸', address: '경기도 화성시 반송동', walk: '동탄역 버스 12분', lat: 37.2013, lng: 127.0712, district: '화성시', neighborhood: '반송동' },
    { title: '부천시청역 인근 분리형 원룸', address: '경기도 부천시 원미구 중동', walk: '부천시청역 도보 6분', lat: 37.5046, lng: 126.7634, district: '부천시', neighborhood: '중동' },
    { title: '의정부역 올수리 투룸 월세', address: '경기도 의정부시 의정부동', walk: '의정부역 도보 7분', lat: 37.7381, lng: 127.0458, district: '의정부시', neighborhood: '의정부동' }
  ];
  const cityCenters = {
    '수원시': [37.2636,127.0286], '성남시': [37.4200,127.1265], '고양시': [37.6584,126.8320], '용인시': [37.2411,127.1776],
    '부천시': [37.5034,126.7660], '안산시': [37.3219,126.8309], '안양시': [37.3943,126.9568], '화성시': [37.1995,126.8312],
    '평택시': [36.9921,127.1128], '의정부시': [37.7381,127.0337], '파주시': [37.7599,126.7800], '김포시': [37.6152,126.7156],
    '광명시': [37.4786,126.8644], '광주시': [37.4295,127.2550], '군포시': [37.3617,126.9352], '하남시': [37.5393,127.2148],
    '오산시': [37.1498,127.0772], '이천시': [37.2720,127.4350], '안성시': [37.0080,127.2797], '의왕시': [37.3448,126.9683],
    '양주시': [37.7853,127.0458], '구리시': [37.5943,127.1296], '포천시': [37.8949,127.2002], '동두천시': [37.9034,127.0605],
    '과천시': [37.4292,126.9876], '여주시': [37.2982,127.6372], '남양주시': [37.6360,127.2165], '시흥시': [37.3800,126.8029],
    '가평군': [37.8315,127.5096], '양평군': [37.4917,127.4876], '연천군': [38.0964,127.0748]
  };
  const sampleProperties = legacyProperties.map(function (property, index) {
    return Object.assign({}, property, sampleOverrides[index], {
      source: '등록 예시',
      verifiedAt: '시연 데이터 · 실제 계약 불가'
    });
  });
  const additionalProperties = [
    { id:201, title:'광교중앙역 채광 좋은 오피스텔', address:'경기도 수원시 영통구 이의동', walk:'광교중앙역 도보 4분', lat:37.2886, lng:127.0518, district:'수원시', neighborhood:'영통구', deal:'monthly', type:'오피스텔', deposit:2000, monthly:78, maintenance:11, area:24.6, floor:'12층', tags:['역세권','고층','신축급'], options:['시스템에어컨','빌트인냉장고','드럼세탁기','인덕션','붙박이장','무인택배함'], parking:true, elevator:true, pet:false, safe:92, photos:15, tone:2 },
    { id:202, title:'정자역 테라스 복층 원룸', address:'경기도 성남시 분당구 정자동', walk:'정자역 도보 7분', lat:37.3659, lng:127.1082, district:'성남시', neighborhood:'분당구', deal:'monthly', type:'복층원룸', deposit:3000, monthly:86, maintenance:9, area:29.1, floor:'8층', tags:['복층','테라스','수납공간'], options:['천장형에어컨','복층계단수납','전자레인지','도어락','테라스','CCTV'], parking:true, elevator:true, pet:true, safe:88, photos:19, tone:4 },
    { id:203, title:'백석역 조용한 투룸 전세', address:'경기도 고양시 일산동구 백석동', walk:'백석역 도보 6분', lat:37.6426, lng:126.7881, district:'고양시', neighborhood:'일산동구', deal:'jeonse', type:'투룸', deposit:23500, monthly:0, maintenance:6, area:44.3, floor:'5층', tags:['전세','남향','분리형주방'], options:['가스레인지','신발장','베란다','비디오폰','공동현관','자전거보관소'], parking:true, elevator:true, pet:false, safe:86, photos:13, tone:3 },
    { id:204, title:'기흥역 풀옵션 1.5룸', address:'경기도 용인시 기흥구 구갈동', walk:'기흥역 도보 3분', lat:37.2755, lng:127.1158, district:'용인시', neighborhood:'기흥구', deal:'monthly', type:'1.5룸', deposit:1500, monthly:69, maintenance:8, area:27.8, floor:'10층', tags:['초역세권','풀옵션','보안'], options:['에어컨','냉장고','세탁기','침대','책상','스마트도어락'], parking:false, elevator:true, pet:false, safe:90, photos:17, tone:1 },
    { id:205, title:'상동 생활권 넓은 쓰리룸', address:'경기도 부천시 원미구 상동', walk:'상동역 도보 9분', lat:37.5058, lng:126.7531, district:'부천시', neighborhood:'원미구', deal:'jeonse', type:'쓰리룸', deposit:29800, monthly:0, maintenance:4, area:67.2, floor:'3층', tags:['가족추천','초등학교인근','넓은거실'], options:['3구가스레인지','대형신발장','팬트리','욕실2개','베란다','주차1대'], parking:true, elevator:false, pet:true, safe:84, photos:22, tone:5 },
    { id:206, title:'중앙역 리모델링 다가구 원룸', address:'경기도 안산시 단원구 고잔동', walk:'중앙역 도보 8분', lat:37.3164, lng:126.8393, district:'안산시', neighborhood:'단원구', deal:'monthly', type:'다가구원룸', deposit:500, monthly:46, maintenance:3, area:20.7, floor:'2층', tags:['리모델링','저보증금','대학가'], options:['벽걸이에어컨','미니냉장고','세탁기','인덕션','행거','인터넷'], parking:false, elevator:false, pet:false, safe:79, photos:9, tone:1 },
    { id:207, title:'평촌학원가 깔끔한 투룸', address:'경기도 안양시 동안구 호계동', walk:'범계역 버스 8분', lat:37.3893, lng:126.9538, district:'안양시', neighborhood:'동안구', deal:'monthly', type:'투룸', deposit:5000, monthly:74, maintenance:7, area:41.5, floor:'6층', tags:['학원가','엘리베이터','채광'], options:['천장에어컨','식기세척기','광파오븐','붙박이장','중문','공용정원'], parking:true, elevator:true, pet:false, safe:89, photos:16, tone:2 },
    { id:208, title:'동탄호수공원 반려동물 가능 투룸', address:'경기도 화성시 산척동', walk:'동탄호수공원 도보 5분', lat:37.1717, lng:127.1047, district:'화성시', neighborhood:'동탄7동', deal:'monthly', type:'투룸', deposit:3000, monthly:88, maintenance:10, area:48.8, floor:'9층', tags:['호수뷰','반려동물','공원인접'], options:['펫도어','시스템에어컨2대','건조기','아일랜드식탁','대형창고','전기차충전'], parking:true, elevator:true, pet:true, safe:91, photos:24, tone:4 },
    { id:209, title:'평택역 직장인 추천 도시형생활주택', address:'경기도 평택시 평택동', walk:'평택역 도보 5분', lat:36.9901, lng:127.0865, district:'평택시', neighborhood:'평택동', deal:'monthly', type:'도시형생활주택', deposit:1000, monthly:58, maintenance:6, area:23.4, floor:'7층', tags:['직장인추천','역세권','생활편의'], options:['냉난방기','냉장고','세탁기','전자레인지','옷장','경비실'], parking:true, elevator:true, pet:false, safe:82, photos:11, tone:2 },
    { id:210, title:'의정부역 옥탑 테라스 원룸', address:'경기도 의정부시 의정부동', walk:'의정부역 도보 7분', lat:37.7389, lng:127.0471, district:'의정부시', neighborhood:'의정부동', deal:'monthly', type:'옥탑원룸', deposit:700, monthly:52, maintenance:2, area:22.9, floor:'옥탑층', tags:['단독테라스','탁트인뷰','저관리비'], options:['벽걸이에어컨','냉장고','세탁기','싱크대','야외수전','개별난방'], parking:false, elevator:false, pet:true, safe:77, photos:10, tone:5 },
    { id:211, title:'운정신도시 신축 오피스텔', address:'경기도 파주시 와동동', walk:'운정역 버스 6분', lat:37.7254, lng:126.7569, district:'파주시', neighborhood:'운정동', deal:'jeonse', type:'오피스텔', deposit:17800, monthly:0, maintenance:9, area:31.7, floor:'15층', tags:['신축','신도시','고층전세'], options:['삼성IoT','천장형에어컨','스타일러','빌트인오븐','워크인클로젯','피트니스센터'], parking:true, elevator:true, pet:false, safe:90, photos:21, tone:4 },
    { id:212, title:'김포골드라인 풍무역 1.5룸', address:'경기도 김포시 풍무동', walk:'풍무역 도보 4분', lat:37.6124, lng:126.7326, district:'김포시', neighborhood:'풍무동', deal:'monthly', type:'1.5룸', deposit:2500, monthly:63, maintenance:7, area:30.3, floor:'4층', tags:['골드라인','분리침실','마트인접'], options:['스탠드에어컨','양문형냉장고','통돌이세탁기','수납침대','식탁','택배보관함'], parking:true, elevator:true, pet:false, safe:85, photos:14, tone:3 },
    { id:213, title:'철산역 신혼부부 추천 투룸', address:'경기도 광명시 철산동', walk:'철산역 도보 6분', lat:37.4763, lng:126.8684, district:'광명시', neighborhood:'철산동', deal:'jeonse', type:'투룸', deposit:32000, monthly:0, maintenance:5, area:49.2, floor:'7층', tags:['신혼추천','남서향','역세권'], options:['시스템창호','인덕션3구','김치냉장고장','화장대','욕조','지하주차장'], parking:true, elevator:true, pet:false, safe:93, photos:20, tone:2 },
    { id:214, title:'경기광주역 정원 있는 빌라', address:'경기도 광주시 역동', walk:'경기광주역 도보 10분', lat:37.3998, lng:127.2527, district:'광주시', neighborhood:'역동', deal:'monthly', type:'빌라쓰리룸', deposit:6000, monthly:82, maintenance:4, area:71.6, floor:'1층', tags:['개별정원','아이있는집','신축빌라'], options:['잔디정원','야외창고','아일랜드주방','욕실2개','유모차보관','방범창'], parking:true, elevator:true, pet:true, safe:83, photos:26, tone:5 },
    { id:215, title:'산본역 여성안심 원룸', address:'경기도 군포시 산본동', walk:'산본역 도보 5분', lat:37.3581, lng:126.9332, district:'군포시', neighborhood:'산본동', deal:'monthly', type:'원룸', deposit:1000, monthly:54, maintenance:5, area:18.9, floor:'5층', tags:['여성안심','CCTV','밝은골목'], options:['이중도어락','창문잠금장치','비상벨','택배함','공동현관카메라','관리인상주'], parking:false, elevator:true, pet:false, safe:94, photos:12, tone:1 },
    { id:216, title:'미사강변 한강뷰 오피스텔', address:'경기도 하남시 망월동', walk:'미사역 도보 8분', lat:37.5633, lng:127.1937, district:'하남시', neighborhood:'망월동', deal:'monthly', type:'오피스텔', deposit:5000, monthly:105, maintenance:13, area:36.5, floor:'18층', tags:['한강뷰','고층','커뮤니티'], options:['전면유리창','시스템에어컨','와인셀러','비데','루프탑','세대창고'], parking:true, elevator:true, pet:false, safe:92, photos:28, tone:4 },
    { id:217, title:'오산대역 가성비 분리형 원룸', address:'경기도 오산시 수청동', walk:'오산대역 도보 4분', lat:37.1694, lng:127.0631, district:'오산시', neighborhood:'수청동', deal:'monthly', type:'분리형원룸', deposit:800, monthly:45, maintenance:4, area:21.8, floor:'3층', tags:['가성비','분리주방','역앞'], options:['에어컨','소형냉장고','세탁기','하이라이트','책장','현관중문'], parking:false, elevator:true, pet:false, safe:81, photos:8, tone:3 },
    { id:218, title:'이천시청 인근 전원형 투룸', address:'경기도 이천시 중리동', walk:'이천시청 버스 5분', lat:37.2738, lng:127.4402, district:'이천시', neighborhood:'중리동', deal:'jeonse', type:'다가구투룸', deposit:14500, monthly:0, maintenance:2, area:46.1, floor:'2층', tags:['조용한주택가','저관리비','텃밭'], options:['개별보일러','가스레인지','대형베란다','외부창고','공용텃밭','빨래건조대'], parking:true, elevator:false, pet:true, safe:80, photos:15, tone:5 },
    { id:219, title:'안성중앙대 앞 대학생 원룸', address:'경기도 안성시 대덕면 내리', walk:'중앙대 정문 도보 3분', lat:37.0025, lng:127.2316, district:'안성시', neighborhood:'대덕면', deal:'monthly', type:'대학생원룸', deposit:300, monthly:38, maintenance:5, area:17.6, floor:'4층', tags:['대학가','인터넷무료','즉시입주'], options:['침대','책상','책장','냉장고','전자레인지','공용건조기'], parking:false, elevator:false, pet:false, safe:75, photos:7, tone:1 },
    { id:220, title:'의왕역 신축 테라스 투룸', address:'경기도 의왕시 삼동', walk:'의왕역 도보 6분', lat:37.3209, lng:126.9483, district:'의왕시', neighborhood:'삼동', deal:'monthly', type:'테라스투룸', deposit:4000, monthly:76, maintenance:6, area:43.9, floor:'6층', tags:['신축첫입주','테라스','숲세권'], options:['폴딩도어','테라스어닝','천장에어컨2대','건조기','팬트리','공기청정환기'], parking:true, elevator:true, pet:true, safe:89, photos:23, tone:2 },
    { id:221, title:'옥정신도시 가족형 쓰리룸', address:'경기도 양주시 옥정동', walk:'옥정중앙공원 도보 4분', lat:37.8212, lng:127.0946, district:'양주시', neighborhood:'옥정동', deal:'jeonse', type:'쓰리룸', deposit:22000, monthly:0, maintenance:8, area:74.8, floor:'11층', tags:['신도시','공원앞','가족형'], options:['드레스룸','팬트리','욕실2개','식기세척기','커뮤니티시설','어린이놀이터'], parking:true, elevator:true, pet:false, safe:87, photos:25, tone:4 },
    { id:222, title:'구리시장 인근 상가주택 원룸', address:'경기도 구리시 수택동', walk:'구리역 도보 11분', lat:37.5967, lng:127.1424, district:'구리시', neighborhood:'수택동', deal:'monthly', type:'상가주택원룸', deposit:1000, monthly:49, maintenance:3, area:19.4, floor:'3층', tags:['시장인접','생활편의','저관리비'], options:['벽걸이에어컨','냉장고','세탁기','가스레인지','싱크대수납','외부CCTV'], parking:false, elevator:false, pet:false, safe:78, photos:9, tone:3 },
    { id:223, title:'포천시청 근처 단독주택 별채', address:'경기도 포천시 신읍동', walk:'포천시청 도보 8분', lat:37.8947, lng:127.2009, district:'포천시', neighborhood:'신읍동', deal:'monthly', type:'단독주택별채', deposit:2000, monthly:57, maintenance:0, area:51.3, floor:'1층', tags:['마당','관리비없음','독립공간'], options:['전용마당','창고','주방후드','장독대공간','외부수도','개별현관'], parking:true, elevator:false, pet:true, safe:76, photos:18, tone:5 },
    { id:224, title:'동두천중앙역 소형 아파트 전세', address:'경기도 동두천시 생연동', walk:'동두천중앙역 도보 7분', lat:37.9025, lng:127.0548, district:'동두천시', neighborhood:'생연동', deal:'jeonse', type:'소형아파트', deposit:9800, monthly:0, maintenance:9, area:48.5, floor:'9층', tags:['소형아파트','전세','전망'], options:['엘리베이터','경비실','발코니','욕조','단지주차','분리수거장'], parking:true, elevator:true, pet:false, safe:80, photos:14, tone:2 },
    { id:225, title:'과천청사역 고급 1.5룸', address:'경기도 과천시 중앙동', walk:'정부과천청사역 도보 5분', lat:37.4267, lng:126.9892, district:'과천시', neighborhood:'중앙동', deal:'monthly', type:'고급1.5룸', deposit:10000, monthly:110, maintenance:12, area:34.2, floor:'6층', tags:['정부청사','고급마감','숲세권'], options:['대리석아트월','비스포크냉장고','세탁건조타워','시스템에어컨','호텔식욕실','컨시어지'], parking:true, elevator:true, pet:false, safe:96, photos:27, tone:4 },
    { id:226, title:'여주역 신축 투룸 월세', address:'경기도 여주시 교동', walk:'여주역 도보 6분', lat:37.2821, lng:127.6287, district:'여주시', neighborhood:'교동', deal:'monthly', type:'신축투룸', deposit:2000, monthly:61, maintenance:5, area:39.8, floor:'5층', tags:['신축','경강선','남향'], options:['시스템에어컨2대','냉장고','세탁기','인덕션','붙박이장','지상주차'], parking:true, elevator:true, pet:false, safe:84, photos:16, tone:1 },
    { id:227, title:'다산신도시 복층 오피스텔', address:'경기도 남양주시 다산동', walk:'도농역 버스 7분', lat:37.6248, lng:127.1539, district:'남양주시', neighborhood:'다산동', deal:'jeonse', type:'복층오피스텔', deposit:26000, monthly:0, maintenance:12, area:45.7, floor:'13층', tags:['다산신도시','복층','상권중심'], options:['복층침실','계단수납','천장형에어컨','아일랜드식탁','공용라운지','기계식주차'], parking:true, elevator:true, pet:false, safe:88, photos:23, tone:3 },
    { id:228, title:'시흥배곧 바다 가까운 투룸', address:'경기도 시흥시 배곧동', walk:'배곧한울공원 도보 6분', lat:37.3706, lng:126.7298, district:'시흥시', neighborhood:'배곧동', deal:'monthly', type:'투룸', deposit:3500, monthly:71, maintenance:8, area:42.6, floor:'8층', tags:['공원인접','바다산책','신축'], options:['시스템에어컨','건조기','식기세척기','현관중문','공용테라스','전기차충전'], parking:true, elevator:true, pet:true, safe:86, photos:20, tone:2 },
    { id:229, title:'양평역 햇살 좋은 전원주택', address:'경기도 양평군 양평읍 양근리', walk:'양평역 차량 5분', lat:37.4911, lng:127.4918, district:'양평군', neighborhood:'양평읍', deal:'jeonse', type:'전원주택', deposit:28500, monthly:0, maintenance:0, area:82.4, floor:'1~2층', tags:['전원생활','마당','복층주택'], options:['잔디마당','벽난로','다락방','창고','태양광','2대주차'], parking:true, elevator:false, pet:true, safe:81, photos:30, tone:5 },
    { id:230, title:'가평역 세컨하우스형 투룸', address:'경기도 가평군 가평읍 대곡리', walk:'가평역 도보 9분', lat:37.8148, lng:127.5103, district:'가평군', neighborhood:'가평읍', deal:'monthly', type:'세컨하우스투룸', deposit:1500, monthly:59, maintenance:3, area:47.9, floor:'2층', tags:['북한강생활권','주말주택','조용한동네'], options:['넓은데크','빔프로젝터','개별바비큐장','자전거창고','대형창','주차마당'], parking:true, elevator:false, pet:true, safe:79, photos:18, tone:3 }
  ].map(function (property) {
    return Object.assign({ source:'등록 예시', verifiedAt:'시연 데이터 · 실제 계약 불가' }, property);
  });
  let generalProperties = sampleProperties.concat(additionalProperties, getRegisteredProperties()).filter(isGyeonggiProperty);
  let publicProperties = [];
  let properties = generalProperties;
  let publicLoading = false;
  let publicLoadError = '';
  let publicApiConnected = false;
  let adminExcelLoaded = false;

  const state = { category: 'general', deal: 'all', room: 'all', query: '', maxMonthly: 150, maxDeposit: 30000, parking: false, elevator: false, pet: false, safeOnly: false, favoritesOnly: false, sort: 'recommended', selected: null, bounds: null };
  let favorites = getStoredFavorites();
  let displayedProperties = properties.slice();
  let propertyMap = null;
  let currentLocationMarker = null;
  let safetyInsightPanel = null;
  let initialMapFitDone = false;
  const propertyMarkers = new Map();
  const aggregateMarkers = new Map();
  const amenityMarkers = new Map();
  const amenityMinZoom = 17;
  const amenityPlaces = [
    { id:'mart-yatap', category:'mart', icon:'🛒', name:'야탑 생활 할인마트', address:'성남시 분당구 야탑동', lat:37.4114, lng:127.1287 },
    { id:'daiso-yatap', category:'living', icon:'🧺', name:'다이소 야탑점', address:'성남시 분당구 야탑동', lat:37.4111, lng:127.1274 },
    { id:'mart-seohyeon', category:'mart', icon:'🥬', name:'서현 식품 할인마트', address:'성남시 분당구 서현동', lat:37.3852, lng:127.1232 },
    { id:'daiso-seohyeon', category:'living', icon:'🧺', name:'다이소 서현점', address:'성남시 분당구 서현동', lat:37.3858, lng:127.1221 },
    { id:'hospital-yatap', category:'hospital', icon:'✚', name:'야탑 생활권 병원', address:'성남시 분당구 야탑동', lat:37.4101, lng:127.1260 },
    { id:'pharmacy-yatap', category:'pharmacy', icon:'💊', name:'야탑역 약국', address:'성남시 분당구 야탑동', lat:37.4122, lng:127.1280 },
    { id:'hospital-seohyeon', category:'hospital', icon:'✚', name:'서현 생활권 병원', address:'성남시 분당구 서현동', lat:37.3837, lng:127.1212 },
    { id:'pharmacy-seohyeon', category:'pharmacy', icon:'💊', name:'서현역 약국', address:'성남시 분당구 서현동', lat:37.3855, lng:127.1244 },
    { id:'mart-moran', category:'mart', icon:'🛒', name:'모란시장 식품 상권', address:'성남시 중원구 성남동', lat:37.4321, lng:127.1291 },
    { id:'living-moran', category:'living', icon:'🧺', name:'모란 생활용품점', address:'성남시 중원구 성남동', lat:37.4310, lng:127.1280 },
    { id:'hospital-moran', category:'hospital', icon:'✚', name:'모란역 병원', address:'성남시 중원구 성남동', lat:37.4300, lng:127.1299 },
    { id:'pharmacy-moran', category:'pharmacy', icon:'💊', name:'모란역 약국', address:'성남시 중원구 성남동', lat:37.4316, lng:127.1302 }
  ];
  let safetyZoneLayers = [];
  const defaultMapCenter = [37.4138, 127.1792];
  const southKoreaBounds = [[36.82, 126.30], [38.32, 127.86]];
  const markerZoomLevels = { district: 12, neighborhood: 14.5 };
  const safetyPalette = {
    high: { label: '안전', color: '#079455', fill: '#12b76a' },
    medium: { label: '주의', color: '#b77900', fill: '#fdb022' },
    low: { label: '위험', color: '#d92d20', fill: '#f04438' }
  };
  const app = document.querySelector('.property-app');
  const propertyList = document.getElementById('propertyList');
  const realMapElement = document.getElementById('realMap');
  const detail = document.getElementById('propertyDetail');
  const filterSheet = document.getElementById('filterSheet');
  const inquiryModal = document.getElementById('inquiryModal');
  const listingRegistrationModal = document.getElementById('listingRegistrationModal');

  function getRegisteredProperties() {
    try {
      const data = JSON.parse(localStorage.getItem('zipaiGyeonggiProperties') || '[]');
      return Array.isArray(data) ? data : [];
    } catch (error) { return []; }
  }

  function isGyeonggiProperty(property) {
    return property && String(property.address || '').indexOf('경기도 ') === 0 &&
      Number(property.lat) >= 36.82 && Number(property.lat) <= 38.32 &&
      Number(property.lng) >= 126.30 && Number(property.lng) <= 127.86;
  }

  function getStoredFavorites() {
    try {
      const data = JSON.parse(localStorage.getItem('zipdosoFavorites') || '[]');
      return Array.isArray(data) ? data.map(Number) : [];
    } catch (error) { return []; }
  }

  function saveFavorites(syncServer) {
    try { localStorage.setItem('zipdosoFavorites', JSON.stringify(favorites)); } catch (error) { /* local file privacy mode */ }
    try {
      const previous = JSON.parse(localStorage.getItem('zipaiFavoriteProperties') || '[]');
      const previousById = new Map((Array.isArray(previous) ? previous : []).map(function (property) {
        return [Number(property.id), property];
      }));
      const favoriteProperties = favorites.map(function (id) {
        const property = generalProperties.find(function (item) { return Number(item.id) === Number(id); }) ||
          properties.find(function (item) { return Number(item.id) === Number(id); }) ||
          previousById.get(Number(id));
        if (!property) return null;
        return {
          id: property.id,
          title: property.title,
          address: property.address,
          deal: property.deal,
          type: property.type,
          deposit: Number(property.deposit || 0),
          monthly: Number(property.monthly || 0),
          maintenance: Number(property.maintenance || 0),
          area: Number(property.area || 0),
          floor: property.floor || '',
          walk: property.walk || '',
          source: property.source || '등록 매물',
          imageUrl: property.source === 'LH 공공데이터'
            ? '/static/img/properties/public-housing.jpg'
            : (Number(property.tone) % 2 === 0 ? '/static/img/properties/two-room.jpg' : '/static/img/properties/studio.jpg')
        };
      }).filter(Boolean);
      localStorage.setItem('zipaiFavoriteProperties', JSON.stringify(favoriteProperties));
    } catch (error) { /* local file privacy mode */ }
    const favoriteCount = document.getElementById('favoriteCount');
    if (favoriteCount) favoriteCount.textContent = favorites.length;
    if (syncServer && window.ZipaiAuth && window.ZipaiAuth.getUser()) {
      fetch('/api/favorites', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: favorites })
      }).catch(function () { showToast('찜 목록을 서버에 저장하지 못했습니다.'); });
    }
  }

  async function loadServerFavorites() {
    if (!window.ZipaiAuth) return;
    await window.ZipaiAuth.ready;
    if (!window.ZipaiAuth.getUser()) return;
    try {
      const response = await fetch('/api/favorites', { credentials: 'same-origin' });
      if (!response.ok) return;
      const payload = await response.json();
      // 로그인 사용자의 찜은 서버 목록만 신뢰한다. 서버가 비어 있을 때
      // 예시/게스트 localStorage 값을 올리면 새 계정에 가짜 찜이 생긴다.
      if (Array.isArray(payload.ids)) favorites = payload.ids.map(Number);
      saveFavorites(false);
      render();
    } catch (error) { /* 로컬 찜 목록을 유지합니다. */ }
  }

  function money(value) {
    if (value >= 10000) {
      const eok = Math.floor(value / 10000);
      const rest = value % 10000;
      return eok + '억' + (rest ? ' ' + rest.toLocaleString('ko-KR') : '');
    }
    return value.toLocaleString('ko-KR');
  }

  function priceText(property) {
    if (property.source === 'LH 공공데이터') return '모집공고 확인';
    return property.deal === 'jeonse' ? money(property.deposit) : money(property.deposit) + '/' + property.monthly;
  }

  function dealLabel(property) {
    if (property.source === 'LH 공공데이터') return '공공임대';
    return property.deal === 'jeonse' ? '전세' : '월세';
  }

  function filteredWith(options) {
    const config = Object.assign({}, state, options || {});
    const query = config.query.trim().toLowerCase();
    let result = properties.filter(function (property) {
      if (config.deal !== 'all' && property.deal !== config.deal) return false;
      if (config.room !== 'all' && property.type !== config.room) return false;
      if (property.deal === 'monthly' && property.monthly > config.maxMonthly) return false;
      if (property.deposit > config.maxDeposit) return false;
      if (config.parking && !property.parking) return false;
      if (config.elevator && !property.elevator) return false;
      if (config.pet && !property.pet) return false;
      if (config.safeOnly && property.safe < 85) return false;
      if (config.favoritesOnly && !favorites.includes(property.id)) return false;
      if (config.bounds && !config.bounds.contains([property.lat, property.lng])) return false;
      if (query) {
        const target = [property.title, property.type, property.address, property.walk].concat(property.tags).join(' ').toLowerCase();
        if (!target.includes(query)) return false;
      }
      return true;
    });
    const sorters = {
      lowMonthly: function (a, b) { return (a.monthly || 9999) - (b.monthly || 9999); },
      lowDeposit: function (a, b) { return a.deposit - b.deposit; },
      largeArea: function (a, b) { return b.area - a.area; },
      safe: function (a, b) { return b.safe - a.safe; },
      recommended: function (a, b) { return (b.safe + b.photos / 3) - (a.safe + a.photos / 3); }
    };
    return result.sort(sorters[config.sort] || sorters.recommended);
  }

  function propertyCard(property) {
    const liked = favorites.includes(property.id);
    const official = property.source === 'LH 공공데이터';
    if (official) {
      return '<article class="property-card' + (state.selected === property.id ? ' active' : '') + '" data-id="' + property.id + '" tabindex="0">' +
        propertyPhoto(property, true, false) +
        '<div class="property-info"><p class="property-type">' + escapeHtml(property.type) + ' · ' + escapeHtml(property.status || '공고중') + '</p>' +
        '<p class="property-price"><span class="deal-badge monthly">공공임대</span>모집공고 확인</p>' +
        '<p class="property-address">' + escapeHtml(property.address) + '</p><p class="property-tags">' + property.tags.map(function (tag) { return '<span>#' + escapeHtml(tag) + '</span>'; }).join('') + '</p>' +
        '<span class="data-source-badge official">LH 공공데이터 · ' + escapeHtml(property.verifiedAt) + '</span></div></article>';
    }
    return '<article class="property-card' + (state.selected === property.id ? ' active' : '') + '" data-id="' + property.id + '" tabindex="0">' +
      propertyPhoto(property, false, false) +
      '<div class="property-info"><p class="property-type">' + property.type + ' · ' + property.walk + '</p><p class="property-price"><span class="deal-badge ' + property.deal + '">' + dealLabel(property) + '</span>' + priceText(property) + '</p><p class="property-meta">관리비 ' + (property.maintenance ? property.maintenance + '만' : '없음') + ' · ' + property.area + '㎡ · ' + property.floor + '</p><p class="property-address">' + property.address + '</p><p class="property-tags">' + property.tags.map(function (tag) { return '<span>#' + tag + '</span>'; }).join('') + '</p>' +
      '<span class="data-source-badge">' + escapeHtml(property.source || '등록 매물') + ' · ' + escapeHtml(property.verifiedAt || '확인일 미입력') + '</span></div>' +
      '<button type="button" class="favorite-button' + (liked ? ' active' : '') + '" data-favorite="' + property.id + '" aria-label="찜하기">' + (liked ? '♥' : '♡') + '</button></article>';
  }

  function propertyPhoto(property, official, detailView) {
    const image = official
      ? 'static/img/properties/public-housing.jpg'
      : (Number(property.tone) % 2 === 0 ? 'static/img/properties/two-room.jpg' : 'static/img/properties/studio.jpg');
    const label = official ? '공공임대 대표 예시 이미지' : '매물 공간 예시 이미지';
    const badge = official ? 'LH 공고 · 예시 이미지' : '예시 이미지 · 사진 ' + Number(property.photos || 0) + '장';
    return '<div class="property-photo has-image tone-' + Number(property.tone || 1) + (detailView ? ' detail-hero' : '') + '">' +
      '<img src="' + image + '" alt="' + label + '" loading="' + (detailView ? 'eager' : 'lazy') + '" decoding="async" onerror="this.parentNode.classList.remove(\'has-image\');this.remove()">' +
      (!official && property.safe >= 85 ? '<span class="safe-ribbon">안심 ' + property.safe + '</span>' : '') +
      '<span class="photo-count">' + badge + '</span></div>';
  }

  function render() {
    displayedProperties = filteredWith();
    document.getElementById('listingCount').textContent = displayedProperties.length;
    document.getElementById('sheetResultCount').textContent = displayedProperties.length;
    if (state.category === 'public' && publicLoading) {
      propertyList.innerHTML = '<div class="list-loading"><i></i><span>LH 공식 모집공고를 불러오고 있어요</span></div>';
    } else if (state.category === 'public' && publicLoadError) {
      propertyList.innerHTML = '<div class="public-setup"><strong>' + (publicApiConnected ? '현재 모집 중인 공고가 없어요' : '공공데이터 연결이 필요해요') + '</strong><p>' + escapeHtml(publicLoadError) + '</p>' +
        (publicApiConnected ? '' : '<code>.env 파일에 PUBLIC_DATA_SERVICE_KEY를 입력한 뒤 서버를 다시 시작해 주세요.</code>') + '</div>';
    } else if (!displayedProperties.length) {
      propertyList.innerHTML = '<div class="empty-list"><span>⌕</span><h2>조건에 맞는 방이 없어요</h2><p>지역이나 상세 조건을 조금 넓혀보세요.</p></div>';
    } else propertyList.innerHTML = displayedProperties.map(propertyCard).join('');
    renderMarkers();
    if (state.selected && !displayedProperties.some(function (item) { return item.id === state.selected; })) closeDetail();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
    });
  }

  function markerLabel(property) {
    if (property.source === 'LH 공공데이터') return 'LH 공고';
    if (isSafetyMode()) return safetyPalette[safetyTone(property.safe)].label;
    return dealLabel(property) + ' ' + priceText(property);
  }

  function safetyTone(score) {
    if (score >= 88) return 'high';
    if (score >= 80) return 'medium';
    return 'low';
  }

  function safetyClass(score) {
    return 'safe-' + safetyTone(score);
  }

  function isSafetyMode() {
    const canvas = document.getElementById('mapCanvas');
    return Boolean(canvas && canvas.classList.contains('safe-map'));
  }

  function markerIcon(property) {
    const classes = ['map-marker-bubble', property.deal, safetyClass(property.safe)];
    if (state.selected === property.id) classes.push('active');
    return L.divIcon({
      className: 'listing-map-icon',
      html: '<button type="button" class="' + classes.join(' ') + '" aria-label="' + escapeHtml(property.title) + '">' + escapeHtml(markerLabel(property)) + '</button>',
      iconSize: [1, 1],
      iconAnchor: [0, 0]
    });
  }

  function amenityIcon(place) {
    return L.divIcon({
      className: 'amenity-map-icon',
      html: '<button type="button" class="amenity-marker amenity-' + place.category + '" aria-label="' +
        escapeHtml(place.name) + '"><span aria-hidden="true">' + place.icon + '</span><strong>' +
        escapeHtml(place.name) + '</strong></button>',
      iconSize: [1, 1],
      iconAnchor: [0, 0]
    });
  }

  function renderAmenityMarkers() {
    if (!propertyMap || !window.L) return;
    if (propertyMap.getZoom() < amenityMinZoom) {
      clearMarkerMap(amenityMarkers);
      return;
    }
    amenityPlaces.forEach(function (place) {
      let marker = amenityMarkers.get(place.id);
      if (!marker) {
        marker = L.marker([place.lat, place.lng], {
          icon: amenityIcon(place),
          keyboard: true,
          title: place.name
        }).on('click', function () {
          showToast(place.icon + ' ' + place.name + ' · ' + place.address);
        });
        amenityMarkers.set(place.id, marker);
      }
      if (!propertyMap.hasLayer(marker)) marker.addTo(propertyMap);
      marker.setZIndexOffset(700);
    });
  }

  function regionFor(property) {
    return { district: property.district || '경기도', neighborhood: property.neighborhood || property.district || '경기도' };
  }

  function currentMarkerLevel() {
    if (!propertyMap) return 'property';
    const zoom = propertyMap.getZoom();
    if (zoom < markerZoomLevels.district) return 'district';
    if (zoom < markerZoomLevels.neighborhood) return 'neighborhood';
    return 'property';
  }

  function clearMarkerMap(markerMap) {
    markerMap.forEach(function (marker) {
      if (propertyMap && propertyMap.hasLayer(marker)) propertyMap.removeLayer(marker);
    });
  }

  function clearSafetyZones() {
    safetyZoneLayers.forEach(function (layer) {
      if (propertyMap && propertyMap.hasLayer(layer)) propertyMap.removeLayer(layer);
    });
    safetyZoneLayers = [];
  }

  function groupLabel(property, level) {
    const region = regionFor(property);
    return level === 'district' ? region.district : region.neighborhood;
  }

  function groupKey(property, level) {
    const region = regionFor(property);
    return level === 'district' ? region.district : region.district + ' ' + region.neighborhood;
  }

  function groupedProperties(level) {
    const groups = new Map();
    displayedProperties.forEach(function (property) {
      const key = groupKey(property, level);
      if (!groups.has(key)) {
        groups.set(key, {
          key: key,
          label: groupLabel(property, level),
          level: level,
          properties: [],
          latTotal: 0,
          lngTotal: 0
        });
      }
      const group = groups.get(key);
      group.properties.push(property);
      group.latTotal += property.lat;
      group.lngTotal += property.lng;
      group.safeTotal = (group.safeTotal || 0) + property.safe;
    });

    return Array.from(groups.values()).map(function (group) {
      group.lat = group.latTotal / group.properties.length;
      group.lng = group.lngTotal / group.properties.length;
      group.safeAverage = Math.round(group.safeTotal / group.properties.length);
      return group;
    });
  }

  function aggregateIcon(group) {
    const classes = ['map-aggregate-marker', group.level, safetyClass(group.safeAverage)];
    const safetyLabel = safetyPalette[safetyTone(group.safeAverage)].label;
    const caption = isSafetyMode() ? safetyLabel + ' · ' + group.properties.length + '개' : group.properties.length + '개 매물';
    return L.divIcon({
      className: 'aggregate-map-icon',
      html: '<button type="button" class="' + classes.join(' ') + '" aria-label="' + escapeHtml(group.label + ' ' + safetyLabel + ', 안전도 ' + group.safeAverage + '점, ' + group.properties.length + '개 매물') + '">' +
        '<strong>' + escapeHtml(group.label) + '</strong><span>' + escapeHtml(caption) + '</span></button>',
      iconSize: [1, 1],
      iconAnchor: [0, 0]
    });
  }

  function safetySubjects(level) {
    if (level === 'property') {
      return displayedProperties.map(function (property) {
        return {
          lat: property.lat,
          lng: property.lng,
          safe: property.safe,
          label: property.title,
          count: 1,
          level: 'property'
        };
      });
    }

    return groupedProperties(level).map(function (group) {
      return {
        lat: group.lat,
        lng: group.lng,
        safe: group.safeAverage,
        label: group.label,
        count: group.properties.length,
        level: group.level
      };
    });
  }

  function renderSafetyZones(level) {
    clearSafetyZones();
    updateSafetyInsight();
    if (!propertyMap || !isSafetyMode() || !displayedProperties.length) return;

    const radiusByLevel = { district: 1900, neighborhood: 850, property: 320 };
    safetySubjects(level).forEach(function (subject) {
      const palette = safetyPalette[safetyTone(subject.safe)];
      const layer = L.circle([subject.lat, subject.lng], {
        radius: radiusByLevel[subject.level] || 420,
        interactive: false,
        className: 'safety-zone safety-zone-' + safetyTone(subject.safe),
        color: palette.color,
        fillColor: palette.fill,
        fillOpacity: subject.level === 'property' ? 0.28 : 0.22,
        opacity: 0.9,
        weight: subject.level === 'property' ? 2 : 3
      }).addTo(propertyMap);
      safetyZoneLayers.push(layer);
    });
  }

  function ensureSafetyInsightPanel() {
    const mapPanel = document.getElementById('mapPanel');
    if (!mapPanel || safetyInsightPanel) return;
    safetyInsightPanel = document.createElement('div');
    safetyInsightPanel.className = 'safety-insight-panel';
    safetyInsightPanel.id = 'safetyInsightPanel';
    mapPanel.appendChild(safetyInsightPanel);
  }

  function updateSafetyInsight() {
    ensureSafetyInsightPanel();
    if (!safetyInsightPanel) return;
    if (!isSafetyMode() || !displayedProperties.length) {
      safetyInsightPanel.innerHTML = '';
      return;
    }

    const average = Math.round(displayedProperties.reduce(function (sum, property) {
      return sum + property.safe;
    }, 0) / displayedProperties.length);
    const counts = displayedProperties.reduce(function (result, property) {
      result[safetyTone(property.safe)] += 1;
      return result;
    }, { high: 0, medium: 0, low: 0 });
    const tone = safetyTone(average);

    safetyInsightPanel.innerHTML =
      '<div class="safety-insight-head"><span class="safety-dot ' + tone + '"></span><div><strong>안전도 렌즈</strong><small>현재 표시된 매물 기준</small></div><b>' + average + '</b></div>' +
      '<div class="safety-meter"><i style="width:' + average + '%"></i></div>' +
      '<div class="safety-legend-row"><span><i class="high"></i>안전 ' + counts.high + '</span><span><i class="medium"></i>주의 ' + counts.medium + '</span><span><i class="low"></i>위험 ' + counts.low + '</span></div>';
  }

  function focusGroup(group) {
    if (!propertyMap || !group.properties.length) return;
    const bounds = L.latLngBounds(group.properties.map(function (property) {
      return [property.lat, property.lng];
    }));
    propertyMap.flyToBounds(bounds, {
      paddingTopLeft: [70, 80],
      paddingBottomRight: [90, 130],
      maxZoom: group.level === 'district' ? 13.5 : 15,
      duration: 0.65
    });
  }

  function renderAggregateMarkers(level) {
    clearMarkerMap(propertyMarkers);
    clearMarkerMap(aggregateMarkers);
    aggregateMarkers.clear();

    groupedProperties(level).forEach(function (group) {
      const marker = L.marker([group.lat, group.lng], {
        icon: aggregateIcon(group),
        keyboard: true,
        title: group.label
      }).on('click', function () {
        focusGroup(group);
      });
      aggregateMarkers.set(group.key, marker);
      marker.addTo(propertyMap);
    });
  }

  function initMap() {
    if (!realMapElement) return;
    if (!window.L) {
      realMapElement.innerHTML = '<div class="map-fallback">지도를 불러오지 못했습니다. 인터넷 연결 또는 Leaflet CDN 로딩 상태를 확인해 주세요.</div>';
      return;
    }

    propertyMap = L.map(realMapElement, {
      zoomControl: false,
      attributionControl: true,
      maxBounds: southKoreaBounds,
      maxBoundsViscosity: 0.9,
      minZoom: 7,
      maxZoom: 19,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
      wheelDebounceTime: 20,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      easeLinearity: 0.18
    }).setView(defaultMapCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      bounds: southKoreaBounds,
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(propertyMap);

    propertyMap.on('zoomend', renderMarkers);
    window.addEventListener('load', function () { refreshMapLayout(true); });
    window.addEventListener('resize', function () { refreshMapLayout(false); });
    refreshMapLayout(true);
    renderAmenityMarkers();
  }

  function fitDisplayedProperties() {
    if (!propertyMap || !displayedProperties.length) return;
    const bounds = L.latLngBounds(displayedProperties.map(function (property) {
      return [property.lat, property.lng];
    }));
    propertyMap.flyToBounds(bounds, {
      paddingTopLeft: [70, 80],
      paddingBottomRight: [90, 130],
      maxZoom: 15,
      duration: 0.7
    });
  }

  function refreshMapLayout(shouldFit) {
    if (!propertyMap) return;
    setTimeout(function () {
      propertyMap.invalidateSize();
      if (shouldFit) fitDisplayedProperties();
    }, 80);
  }

  function focusPropertyOnMap(property) {
    if (!propertyMap || !property) return;
    propertyMap.invalidateSize();
    propertyMap.flyTo([property.lat, property.lng], Math.max(propertyMap.getZoom(), 15), {
      animate: true,
      duration: 0.65
    });
  }

  function renderMarkers() {
    if (!propertyMap || !window.L) return;
    renderAmenityMarkers();

    const markerLevel = currentMarkerLevel();
    if (markerLevel !== 'property') {
      renderAggregateMarkers(markerLevel);
      renderSafetyZones(markerLevel);
      if (!initialMapFitDone && displayedProperties.length) {
        fitDisplayedProperties();
        initialMapFitDone = true;
      }
      return;
    }

    clearMarkerMap(aggregateMarkers);
    aggregateMarkers.clear();

    const visibleIds = new Set(displayedProperties.map(function (property) { return property.id; }));
    properties.forEach(function (property) {
      const visible = visibleIds.has(property.id);
      let marker = propertyMarkers.get(property.id);

      if (!visible) {
        if (marker && propertyMap.hasLayer(marker)) propertyMap.removeLayer(marker);
        return;
      }

      if (!marker) {
        marker = L.marker([property.lat, property.lng], {
          icon: markerIcon(property),
          keyboard: true,
          title: property.title,
          alt: property.title
        }).on('click', function () {
          openDetail(property.id, true);
        });
        propertyMarkers.set(property.id, marker);
      } else {
        marker.setLatLng([property.lat, property.lng]);
        marker.setIcon(markerIcon(property));
      }

      marker.setZIndexOffset(state.selected === property.id ? 1000 : 0);
      if (!propertyMap.hasLayer(marker)) marker.addTo(propertyMap);
    });
    renderSafetyZones('property');

    if (!initialMapFitDone && displayedProperties.length) {
      fitDisplayedProperties();
      initialMapFitDone = true;
    }
  }

  function toggleFavorite(id) {
    if (favorites.includes(id)) favorites = favorites.filter(function (value) { return value !== id; });
    else favorites.push(id);
    saveFavorites(true); render();
    if (state.selected === id) openDetail(id, false);
    showToast(favorites.includes(id) ? '찜한 매물에 저장했어요.' : '찜한 매물에서 삭제했어요.');
  }

  function openDetail(id, scrollCard) {
    const property = properties.find(function (item) { return item.id === id; });
    if (!property) return;
    state.selected = id;
    const liked = favorites.includes(id);
    if (property.source === 'LH 공공데이터') {
      document.getElementById('detailContent').innerHTML = propertyPhoto(property, true, true) + '<div class="detail-body">' +
        '<div class="detail-topline"><span class="detail-safe">✓ 공공데이터포털 연계</span></div>' +
        '<h2><span class="deal-badge monthly">공공임대</span></h2><p class="detail-title">' + escapeHtml(property.title) + '</p><p class="detail-address">' + escapeHtml(property.address) + '</p>' +
        '<dl class="detail-stats"><div><dt>공고 유형</dt><dd>' + escapeHtml(property.type) + '</dd></div><div><dt>공고 상태</dt><dd>' + escapeHtml(property.status || '공고중') + '</dd></div><div><dt>위치 표시</dt><dd>시·군 대표 위치</dd></div></dl>' +
        '<section class="detail-section"><h3>데이터 안내</h3><p>LH 공식 모집공고를 표시합니다. 신청 자격, 정확한 소재지, 보증금과 임대료는 반드시 원문 공고에서 확인하세요.</p></section></div>' +
        '<div class="detail-actions"><a href="' + escapeHtml(property.publicUrl) + '" target="_blank" rel="noopener noreferrer">LH 원문 공고 확인</a></div>';
      detail.classList.add('open'); detail.setAttribute('aria-hidden', 'false');
      renderMarkers(); focusPropertyOnMap(property);
      return;
    }
    document.getElementById('detailContent').innerHTML = propertyPhoto(property, false, true) + '<div class="detail-body">' +
      '<div class="detail-topline"><span class="detail-safe">✓ 집도소 안전점수 ' + property.safe + '</span><button type="button" class="detail-favorite' + (liked ? ' active' : '') + '" data-favorite="' + id + '">' + (liked ? '♥' : '♡') + '</button></div>' +
      '<h2><span class="deal-badge ' + property.deal + '">' + dealLabel(property) + '</span> ' + priceText(property) + '</h2><p class="detail-title">' + property.title + '</p><p class="detail-address">' + property.address + ' · ' + property.walk + '</p>' +
      '<dl class="detail-stats"><div><dt>전용면적</dt><dd>' + property.area + '㎡</dd></div><div><dt>해당 층</dt><dd>' + property.floor + '</dd></div><div><dt>관리비</dt><dd>' + (property.maintenance ? property.maintenance + '만원' : '없음') + '</dd></div></dl>' +
      '<section class="detail-section"><h3>옵션 정보</h3><div class="option-grid">' + property.options.map(function (option) { return '<span>✓ ' + option + '</span>'; }).join('') + '</div></section>' +
      '<section class="detail-section"><h3>보증금 안전 진단</h3><div class="safety-score-box"><span class="safety-score-ring">' + property.safe + '</span><p>기본 권리관계 기준으로 확인했어요.<br><a href="templates/defense/fraud_result.html">계약 전 정밀 진단하기 →</a></p></div></section></div>' +
      '<div class="detail-actions"><a href="templates/defense/checklist.html">안전 진단</a><button type="button" data-inquiry="' + id + '">방문 상담 신청</button></div>';
    detail.classList.add('open'); detail.setAttribute('aria-hidden', 'false');
    renderMarkers();
    focusPropertyOnMap(property);
    document.querySelectorAll('.property-card').forEach(function (card) { card.classList.toggle('active', Number(card.dataset.id) === id); });
    if (scrollCard) {
      const card = document.querySelector('.property-card[data-id="' + id + '"]');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function closeDetail() {
    state.selected = null; detail.classList.remove('open'); detail.setAttribute('aria-hidden', 'true'); renderMarkers();
    document.querySelectorAll('.property-card').forEach(function (card) { card.classList.remove('active'); });
  }

  function showToast(message) {
    const toast = document.getElementById('homeToast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(window.__homeToast); window.__homeToast = setTimeout(function () { toast.classList.remove('show'); }, 2300);
  }

  function openSheet(sheet) { sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); }
  function closeSheet(sheet) { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); }
  function detailedFilterCount() { return [state.maxMonthly < 150, state.maxDeposit < 30000, state.parking, state.elevator, state.pet, state.safeOnly].filter(Boolean).length; }
  function updateFilterBadge() {
    const count = detailedFilterCount(); const badge = document.getElementById('activeFilterCount'); badge.hidden = count === 0; badge.textContent = count;
  }
  function previewSheetCount() {
    const temp = { maxMonthly: Number(document.getElementById('monthlyRange').value), maxDeposit: Number(document.getElementById('depositRange').value), parking: document.getElementById('parkingFilter').checked, elevator: document.getElementById('elevatorFilter').checked, pet: document.getElementById('petFilter').checked, safeOnly: document.getElementById('safeFilter').checked };
    document.getElementById('sheetResultCount').textContent = filteredWith(temp).length;
  }
  function updateRangeLabels() {
    const monthly = Number(document.getElementById('monthlyRange').value), deposit = Number(document.getElementById('depositRange').value);
    document.getElementById('monthlyValue').textContent = monthly >= 150 ? '제한 없음' : monthly + '만원 이하';
    document.getElementById('depositValue').textContent = deposit >= 30000 ? '제한 없음' : money(deposit) + '만원 이하';
    previewSheetCount();
  }

  propertyList.addEventListener('click', function (event) {
    const favorite = event.target.closest('[data-favorite]'); if (favorite) { event.stopPropagation(); toggleFavorite(Number(favorite.dataset.favorite)); return; }
    const card = event.target.closest('.property-card'); if (card) openDetail(Number(card.dataset.id), false);
  });
  propertyList.addEventListener('keydown', function (event) { if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.property-card')) { event.preventDefault(); openDetail(Number(event.target.dataset.id), false); } });
  document.getElementById('detailClose').addEventListener('click', closeDetail);
  detail.addEventListener('click', function (event) {
    const favorite = event.target.closest('[data-favorite]'); if (favorite) toggleFavorite(Number(favorite.dataset.favorite));
    const inquiry = event.target.closest('[data-inquiry]'); if (inquiry) openInquiry(Number(inquiry.dataset.inquiry));
  });

  document.getElementById('dealFilters').addEventListener('click', function (event) {
    const button = event.target.closest('[data-deal]'); if (!button) return;
    state.deal = button.dataset.deal; this.querySelectorAll('[data-deal]').forEach(function (item) { item.classList.toggle('active', item === button); }); render();
  });
  document.getElementById('roomFilter').addEventListener('change', function () { state.room = this.value; render(); });
  document.getElementById('sortSelect').addEventListener('change', function () { state.sort = this.value; render(); });
  document.getElementById('locationSearch').addEventListener('submit', function (event) {
    event.preventDefault(); const input = document.getElementById('searchInput'); state.query = input.value;
    state.bounds = null;
    document.getElementById('locationLabel').textContent = input.value.trim() ? '"' + input.value.trim() + '" 검색 결과' : '경기도 전체';
    const loading = document.getElementById('listLoading'); propertyList.hidden = true; loading.hidden = false;
    setTimeout(function () { loading.hidden = true; propertyList.hidden = false; render(); }, 420);
  });

  document.getElementById('openFilterButton').addEventListener('click', function () {
    document.getElementById('monthlyRange').value = state.maxMonthly; document.getElementById('depositRange').value = state.maxDeposit;
    document.getElementById('parkingFilter').checked = state.parking; document.getElementById('elevatorFilter').checked = state.elevator; document.getElementById('petFilter').checked = state.pet; document.getElementById('safeFilter').checked = state.safeOnly;
    updateRangeLabels(); openSheet(filterSheet);
  });
  filterSheet.querySelector('.sheet-close').addEventListener('click', function () { closeSheet(filterSheet); });
  filterSheet.querySelectorAll('input').forEach(function (input) { input.addEventListener('input', updateRangeLabels); });
  document.getElementById('applyFilters').addEventListener('click', function () {
    state.maxMonthly = Number(document.getElementById('monthlyRange').value); state.maxDeposit = Number(document.getElementById('depositRange').value); state.parking = document.getElementById('parkingFilter').checked; state.elevator = document.getElementById('elevatorFilter').checked; state.pet = document.getElementById('petFilter').checked; state.safeOnly = document.getElementById('safeFilter').checked;
    state.favoritesOnly = false; updateFilterBadge(); closeSheet(filterSheet); render();
  });
  document.getElementById('resetFilters').addEventListener('click', function () {
    document.getElementById('monthlyRange').value = 150; document.getElementById('depositRange').value = 30000; filterSheet.querySelectorAll('input[type="checkbox"]').forEach(function (input) { input.checked = false; }); updateRangeLabels();
  });

  const savedHomesButton = document.getElementById('savedHomesButton');
  if (savedHomesButton) {
    savedHomesButton.addEventListener('click', function () {
      if (!favorites.length) { showToast('아직 찜한 매물이 없어요.'); return; }
      state.favoritesOnly = !state.favoritesOnly;
      this.classList.toggle('active', state.favoritesOnly);
      this.setAttribute('aria-pressed', String(state.favoritesOnly));
      render();
      showToast(state.favoritesOnly ? '찜한 매물만 모아볼게요.' : '전체 매물을 보여드려요.');
    });
  }

  document.querySelectorAll('[data-map-mode]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-map-mode]').forEach(function (item) { item.classList.remove('active'); });
      this.classList.add('active');
      const mapPanel = document.getElementById('mapPanel');
      const canvas = document.getElementById('mapCanvas');
      canvas.classList.toggle('district', this.dataset.mapMode === 'district');
      canvas.classList.toggle('safe-map', this.dataset.mapMode === 'safe');
      if (mapPanel) mapPanel.classList.toggle('safety-view', this.dataset.mapMode === 'safe');
      if (propertyMap) propertyMap.invalidateSize();
      renderMarkers();
      if (this.dataset.mapMode === 'safe') showToast('안전도 렌즈를 켰어요. 점수별 권역을 확인해 보세요.');
    });
  });

  document.getElementById('zoomIn').addEventListener('click', function () {
    if (propertyMap) propertyMap.setZoomAround(propertyMap.getCenter(), propertyMap.getZoom() + 0.5, { animate: true });
  });
  document.getElementById('zoomOut').addEventListener('click', function () {
    if (propertyMap) propertyMap.setZoomAround(propertyMap.getCenter(), propertyMap.getZoom() - 0.5, { animate: true });
  });
  document.getElementById('searchThisArea').addEventListener('click', function () {
    const button = this;
    button.innerHTML = '<span>↻</span> 검색 중';
    if (propertyMap) state.bounds = propertyMap.getBounds();
    setTimeout(function () {
      render();
      button.innerHTML = '<span>✓</span> 검색 완료';
      showToast('현재 지도 범위 안의 매물을 다시 불러왔어요.');
      setTimeout(function () { button.innerHTML = '<span>↻</span> 현 지도에서 검색'; }, 1200);
    }, 350);
  });
  document.getElementById('myLocation').addEventListener('click', function () {
    if (!propertyMap) return;
    if (!navigator.geolocation) {
      propertyMap.flyTo(defaultMapCenter, 14, { duration: 0.65 });
      showToast('현재 위치를 지원하지 않아 경기도 중심으로 이동했어요.');
      return;
    }

    showToast('현재 위치를 확인하고 있어요.');
    navigator.geolocation.getCurrentPosition(function (position) {
      const currentLatLng = [position.coords.latitude, position.coords.longitude];
      if (!L.latLngBounds(southKoreaBounds).contains(currentLatLng)) {
        propertyMap.flyTo(defaultMapCenter, 14, { duration: 0.65 });
        showToast('현재 위치가 경기도 밖이라 경기도 중심으로 이동했어요.');
        return;
      }

      if (!currentLocationMarker) {
        currentLocationMarker = L.circleMarker(currentLatLng, {
          radius: 8,
          color: '#2468e8',
          weight: 3,
          fillColor: '#ffffff',
          fillOpacity: 1
        }).addTo(propertyMap);
      } else {
        currentLocationMarker.setLatLng(currentLatLng);
      }
      propertyMap.flyTo(currentLatLng, 15, { duration: 0.75 });
      showToast('현재 위치로 이동했어요.');
    }, function () {
      propertyMap.flyTo(defaultMapCenter, 14, { duration: 0.65 });
      showToast('위치 권한을 받을 수 없어 경기도 중심으로 이동했어요.');
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });

  document.querySelectorAll('.mobile-view-switch button').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.mobile-view-switch button').forEach(function (item) { item.classList.remove('active'); });
      this.classList.add('active');
      app.classList.toggle('map-view', this.dataset.view === 'map');
      if (this.dataset.view === 'map' && propertyMap) {
        setTimeout(function () {
          propertyMap.invalidateSize();
          if (!initialMapFitDone) fitDisplayedProperties();
        }, 80);
      }
    });
  });

  function openInquiry(id) { const property = properties.find(function (item) { return item.id === id; }); inquiryModal.dataset.id = id; document.getElementById('inquiryPropertyName').textContent = property.title + ' · ' + dealLabel(property) + ' ' + priceText(property); openSheet(inquiryModal); }
  inquiryModal.querySelector('.inquiry-close').addEventListener('click', function () { closeSheet(inquiryModal); });
  document.getElementById('phoneInput').addEventListener('input', function () { const number = this.value.replace(/[^0-9]/g,'').slice(0,11); this.value = number.length > 7 ? number.slice(0,3) + '-' + number.slice(3,7) + '-' + number.slice(7) : number.length > 3 ? number.slice(0,3) + '-' + number.slice(3) : number; });
  document.getElementById('submitInquiry').addEventListener('click', function () { const phone = document.getElementById('phoneInput'); if (phone.value.replace(/[^0-9]/g,'').length < 10) { phone.focus(); showToast('연락받을 휴대폰 번호를 확인해 주세요.'); return; } closeSheet(inquiryModal); phone.value = ''; showToast('데모 상담 신청이 완료됐어요.'); });
  [filterSheet, inquiryModal].forEach(function (sheet) { sheet.addEventListener('click', function (event) { if (event.target === sheet) closeSheet(sheet); }); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { closeSheet(filterSheet); closeSheet(inquiryModal); closeSheet(listingRegistrationModal); closeDetail(); } });
  document.querySelectorAll('[data-demo-link],[data-demo-button]').forEach(function (item) { item.addEventListener('click', function (event) { event.preventDefault(); showToast('이 메뉴는 메인 홈 데모에서 준비 중이에요.'); }); });

  function detectCity(text) {
    const target = String(text || '');
    return Object.keys(cityCenters).find(function (city) { return target.indexOf(city) !== -1; }) || '';
  }

  function publicNoticeToProperty(notice, index) {
    const title = String(notice.title || 'LH 공공임대 모집공고');
    const city = detectCity(title + ' ' + (notice.region || ''));
    const center = cityCenters[city] || defaultMapCenter;
    const jitter = ((Number(notice.id) || index) % 9 - 4) * 0.0015;
    return {
      id: Number(notice.id) || 800000 + index,
      title: title,
      deal: 'monthly',
      type: notice.type || '공공임대',
      deposit: 0,
      monthly: 0,
      maintenance: 0,
      area: 0,
      floor: '공고 참조',
      address: city ? '경기도 ' + city : '경기도 (상세 주소는 공고 참조)',
      walk: '자격·일정 확인',
      tags: [notice.status || '공고중', 'LH', '공공임대'],
      options: [],
      parking: false,
      elevator: false,
      pet: false,
      safe: 85,
      photos: 0,
      tone: index % 5 + 1,
      lat: center[0] + jitter,
      lng: center[1] - jitter,
      district: city || '경기도',
      neighborhood: city || '공공임대',
      source: 'LH 공공데이터',
      verifiedAt: notice.fetchedAt || '실시간 조회',
      status: notice.status || '공고중',
      publicUrl: notice.detailUrl || 'https://apply.lh.or.kr/'
    };
  }

  async function loadPublicHousing() {
    if (publicLoading || publicProperties.length) return;
    publicLoading = true;
    publicLoadError = '';
    render();
    try {
      const response = await fetch('/api/public-housing');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || '공공임대 API를 불러오지 못했습니다.');
      publicApiConnected = true;
      publicProperties = (payload.items || []).map(publicNoticeToProperty).filter(isGyeonggiProperty);
      properties = publicProperties;
      if (!publicProperties.length) publicLoadError = '현재 조회 조건에 맞는 경기도 공고중 모집공고가 없습니다.';
    } catch (error) {
      publicLoadError = location.protocol === 'file:'
        ? '공식 API는 index.html 파일을 직접 열면 사용할 수 없습니다. 아래 명령으로 로컬 서버를 실행하고 접속해 주세요.'
        : error.message;
      properties = [];
    } finally {
      publicLoading = false;
      initialMapFitDone = false;
      render();
      if (properties.length) fitDisplayedProperties();
    }
  }

  async function loadAdminExcelProperties() {
    if (adminExcelLoaded) return;
    try {
      const response = await fetch('/api/general-properties');
      if (!response.ok) return;
      const payload = await response.json();
      const excelProperties = (payload.items || []).filter(isGyeonggiProperty);
      if (!excelProperties.length) return;
      const excelIds = new Set(excelProperties.map(function (property) { return property.id; }));
      generalProperties = additionalProperties.concat(sampleProperties.filter(function (property) {
        return property.district !== '성남시' && !excelIds.has(property.id);
      })).concat(getRegisteredProperties()).concat(excelProperties).filter(isGyeonggiProperty);
      saveFavorites();
      adminExcelLoaded = true;
      if (state.category === 'general') {
        properties = generalProperties;
        initialMapFitDone = false;
        render();
        fitDisplayedProperties();
        showToast('관리자 Excel의 성남시 매물 10건을 불러왔어요.');
      }
    } catch (error) {
      /* Go Live 또는 파일 직접 열기에서는 기존 시연 데이터를 유지합니다. */
    }
  }

  function switchCategory(category) {
    state.category = category;
    state.selected = null;
    state.bounds = null;
    state.favoritesOnly = false;
    state.deal = 'all';
    state.room = 'all';
    document.body.classList.toggle('public-category', category === 'public');
    document.querySelectorAll('[data-property-category]').forEach(function (button) {
      const active = button.dataset.propertyCategory === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('locationLabel').textContent = '경기도 전체';
    document.getElementById('listingUnit').textContent = category === 'public' ? '개의 모집공고가 있어요' : '개의 방을 찾았어요';
    document.getElementById('listingNotice').innerHTML = category === 'public'
      ? '<span>LH</span><p><strong>공식 모집공고</strong> 기준이며 신청 전 원문에서 자격과 일정을 확인하세요.</p><a href="https://apply.lh.or.kr/" target="_blank" rel="noopener noreferrer">LH 청약플러스</a>'
      : '<span>✓</span><p><strong>등록 매물</strong>의 출처와 최종 확인일을 꼭 확인하세요.</p><a href="templates/defense/fraud_result.html">안전 확인</a>';
    clearMarkerMap(propertyMarkers);
    clearMarkerMap(aggregateMarkers);
    propertyMarkers.clear();
    aggregateMarkers.clear();
    properties = category === 'public' ? publicProperties : generalProperties;
    detail.classList.remove('open');
    detail.setAttribute('aria-hidden', 'true');
    initialMapFitDone = false;
    render();
    if (category === 'public') loadPublicHousing();
    else fitDisplayedProperties();
  }

  document.querySelectorAll('[data-property-category]').forEach(function (button) {
    button.addEventListener('click', function () { switchCategory(this.dataset.propertyCategory); });
  });

  const openListingRegistration = document.getElementById('openListingRegistration');
  if (openListingRegistration) {
    openListingRegistration.addEventListener('click', function (event) {
      event.preventDefault();
      openSheet(listingRegistrationModal);
    });
  }
  listingRegistrationModal.querySelector('.registration-close').addEventListener('click', function () { closeSheet(listingRegistrationModal); });
  listingRegistrationModal.addEventListener('click', function (event) { if (event.target === listingRegistrationModal) closeSheet(listingRegistrationModal); });
  document.getElementById('listingRegistrationForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!window.ZipaiAuth || !window.ZipaiAuth.getUser()) {
      closeSheet(listingRegistrationModal);
      if (openListingRegistration) openListingRegistration.click();
      return;
    }
    const form = new FormData(this);
    const city = String(form.get('city') || '');
    const center = cityCenters[city];
    if (!center) {
      showToast('경기도 시·군을 선택해 주세요.');
      return;
    }
    const today = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date());
    const registered = {
      id: Date.now(),
      title: String(form.get('title') || '').trim(),
      deal: form.get('deal') === 'jeonse' ? 'jeonse' : 'monthly',
      type: String(form.get('room') || '원룸'),
      deposit: Number(form.get('deposit') || 0),
      monthly: form.get('deal') === 'jeonse' ? 0 : Number(form.get('monthly') || 0),
      maintenance: 0,
      area: Number(form.get('area') || 0),
      floor: String(form.get('floor') || '-'),
      address: '경기도 ' + city + ' ' + String(form.get('neighborhood') || '').trim(),
      walk: '등록자 문의',
      tags: ['직접등록', city, form.get('deal') === 'jeonse' ? '전세' : '월세'],
      options: [],
      parking: false,
      elevator: false,
      pet: false,
      safe: 80,
      photos: 0,
      tone: Date.now() % 5 + 1,
      lat: center[0],
      lng: center[1],
      district: city,
      neighborhood: String(form.get('neighborhood') || city),
      source: '직접 등록 · 검증 전',
      verifiedAt: today,
      contact: String(form.get('contact') || '')
    };
    let serverRegistered;
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registered)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || '매물을 등록하지 못했습니다.');
      serverRegistered = payload.item;
    } catch (error) {
      showToast(error.message);
      return;
    }
    Object.assign(registered, serverRegistered);
    const stored = getRegisteredProperties();
    stored.unshift(registered);
    localStorage.setItem('zipaiGyeonggiProperties', JSON.stringify(stored));
    generalProperties = [registered].concat(generalProperties);
    this.reset();
    closeSheet(listingRegistrationModal);
    switchCategory('general');
    showToast('경기도 일반 매물이 등록됐어요. 운영 전 중개사 검증이 필요합니다.');
  });

  if (window.location.hash === '#saved-homes' && favorites.length && savedHomesButton) {
    state.favoritesOnly = true;
    savedHomesButton.classList.add('active');
    savedHomesButton.setAttribute('aria-pressed', 'true');
  }
  if (window.location.hash === '#register-listing' && window.ZipaiAuth && window.ZipaiAuth.getUser()) openSheet(listingRegistrationModal);
  initMap(); saveFavorites(false); render(); updateFilterBadge(); loadAdminExcelProperties(); loadServerFavorites();
  const linkedPropertyId=Number(new URLSearchParams(window.location.search).get('property'));
  if(linkedPropertyId)setTimeout(function(){openDetail(linkedPropertyId,true);},500);
})();
