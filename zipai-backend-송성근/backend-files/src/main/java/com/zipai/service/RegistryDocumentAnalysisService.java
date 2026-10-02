package com.zipai.service;

import java.io.IOException;
import java.util.*;
import java.util.regex.*;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import com.zipai.integration.ocr.RegistryOcrClient;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class RegistryDocumentAnalysisService {
 private final RegistryOcrClient ocr;
 public RegistryDocumentAnalysisService(RegistryOcrClient ocr){this.ocr=ocr;}
 private static final long MAX_BYTES=10L*1024*1024;
 private static final List<Rule> RULES=List.of(
  new Rule("신탁","danger","신탁 관련 기록","신탁 등기가 발견되었습니다. 계약 권한과 수탁자 동의를 반드시 확인하세요."),
  new Rule("압류","danger","압류 기록","압류 관련 기록이 발견되었습니다. 현재 유효 여부를 원문에서 확인하세요."),
  new Rule("가압류","danger","가압류 기록","가압류 관련 기록이 발견되었습니다. 현재 유효 여부를 원문에서 확인하세요."),
  new Rule("가처분","danger","가처분 기록","가처분 관련 기록이 발견되었습니다. 처분 제한 내용을 확인하세요."),
  new Rule("강제경매","danger","경매 기록","강제경매 관련 기록이 발견되었습니다."),
  new Rule("임의경매","danger","경매 기록","임의경매 관련 기록이 발견되었습니다."),
  new Rule("근저당권","caution","근저당권 기록","근저당권 기록이 발견되었습니다. 채권최고액과 말소 여부를 대조하세요."),
  new Rule("전세권","caution","전세권 기록","기존 전세권 기록이 발견되었습니다. 순위와 말소 여부를 확인하세요."),
  new Rule("임차권등기","danger","임차권등기 기록","임차권등기 관련 기록이 발견되었습니다. 보증금 반환 분쟁 가능성을 확인하세요.")
 );

 public Map<String,Object> analyze(String filename,String contentType,byte[] bytes){
  if(bytes.length==0||bytes.length>MAX_BYTES)throw new ResponseStatusException(BAD_REQUEST,"PDF 파일은 10MB 이하로 업로드해 주세요.");
  if(!"application/pdf".equalsIgnoreCase(contentType)&&!String.valueOf(filename).toLowerCase().endsWith(".pdf"))throw new ResponseStatusException(UNSUPPORTED_MEDIA_TYPE,"PDF 파일만 분석할 수 있습니다.");
  if(bytes.length<5||bytes[0]!='%'||bytes[1]!='P'||bytes[2]!='D'||bytes[3]!='F'||bytes[4]!='-')throw new ResponseStatusException(UNSUPPORTED_MEDIA_TYPE,"올바른 PDF 파일이 아닙니다.");
  try(PDDocument document=Loader.loadPDF(bytes)){
   if(document.isEncrypted())throw new ResponseStatusException(BAD_REQUEST,"암호화된 PDF는 분석할 수 없습니다. 암호를 해제한 사본을 사용해 주세요.");
   PDFTextStripper stripper=new PDFTextStripper();List<String>pages=new ArrayList<>();int chars=0;
   for(int page=1;page<=document.getNumberOfPages();page++){stripper.setStartPage(page);stripper.setEndPage(page);String text=stripper.getText(document).replace('\u0000',' ').trim();pages.add(text);chars+=text.replaceAll("\\s","").length();}
   String extractionMode="pdf-text";
   if(chars<30){if(!ocr.enabled())throw new ResponseStatusException(UNPROCESSABLE_ENTITY,"문자 레이어가 없는 스캔 PDF입니다. OCR 공급자 연결 후 분석할 수 있습니다.");pages=ocr.extractPages(document);chars=pages.stream().mapToInt(text->text.replaceAll("\\s","").length()).sum();extractionMode="clova-ocr";if(chars<30)throw new ResponseStatusException(UNPROCESSABLE_ENTITY,"OCR에서 분석할 문자를 충분히 찾지 못했습니다.");}
   List<Map<String,Object>>findings=findings(pages);String all=String.join("\n",pages);String issued=findFirst(all,"(?:발급|열람)[일시자: ]{0,5}(20\\d{2})[.년/-]\\s*(\\d{1,2})[.월/-]\\s*(\\d{1,2})");
   String section=all.contains("을 구")||all.contains("을구")?"갑구·을구 텍스트 확인":"문서 텍스트 확인";
   Map<String,Object>result=new LinkedHashMap<>();result.put("fileName",safeName(filename));result.put("pageCount",document.getNumberOfPages());result.put("issuedDateText",issued);result.put("extractionMode",extractionMode);result.put("documentScope",section);result.put("findings",findings);result.put("findingCount",findings.size());Long debt=seniorDebtManwon(all);if(debt!=null)result.put("suggestedSeniorDebtManwon",debt);result.put("limitations",limitations());result.put("disclaimer","이 분석은 업로드된 문서의 문자만 확인한 참고자료이며 최신 권리관계나 법적 안전성을 보장하지 않습니다.");return result;
  }catch(ResponseStatusException e){throw e;}catch(IOException e){throw new ResponseStatusException(BAD_REQUEST,"PDF를 읽을 수 없습니다.");}
 }
 private List<Map<String,Object>>findings(List<String>pages){List<Map<String,Object>>result=new ArrayList<>();Set<String>seen=new HashSet<>();for(int i=0;i<pages.size();i++){String page=pages.get(i);for(Rule rule:RULES){if(page.contains(rule.keyword)&&seen.add(rule.keyword)){Map<String,Object>item=new LinkedHashMap<>();item.put("keyword",rule.keyword);item.put("level",rule.level);item.put("title",rule.title);item.put("message",rule.message);item.put("page",i+1);item.put("evidence",context(page,rule.keyword));result.add(item);}}}return result;}
 private String context(String text,String keyword){String one=text.replaceAll("\\s+"," ");int at=one.indexOf(keyword),start=Math.max(0,at-35),end=Math.min(one.length(),at+keyword.length()+55);return one.substring(start,end);}
 private String findFirst(String text,String regex){Matcher m=Pattern.compile(regex).matcher(text);return m.find()?m.group().replaceAll("\\s+"," "):"문서에서 발급일을 자동 확인하지 못했습니다.";}
 private String safeName(String name){String value=String.valueOf(name).replace('\\','/');value=value.substring(value.lastIndexOf('/')+1);return value.length()>120?value.substring(value.length()-120):value;}
 private Long seniorDebtManwon(String text){Matcher m=Pattern.compile("채권최고액[^0-9]{0,20}([0-9,]{4,})\\s*원").matcher(text.replaceAll("\\s+"," "));long max=0;while(m.find())try{max=Math.max(max,Long.parseLong(m.group(1).replace(",","")));}catch(NumberFormatException ignored){}return max>0?Math.max(1,max/10000):null;}
 private List<String>limitations(){return List.of("PDF 발급 이후 발생한 권리변동은 확인할 수 없습니다.","문서 진위와 현재 공식 등기 상태를 확정할 수 없습니다.","말소선·표 구조·복잡한 권리관계를 잘못 해석할 수 있습니다.","세금 체납·숨겨진 채무·계약 상대방의 권한을 완전히 확인할 수 없습니다.","변호사·법무사·공인중개사의 법률 판단을 대신하지 않습니다.");}
 private record Rule(String keyword,String level,String title,String message){}
}
