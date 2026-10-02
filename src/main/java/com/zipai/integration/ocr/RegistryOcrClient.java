package com.zipai.integration.ocr;

import org.apache.pdfbox.pdmodel.PDDocument;
import java.io.IOException;
import java.util.List;

public interface RegistryOcrClient {
    boolean enabled();
    List<String> extractPages(PDDocument document) throws IOException;
}
