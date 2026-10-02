package com.zipai.web;
import com.zipai.service.*;import jakarta.servlet.http.*;import java.util.*;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/account") public class AccountController{private final AuthService auth;public AccountController(AuthService a){auth=a;}
 @PatchMapping("/profile")Map<String,Object> profile(@RequestBody Map<String,Object>b,HttpSession s){return Map.of("user",auth.publicUser(auth.updateProfile(b,s)));}
 @PatchMapping("/password")Map<String,Object> password(@RequestBody Map<String,Object>b,HttpSession s){auth.changePassword(b,s);return Map.of("success",true);}
 @DeleteMapping Map<String,Object> withdraw(@RequestBody Map<String,Object>b,HttpSession s){auth.withdraw(b,s);return Map.of("success",true);}}
