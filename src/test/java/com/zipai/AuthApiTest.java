package com.zipai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;

@SpringBootTest
@AutoConfigureMockMvc
class AuthApiTest {
    @Autowired MockMvc mvc;

    @Test
    void signupCreatesAuthenticatedSession() throws Exception {
        String body = """
            {"userId":"test_member","email":"test@example.com","phone":"01012345678","password":"password123!"}
            """;
        var result = mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.user.id").value("test_member"))
            .andReturn();

        mvc.perform(get("/api/auth/me").session((MockHttpSession) result.getRequest().getSession()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authenticated").value(true));
    }
}
