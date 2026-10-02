package com.zipai.web;

import com.zipai.service.SocialLoginService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/oauth")
public class SocialLoginController {
    private final SocialLoginService social;
    public SocialLoginController(SocialLoginService social){this.social=social;}

    @GetMapping("/providers")
    Map<String,Object> providers(){return Map.of("providers",social.availability());}

    @GetMapping("/{provider}/start")
    void start(@PathVariable String provider,HttpSession session,HttpServletResponse response)throws IOException {
        response.sendRedirect(social.authorizationUrl(provider,session));
    }

    @GetMapping("/{provider}/callback")
    void callback(@PathVariable String provider,@RequestParam(required=false)String code,@RequestParam(required=false)String state,
                  @RequestParam(required=false)String error,HttpSession session,HttpServletResponse response)throws IOException {
        if(error!=null){response.sendRedirect(loginError("소셜 로그인이 취소되었습니다."));return;}
        try{social.callback(provider,code,state,session);response.sendRedirect("/index.html?socialLogin="+provider);}
        catch(Exception e){response.sendRedirect(loginError("소셜 로그인에 실패했습니다. 다시 시도해 주세요."));}
    }
    private static String loginError(String message){return "/templates/member/login.html?oauthError="+URLEncoder.encode(message,StandardCharsets.UTF_8);}
}
