package com.zipai.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zipai.domain.*;
import com.zipai.repository.*;
import com.zipai.service.*;
import jakarta.servlet.http.HttpSession;
import java.time.*;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api")
public class VisitController {
    private static final List<String> ACTIVE = List.of("pending", "reschedule_requested", "approved");
    private final VisitRepository visits;
    private final RoomOfferRepository offers;
    private final AuthService auth;
    private final NotificationService notices;
    private final ObjectMapper json;
    private final AdminAuditService audit;
    private final JdbcTemplate jdbc;

    public VisitController(VisitRepository visits, RoomOfferRepository offers, AuthService auth,
                           NotificationService notices, ObjectMapper json, AdminAuditService audit,JdbcTemplate jdbc) {
        this.visits=visits; this.offers=offers; this.auth=auth; this.notices=notices; this.json=json; this.audit=audit;this.jdbc=jdbc;
    }

    @GetMapping("/admin/visits")
    Map<String,Object> adminVisits(@RequestParam(defaultValue="") String status,
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, HttpSession s) {
        auth.admin(s);
        Pageable pageable=PageRequest.of(Math.max(0,page),Math.min(100,Math.max(1,size)),Sort.by(Sort.Direction.DESC,"id"));
        Page<VisitRequest> result=status.isBlank()?visits.findAll(pageable):visits.findByStatus(status,pageable);
        return Map.of("items",result.getContent().stream().map(v->view(v,false,true)).toList(),"page",result.getNumber(),
            "size",result.getSize(),"totalItems",result.getTotalElements(),"totalPages",result.getTotalPages());
    }

    @GetMapping("/admin/visits/{id}")
    Map<String,Object> adminVisit(@PathVariable Long id, HttpSession s) {
        User admin=auth.admin(s);
        VisitRequest visit=required(id);
        audit.record(admin,"VISIT_CONTACT_VIEW","visit",id,"예약 상세 연락처 조회");
        return Map.of("item",view(visit,true,true));
    }

    @GetMapping("/visits")
    Map<String,Object> memberVisits(HttpSession s) {
        User user=auth.required(s);
        return Map.of("items",visits.findByRequesterIdOrderByIdDesc(user.id).stream().map(v->view(v,true,false)).toList());
    }

    @GetMapping("/visits/{id}")
    Map<String,Object> memberVisit(@PathVariable Long id,HttpSession s) {
        User user=auth.required(s); VisitRequest visit=requiredOwned(id,user.id);
        return Map.of("item",view(visit,true,false));
    }

    @PostMapping("/visits") @ResponseStatus(HttpStatus.CREATED)
    Map<String,Object> create(@RequestBody Map<String,Object> p,HttpSession s) {
        User user=auth.required(s);
        VisitRequest visit=new VisitRequest(); visit.requester=user; visit.roomId=text(p,"roomId"); visit.roomTitle=text(p,"title");
        try { visit.visitDate=LocalDate.parse(text(p,"date")); visit.visitTime=LocalTime.parse(text(p,"time")); }
        catch(Exception e){ throw new ResponseStatusException(BAD_REQUEST,"방문 날짜와 시간을 확인해 주세요."); }
        visit.phone=text(p,"phone").replaceAll("[^0-9]",""); visit.question=text(p,"question");
        validate(visit,user.id,null);
        visits.save(visit);
        return Map.of("item",view(visit,true,false));
    }

    @PatchMapping("/visits/{id}/cancel") @Transactional
    Map<String,Object> cancel(@PathVariable Long id,@RequestBody Map<String,Object> body,HttpSession s) {
        User user=auth.required(s); VisitRequest visit=requiredOwned(id,user.id);
        if(!ACTIVE.contains(visit.status)) throw new ResponseStatusException(CONFLICT,"현재 상태에서는 예약을 취소할 수 없습니다.");
        String reason=limited(body,"reason",500); if(reason.length()<2) throw new ResponseStatusException(BAD_REQUEST,"취소 사유를 2자 이상 입력해 주세요.");
        visit.status="cancelled_by_user"; visit.decisionReason=reason; visit.decidedAt=LocalDateTime.now(); visit.decidedBy=null;
        return Map.of("item",view(visits.save(visit),true,false));
    }

    @PatchMapping("/visits/{id}/reschedule") @Transactional
    Map<String,Object> reschedule(@PathVariable Long id,@RequestBody Map<String,Object> body,HttpSession s) {
        User user=auth.required(s); VisitRequest visit=requiredOwned(id,user.id);
        if(!ACTIVE.contains(visit.status)) throw new ResponseStatusException(CONFLICT,"현재 상태에서는 일정을 변경할 수 없습니다.");
        try { visit.visitDate=LocalDate.parse(text(body,"date")); visit.visitTime=LocalTime.parse(text(body,"time")); }
        catch(Exception e){ throw new ResponseStatusException(BAD_REQUEST,"변경할 날짜와 시간을 확인해 주세요."); }
        visit.decisionReason=limited(body,"reason",500); visit.status="reschedule_requested"; visit.decidedAt=null; visit.decidedBy=null;
        visit.dayReminderSentAt=null; visit.hourReminderSentAt=null; validate(visit,user.id,id);
        return Map.of("item",view(visits.save(visit),true,false));
    }

    @PatchMapping("/visits/{id}/{action}") @Transactional
    Map<String,Object> decide(@PathVariable Long id,@PathVariable String action,@RequestBody(required=false) Map<String,Object> body,HttpSession s) {
        User admin=auth.admin(s); VisitRequest visit=required(id); Map<String,Object> input=body==null?Map.of():body;
        String next=switch(action){case "approve"->"approved";case "reject"->"rejected";case "complete"->"completed";case "no-show"->"no_show";case "cancel"->"cancelled_by_admin";default->throw new ResponseStatusException(METHOD_NOT_ALLOWED);};
        boolean awaiting=Set.of("pending","reschedule_requested").contains(visit.status);
        boolean confirmed="approved".equals(visit.status);
        if((Set.of("approve","reject").contains(action)&&!awaiting)||(Set.of("complete","no-show","cancel").contains(action)&&!confirmed))
            throw new ResponseStatusException(CONFLICT,"현재 예약 상태에서 수행할 수 없는 처리입니다.");
        String reason=limited(input,"reason",500), note=limited(input,"adminNote",1000), userMessage=limited(input,"userMessage",1000);
        if(Set.of("reject","cancel").contains(action)&&reason.length()<2) throw new ResponseStatusException(BAD_REQUEST,"처리 사유를 2자 이상 입력해 주세요.");
        visit.status=next; visit.decisionReason=reason; visit.adminNote=note; visit.userMessage=userMessage; visit.decidedBy=admin; visit.decidedAt=LocalDateTime.now();
        if(Set.of("completed","no_show").contains(next)) visit.completedAt=LocalDateTime.now();
        try { visits.saveAndFlush(visit); } catch(DataIntegrityViolationException e) { throw new ResponseStatusException(CONFLICT,"같은 매물의 해당 시간에 이미 확정된 예약이 있습니다."); }
        notices.create(visit.requester,"visit_result","방문 예약 상태 변경",visit.roomTitle+" 예약이 "+statusLabel(next)+" 상태로 변경되었습니다.","visit",visit.id);
        audit.record(admin,"VISIT_STATUS","visit",visit.id,next+(reason.isBlank()?"":" · "+reason));
        return Map.of("item",view(visit,true,true));
    }

    @GetMapping("/room-offers") Map<String,Object> offers(HttpSession s){User u=auth.required(s);return Map.of("items",offers.findByOwnerIdOrderByIdDesc(u.id).stream().map(this::offer).toList());}
    @PostMapping("/room-offers") @ResponseStatus(HttpStatus.CREATED)
    Map<String,Object> offer(@RequestBody Map<String,Object> p,HttpSession s)throws Exception{User u=auth.required(s);if(text(p,"title").isBlank()||text(p,"moveIn").isBlank())throw new ResponseStatusException(BAD_REQUEST,"방 제목과 입주 가능일을 확인해 주세요.");RoomOffer r=new RoomOffer();r.owner=u;r.payloadJson=json.writeValueAsString(p);offers.save(r);return Map.of("item",offer(r));}

    private void validate(VisitRequest visit,Long userId,Long ignoredId){
        if(visit.roomId.isBlank()||visit.roomTitle.isBlank())throw new ResponseStatusException(BAD_REQUEST,"선택한 매물 정보를 확인해 주세요.");
        try{Long propertyId=Long.valueOf(visit.roomId);Integer favorite=jdbc.queryForObject("SELECT COUNT(*) FROM favorites WHERE user_id=? AND property_id=?",Integer.class,userId,propertyId);if(favorite==null||favorite==0)throw new ResponseStatusException(BAD_REQUEST,"찜 목록에 있는 매물만 방문 신청할 수 있습니다.");}catch(NumberFormatException e){throw new ResponseStatusException(BAD_REQUEST,"선택한 매물 번호를 확인해 주세요.");}
        if(visit.phone.length()<10||visit.phone.length()>11)throw new ResponseStatusException(BAD_REQUEST,"연락처를 확인해 주세요.");
        if(visit.question.length()>1000)throw new ResponseStatusException(BAD_REQUEST,"문의사항은 1000자 이하로 입력해 주세요.");
        LocalDateTime slot=LocalDateTime.of(visit.visitDate,visit.visitTime);
        if(slot.isBefore(LocalDateTime.now().plusHours(2)))throw new ResponseStatusException(BAD_REQUEST,"방문은 현재 시각보다 2시간 이후로 신청해 주세요.");
        if(slot.isAfter(LocalDateTime.now().plusDays(90)))throw new ResponseStatusException(BAD_REQUEST,"방문은 90일 이내 일정으로 신청해 주세요.");
        if(visit.visitTime.getMinute()!=0||visit.visitTime.getHour()<9||visit.visitTime.getHour()>20)throw new ResponseStatusException(BAD_REQUEST,"방문 시간은 09시부터 20시까지 정각으로 선택해 주세요.");
        boolean duplicate=ignoredId==null
            ?visits.existsByRequesterIdAndRoomIdAndVisitDateAndVisitTimeAndStatusIn(userId,visit.roomId,visit.visitDate,visit.visitTime,ACTIVE)
            :visits.existsByRequesterIdAndRoomIdAndVisitDateAndVisitTimeAndStatusInAndIdNot(userId,visit.roomId,visit.visitDate,visit.visitTime,ACTIVE,ignoredId);
        if(duplicate)throw new ResponseStatusException(CONFLICT,"같은 매물과 시간에 이미 신청한 예약이 있습니다.");
    }
    private VisitRequest required(Long id){return visits.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"방문 요청을 찾을 수 없습니다."));}
    private VisitRequest requiredOwned(Long id,Long userId){return visits.findByIdAndRequesterId(id,userId).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"방문 요청을 찾을 수 없습니다."));}
    private Map<String,Object> view(VisitRequest v,boolean fullPhone,boolean adminView){Map<String,Object> m=new LinkedHashMap<>();m.put("id",v.id);m.put("roomId",v.roomId);m.put("title",v.roomTitle);m.put("date",v.visitDate);m.put("time",v.visitTime);m.put("phone",fullPhone?v.phone:mask(v.phone));m.put("question",v.question);m.put("status",v.status);m.put("decisionReason",v.decisionReason);m.put("userMessage",v.userMessage);if(adminView)m.put("adminNote",v.adminNote);m.put("decidedAt",v.decidedAt);m.put("completedAt",v.completedAt);m.put("createdAt",v.createdAt);return m;}
    private Map<String,Object> offer(RoomOffer r){
        try {
            Object payload=json.readValue(r.payloadJson,Object.class);
            // 초기 로컬 데모 버전은 JSON 객체를 문자열로 한 번 더 인코딩해 저장했다.
            // 기존 신청 내역을 삭제하지 않고 현재 형식과 함께 읽을 수 있게 한다.
            if(payload instanceof String encoded) payload=json.readValue(encoded,Object.class);
            if(!(payload instanceof Map<?,?> values)) throw new IllegalArgumentException("room offer payload must be an object");
            Map<String,Object> m=new LinkedHashMap<>();
            values.forEach((key,value)->m.put(String.valueOf(key),value));
            m.put("id",r.id);m.put("status",r.status);return m;
        } catch(Exception e) { throw new IllegalStateException(e); }
    }
    private static String statusLabel(String s){return Map.of("approved","승인","rejected","거절","completed","방문 완료","no_show","노쇼","cancelled_by_admin","관리자 취소").getOrDefault(s,s);}
    private static String mask(String p){if(p==null||p.length()<7)return "***";return p.substring(0,3)+"****"+p.substring(p.length()-4);}
    private static String limited(Map<String,Object> p,String k,int max){String value=text(p,k);if(value.length()>max)throw new ResponseStatusException(BAD_REQUEST,k+" 입력 길이를 확인해 주세요.");return value;}
    private static String text(Map<String,Object> p,String k){return String.valueOf(p.getOrDefault(k,"")).trim();}
}
