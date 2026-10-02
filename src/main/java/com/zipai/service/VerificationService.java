package com.zipai.service;

import com.zipai.domain.*;
import com.zipai.repository.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.HexFormat;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class VerificationService {
 private final VerificationCodeRepository codes; private final UserRepository users;
 private final ObjectProvider<JavaMailSender> mail;private final NaverSensSmsSender sms;
 @Value("${zipai.verification.pepper:change-this-pepper}") String pepper;
 @Value("${zipai.verification.mail-from:no-reply@zipai.local}") String mailFrom;
 public VerificationService(VerificationCodeRepository c,UserRepository u,ObjectProvider<JavaMailSender> m,NaverSensSmsSender sms){codes=c;users=u;mail=m;this.sms=sms;}

 @Transactional
 public String send(String purpose,String channel,String destination,User user){
  validate(purpose,channel,destination);String normalized=normalize(channel,destination);if(channel.equals("sms")){LocalDateTime now=LocalDateTime.now();if(codes.countByChannelAndDestinationAndCreatedAtAfter("sms",normalized,now.minusMinutes(1))>0)throw new ResponseStatusException(TOO_MANY_REQUESTS,"인증번호는 1분 후 다시 요청해 주세요.");if(codes.countByChannelAndDestinationAndCreatedAtAfter("sms",normalized,now.toLocalDate().atStartOfDay())>=5||codes.countByChannelAndCreatedAtAfter("sms",now.toLocalDate().atStartOfDay())>=100)throw new ResponseStatusException(TOO_MANY_REQUESTS,"오늘 문자 발송 한도를 초과했습니다.");}String code=String.format("%06d",SecureRandomHolder.INSTANCE.nextInt(1_000_000));
  VerificationCode v=new VerificationCode();v.purpose=purpose;v.channel=channel;v.destination=normalize(channel,destination);v.codeHash=hash(code);v.user=user;v.expiresAt=LocalDateTime.now().plusMinutes(5);codes.save(v);
  if(channel.equals("email")){JavaMailSender sender=mail.getIfAvailable();if(sender==null)throw new ResponseStatusException(SERVICE_UNAVAILABLE,"SMTP 설정이 필요합니다.");SimpleMailMessage msg=new SimpleMailMessage();msg.setFrom(mailFrom);msg.setTo(v.destination);msg.setSubject("[ZipAI] 인증번호");msg.setText("인증번호: "+code+" (5분간 유효)");sender.send(msg);}
  else sms.send(v.destination,"[ZipAI] 인증번호는 "+code+"입니다. 5분 내 입력해 주세요.");
  return code;
 }
 @Transactional(noRollbackFor = ResponseStatusException.class)
 public void verify(String purpose,String channel,String destination,String code){String normalized=normalize(channel,destination);VerificationCode v=codes.findFirstByPurposeAndChannelAndDestinationOrderByIdDesc(purpose,channel,normalized).orElseThrow(()->new ResponseStatusException(BAD_REQUEST,"인증 요청을 찾을 수 없습니다."));
  if(v.verifiedAt!=null||v.expiresAt.isBefore(LocalDateTime.now())||v.attempts>=5)throw new ResponseStatusException(BAD_REQUEST,"인증번호가 만료되었거나 사용할 수 없습니다.");v.attempts++;if(!MessageDigest.isEqual(hash(code).getBytes(StandardCharsets.UTF_8),v.codeHash.getBytes(StandardCharsets.UTF_8)))throw new ResponseStatusException(BAD_REQUEST,"인증번호가 올바르지 않습니다.");v.verifiedAt=LocalDateTime.now();if(v.user!=null){if(channel.equals("email")&&v.destination.equalsIgnoreCase(v.user.email))v.user.emailVerifiedAt=v.verifiedAt;else if(channel.equals("sms")&&v.destination.equals(v.user.phone))v.user.phoneVerifiedAt=v.verifiedAt;users.save(v.user);}}
 @Transactional public boolean consumeVerified(String purpose,String channel,String destination){VerificationCode v=codes.findFirstByPurposeAndChannelAndDestinationOrderByIdDesc(purpose,channel,normalize(channel,destination)).orElse(null);if(v==null||v.verifiedAt==null||v.consumedAt!=null||v.verifiedAt.isBefore(LocalDateTime.now().minusMinutes(15)))return false;v.consumedAt=LocalDateTime.now();codes.save(v);return true;}
 private void validate(String p,String c,String d){if(!java.util.Set.of("identity","password_reset").contains(p)||!java.util.Set.of("email","sms").contains(c))throw new ResponseStatusException(BAD_REQUEST,"인증 목적 또는 채널이 올바르지 않습니다.");String n=normalize(c,d);if(c.equals("email")&&!n.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")||c.equals("sms")&&!n.matches("^01[016789]\\d{7,8}$"))throw new ResponseStatusException(BAD_REQUEST,"인증 대상을 확인해 주세요.");}
 private String normalize(String c,String d){return c.equals("email")?d.trim().toLowerCase():d.replaceAll("[^0-9]","");}
 private String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((value+pepper).getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
 private static final class SecureRandomHolder{static final SecureRandom INSTANCE=new SecureRandom();}
}
