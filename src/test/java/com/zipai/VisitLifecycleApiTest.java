package com.zipai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class VisitLifecycleApiTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @Test
    void memberAndAdminFollowProtectedVisitLifecycle() throws Exception {
        String suffix=String.valueOf(System.nanoTime());
        MockHttpSession member=signup("visit_member_"+suffix,"visit_"+suffix+"@example.com");
        Long memberId=jdbc.queryForObject("SELECT id FROM users WHERE username=?",Long.class,"visit_member_"+suffix);
        jdbc.update("INSERT INTO favorites(user_id,property_id,created_at) VALUES(?,?,CURRENT_TIMESTAMP)",memberId,101L);
        String adminName="visit_admin_"+suffix;
        signup(adminName,"admin_"+suffix+"@example.com");
        jdbc.update("UPDATE users SET role='admin' WHERE username=?",adminName);
        MockHttpSession adminSession=login(adminName,"password123!");
        String date=LocalDate.now().plusDays(5).toString();
        String created=mvc.perform(post("/api/visits").session(member).contentType(MediaType.APPLICATION_JSON)
            .content("{\"roomId\":\"101\",\"title\":\"테스트 매물\",\"date\":\""+date+"\",\"time\":\"10:00\",\"phone\":\"010-1234-5678\",\"question\":\"채광 확인\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.item.status").value("pending")).andReturn().getResponse().getContentAsString();
        long id=new com.fasterxml.jackson.databind.ObjectMapper().readTree(created).path("item").path("id").asLong();

        mvc.perform(get("/api/admin/visits").session(member)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/visits").session(adminSession)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].phone").value("010****5678"));
        mvc.perform(get("/api/admin/visits/"+id).session(adminSession)).andExpect(status().isOk()).andExpect(jsonPath("$.item.phone").value("01012345678"));
        mvc.perform(patch("/api/visits/"+id+"/reschedule").session(member).contentType(MediaType.APPLICATION_JSON)
            .content("{\"date\":\""+LocalDate.now().plusDays(6)+"\",\"time\":\"11:00\",\"reason\":\"개인 일정 변경\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.item.status").value("reschedule_requested"));
        mvc.perform(patch("/api/visits/"+id+"/approve").session(adminSession).contentType(MediaType.APPLICATION_JSON).content("{\"userMessage\":\"신분증을 준비해 주세요.\",\"adminNote\":\"담당자 확인 완료\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.item.status").value("approved"));
        mvc.perform(patch("/api/visits/"+id+"/complete").session(adminSession).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.item.status").value("completed"));
        mvc.perform(patch("/api/visits/"+id+"/cancel").session(member).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"뒤늦은 취소\"}"))
            .andExpect(status().isConflict());
    }

    private MockHttpSession signup(String username,String email)throws Exception{return (MockHttpSession)mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content("{\"userId\":\""+username+"\",\"email\":\""+email+"\",\"phone\":\"01012345678\",\"password\":\"password123!\"}" )).andExpect(status().isCreated()).andReturn().getRequest().getSession();}
    private MockHttpSession login(String username,String password)throws Exception{return (MockHttpSession)mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"userId\":\""+username+"\",\"password\":\""+password+"\"}" )).andExpect(status().isOk()).andReturn().getRequest().getSession();}
}
