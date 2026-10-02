package com.zipai.integration.ocr;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.*;
import java.time.Instant;
import java.util.*;
import javax.imageio.ImageIO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ClovaRegistryOcrClient implements RegistryOcrClient {
    private final RestClient http = RestClient.create();
    @Value("${zipai.ocr.clova.invoke-url:}") String invokeUrl;
    @Value("${zipai.ocr.clova.secret:}") String secret;

    public boolean enabled(){return !invokeUrl.isBlank()&&!secret.isBlank();}

    public List<String> extractPages(PDDocument document) throws IOException {
        if(!enabled()) return List.of();
        if(document.getNumberOfPages()>20) throw new IOException("OCR는 최대 20페이지까지 지원합니다.");
        PDFRenderer renderer=new PDFRenderer(document);List<String> pages=new ArrayList<>();
        for(int i=0;i<document.getNumberOfPages();i++){
            ByteArrayOutputStream output=new ByteArrayOutputStream();ImageIO.write(renderer.renderImageWithDPI(i,150),"png",output);
            Map<String,Object> request=Map.of("version","V2","requestId",UUID.randomUUID().toString(),"timestamp",Instant.now().toEpochMilli(),"images",List.of(Map.of("format","png","name","registry-page-"+(i+1),"data",Base64.getEncoder().encodeToString(output.toByteArray()))));
            JsonNode response=http.post().uri(invokeUrl).header("X-OCR-SECRET",secret).contentType(MediaType.APPLICATION_JSON).body(request).retrieve().body(JsonNode.class);
            StringBuilder text=new StringBuilder();if(response!=null)response.path("images").path(0).path("fields").forEach(field->text.append(field.path("inferText").asText()).append(' '));pages.add(text.toString().trim());
        }
        return pages;
    }
}
