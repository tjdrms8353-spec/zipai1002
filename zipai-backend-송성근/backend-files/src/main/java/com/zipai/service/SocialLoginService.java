package com.zipai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zipai.domain.OAuthIdentity;
import com.zipai.domain.User;
import com.zipai.repository.OAuthIdentityRepository;
import com.zipai.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SocialLoginService {
    private static final String STATE = "ZIPAI_OAUTH_STATE";
    private static final String PROVIDER = "ZIPAI_OAUTH_PROVIDER";
    private final OAuthIdentityRepository identities;
    private final UserRepository users;
    private final PasswordService passwords;
    private final AuthService auth;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();

    @Value("${zipai.oauth.public-base-url:http://127.0.0.1:4173}") String publicBaseUrl;
    @Value("${zipai.oauth.kakao.client-id:}") String kakaoClientId;
    @Value("${zipai.oauth.kakao.client-secret:}") String kakaoClientSecret;
    @Value("${zipai.oauth.google.client-id:}") String googleClientId;
    @Value("${zipai.oauth.google.client-secret:}") String googleClientSecret;

    public SocialLoginService(OAuthIdentityRepository identities, UserRepository users, PasswordService passwords,
                              AuthService auth, ObjectMapper json) {
        this.identities=identities;this.users=users;this.passwords=passwords;this.auth=auth;this.json=json;
    }

    public String authorizationUrl(String provider,HttpSession session) {
        ProviderConfig config=config(provider);
        if(config.clientId().isBlank()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, providerLabel(provider)+" 로그인 설정이 필요합니다.");
        String state=UUID.randomUUID().toString();session.setAttribute(STATE,state);session.setAttribute(PROVIDER,provider);
        String redirect=callback(provider);
        if("kakao".equals(provider)) return "https://kauth.kakao.com/oauth/authorize?response_type=code&client_id="+e(config.clientId())+"&redirect_uri="+e(redirect)+"&state="+e(state);
        return "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id="+e(config.clientId())+"&redirect_uri="+e(redirect)+"&scope="+e("openid email profile")+"&state="+e(state)+"&prompt=select_account";
    }

    public Map<String,Boolean> availability() {
        return Map.of("kakao",!kakaoClientId.isBlank(),"google",!googleClientId.isBlank());
    }

    public User callback(String provider,String code,String state,HttpSession session) {
        if(code==null||code.isBlank()||state==null||!state.equals(session.getAttribute(STATE))||!provider.equals(session.getAttribute(PROVIDER)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"소셜 로그인 요청을 다시 시작해 주세요.");
        session.removeAttribute(STATE);session.removeAttribute(PROVIDER);
        SocialProfile profile=fetchProfile(provider,code);
        User user=findOrCreate(profile);
        if(!"active".equals(user.status)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"사용할 수 없는 계정입니다.");
        auth.establishSession(user,session);return user;
    }

    private SocialProfile fetchProfile(String provider,String code) {
        try {
            ProviderConfig config=config(provider);String redirect=callback(provider);
            Map<String,String> tokenForm=new LinkedHashMap<>();tokenForm.put("grant_type","authorization_code");tokenForm.put("client_id",config.clientId());
            tokenForm.put("client_secret",config.clientSecret());tokenForm.put("redirect_uri",redirect);tokenForm.put("code",code);
            String tokenUrl="kakao".equals(provider)?"https://kauth.kakao.com/oauth/token":"https://oauth2.googleapis.com/token";
            Map<String,Object> token=postForm(tokenUrl,tokenForm);String access=Objects.toString(token.get("access_token"),"");
            if(access.isBlank()) throw new IllegalStateException("access token missing");
            String userUrl="kakao".equals(provider)?"https://kapi.kakao.com/v2/user/me":"https://openidconnect.googleapis.com/v1/userinfo";
            Map<String,Object> data=getJson(userUrl,access);
            if("kakao".equals(provider)) {
                String subject=Objects.toString(data.get("id"),"");Map<String,Object> account=map(data.get("kakao_account"));Map<String,Object> props=map(data.get("properties"));
                String email=Objects.toString(account.get("email"),"").toLowerCase();boolean verified=Boolean.TRUE.equals(account.get("is_email_verified"))&&Boolean.TRUE.equals(account.get("is_email_valid"));
                String name=Objects.toString(props.get("nickname"),"카카오 사용자");return new SocialProfile(provider,subject,email,name,verified);
            }
            return new SocialProfile(provider,Objects.toString(data.get("sub"),""),Objects.toString(data.get("email"),"").toLowerCase(),Objects.toString(data.get("name"),"Google 사용자"),Boolean.TRUE.equals(data.get("email_verified")));
        } catch(ResponseStatusException e) { throw e; }
        catch(Exception e) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"소셜 로그인 공급자와 통신하지 못했습니다."); }
    }

    @Transactional
    protected User findOrCreate(SocialProfile profile) {
        if(profile.subject().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"소셜 계정 식별 정보를 확인할 수 없습니다.");
        Optional<OAuthIdentity> existing=identities.findByProviderAndProviderSubject(profile.provider(),profile.subject());
        if(existing.isPresent()) return existing.get().user;
        User user=null;
        if(profile.emailVerified()&&!profile.email().isBlank()) user=users.findByEmailIgnoreCase(profile.email()).orElse(null);
        if(user==null) {
            user=new User();user.username=uniqueUsername(profile.provider(),profile.subject());
            user.email=profile.email().isBlank()?profile.provider()+"+"+profile.subject()+"@oauth.zipai.invalid":profile.email();
            if(users.existsByEmailIgnoreCase(user.email)) user.email=profile.provider()+"+"+profile.subject()+"@oauth.zipai.invalid";
            user.phone="";user.passwordHash=passwords.encode(UUID.randomUUID()+"!A1");
            if(profile.emailVerified()) user.emailVerifiedAt=LocalDateTime.now();users.save(user);
        }
        OAuthIdentity identity=new OAuthIdentity();identity.user=user;identity.provider=profile.provider();identity.providerSubject=profile.subject();identity.providerEmail=profile.email();identities.save(identity);return user;
    }

    private String uniqueUsername(String provider,String subject) {
        String base=(provider+"_"+subject.replaceAll("[^A-Za-z0-9]","")).substring(0,Math.min(18,(provider+"_"+subject.replaceAll("[^A-Za-z0-9]","")).length()));
        String candidate=base;int suffix=1;while(users.existsByUsernameIgnoreCase(candidate)){String tail=String.valueOf(suffix++);candidate=base.substring(0,Math.min(base.length(),20-tail.length()))+tail;}return candidate;
    }
    private Map<String,Object> postForm(String url,Map<String,String> values)throws Exception {StringJoiner form=new StringJoiner("&");values.forEach((k,v)->{if(v!=null&&!v.isBlank())form.add(e(k)+"="+e(v));});HttpRequest request=HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(12)).header("Content-Type","application/x-www-form-urlencoded;charset=UTF-8").POST(HttpRequest.BodyPublishers.ofString(form.toString())).build();return response(request);}
    private Map<String,Object> getJson(String url,String token)throws Exception {HttpRequest request=HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(12)).header("Authorization","Bearer "+token).GET().build();return response(request);}
    private Map<String,Object> response(HttpRequest request)throws Exception {HttpResponse<String> response=http.send(request,HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));if(response.statusCode()<200||response.statusCode()>=300)throw new IllegalStateException("oauth http "+response.statusCode());return json.readValue(response.body(),new TypeReference<>(){});}
    private ProviderConfig config(String provider){return switch(provider){case "kakao"->new ProviderConfig(kakaoClientId,kakaoClientSecret);case "google"->new ProviderConfig(googleClientId,googleClientSecret);default->throw new ResponseStatusException(HttpStatus.NOT_FOUND,"지원하지 않는 소셜 로그인입니다.");};}
    private String callback(String provider){return publicBaseUrl.replaceAll("/$","")+"/api/auth/oauth/"+provider+"/callback";}
    private static String providerLabel(String provider){return "kakao".equals(provider)?"카카오":"구글";}
    private static String e(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);}
    @SuppressWarnings("unchecked") private static Map<String,Object> map(Object value){return value instanceof Map<?,?> map?(Map<String,Object>)map:Map.of();}
    private record ProviderConfig(String clientId,String clientSecret){}
    private record SocialProfile(String provider,String subject,String email,String name,boolean emailVerified){}
}
