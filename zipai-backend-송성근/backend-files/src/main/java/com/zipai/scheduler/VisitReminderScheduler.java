package com.zipai.scheduler;

import com.zipai.domain.VisitRequest;
import com.zipai.repository.VisitRepository;
import com.zipai.service.NotificationService;
import java.time.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class VisitReminderScheduler {
    private final VisitRepository visits;
    private final NotificationService notices;
    public VisitReminderScheduler(VisitRepository visits,NotificationService notices){this.visits=visits;this.notices=notices;}

    @Scheduled(cron="0 */15 * * * *",zone="Asia/Seoul")
    @Transactional
    public void sendReminders(){
        LocalDateTime now=LocalDateTime.now();
        for(VisitRequest visit:visits.findByStatusAndVisitDateBetween("approved",now.toLocalDate(),now.plusDays(2).toLocalDate())){
            LocalDateTime slot=LocalDateTime.of(visit.visitDate,visit.visitTime);
            Duration remaining=Duration.between(now,slot);
            if(remaining.toHours()<=24&&remaining.toMinutes()>60&&visit.dayReminderSentAt==null){
                notices.create(visit.requester,"visit_reminder","내일 방문 예약 안내",visit.roomTitle+" · "+visit.visitDate+" "+visit.visitTime,"visit",visit.id);
                visit.dayReminderSentAt=now;
            }
            if(remaining.toMinutes()<=60&&remaining.toMinutes()>0&&visit.hourReminderSentAt==null){
                notices.create(visit.requester,"visit_reminder","방문 1시간 전 안내",visit.roomTitle+" · "+visit.visitTime+" 방문 예정입니다.","visit",visit.id);
                visit.hourReminderSentAt=now;
            }
        }
    }
}
