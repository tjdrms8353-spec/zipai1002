package com.zipai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class DefenseReportApiTest {
    @Autowired MockMvc mvc;

    @Test void reportIsOwnedAndCanBeShared() throws Exception {
        String suffix=String.valueOf(System.nanoTime());
        String signup="{\"userId\":\"u"+suffix.substring(Math.max(0,suffix.length()-8))+"\",\"email\":\""+suffix+"@example.com\",\"phone\":\"01087654321\",\"password\":\"Password1!\"}";
        var auth=mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signup)).andExpect(status().isCreated()).andReturn();
        MockHttpSession session=(MockHttpSession)auth.getRequest().getSession();
        var created=mvc.perform(post("/api/defense/reports").session(session).contentType(MediaType.APPLICATION_JSON).content("{\"reportType\":\"registry\",\"title\":\"테스트 진단\",\"snapshot\":{\"findingCount\":1}}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.report.title").value("테스트 진단")).andReturn();
        String response=created.getResponse().getContentAsString();String id=response.replaceAll(".*\\\"id\\\":(\\d+).*","$1");
        mvc.perform(get("/api/defense/reports").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(post("/api/defense/reports/"+id+"/share").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.shareToken").isNotEmpty());
    }
}
