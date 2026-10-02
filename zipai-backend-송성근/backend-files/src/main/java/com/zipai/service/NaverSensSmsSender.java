package com.zipai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class NaverSensSmsSender {
 private final RestClient http=RestClient.create();private final ObjectMapper json;
 @Value("${zipai.sms.provider:disabled}")String provider;
 @Value("${zipai.sms.naver.access-key:}")String accessKey;
 @Value("${zipai.sms.naver.secret-key:}")String secretKey;
 @Value("${zipai.sms.naver.service-id:}")String serviceId;
 @Value("${zipai.sms.naver.from:}")String from;
 public NaverSensSmsSender(ObjectMapper json){this.json=json;}
 public void send(String to,String content){
  if(provider.equals("console"))return;
  if(!provider.equals("naver-sens"))throw new ResponseStatusException(SERVICE_UNAVAILABLE,"SMS 발송 기능이 아직 활성화되지 않았습니다.");
  if(List.of(accessKey,secretKey,serviceId,from).stream().anyMatch(String::isBlank))throw new ResponseStatusException(SERVICE_UNAVAILABLE,"네이버 SENS 환경설정이 필요합니다.");
  String uri="/sms/v2/services/"+serviceId+"/messages",timestamp=String.valueOf(Instant.now().toEpochMilli());
  try{String signature=signature("POST",uri,timestamp);Map<String,Object>body=Map.of("type","SMS","contentType","COMM","countryCode","82","from",digits(from),"content",content,"messages",List.of(Map.of("to",digits(to))));
   http.post().uri("https://sens.apigw.ntruss.com"+uri).contentType(MediaType.APPLICATION_JSON).header("x-ncp-apigw-timestamp",timestamp).header("x-ncp-iam-access-key",accessKey).header("x-ncp-apigw-signature-v2",signature).body(json.writeValueAsString(body)).retrieve().toBodilessEntity();
  }catch(ResponseStatusException e){throw e;}catch(Exception e){throw new ResponseStatusException(BAD_GATEWAY,"문자 발송 요청에 실패했습니다.");}
 }
 private String signature(String method,String uri,String timestamp)throws Exception{String message=method+" "+uri+"\n"+timestamp+"\n"+accessKey;Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));return Base64.getEncoder().encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));}
 private static String digits(String value){return value.replaceAll("[^0-9]","");}
}
