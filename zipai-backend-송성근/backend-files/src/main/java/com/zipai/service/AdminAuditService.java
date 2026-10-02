package com.zipai.service;
import com.zipai.domain.*;import com.zipai.repository.*;import org.springframework.stereotype.Service;
@Service public class AdminAuditService{private final AdminAuditLogRepository logs;public AdminAuditService(AdminAuditLogRepository l){logs=l;}public void record(User admin,String action,String type,Object id,String detail){AdminAuditLog l=new AdminAuditLog();l.admin=admin;l.action=action;l.targetType=type;l.targetId=String.valueOf(id);l.detail=detail==null?"":detail;logs.save(l);}}
