package com.zipai.service;

import com.zipai.domain.User;
import com.zipai.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class AuthService {
    private static final String USER_ID = "ZIPAI_USER_ID";
    private final UserRepository users;
    private final PasswordService passwords;
    private final VerificationService verification;
    @Value("${zipai.verification.require-signup:true}") boolean requireSignupVerification;

    public AuthService(UserRepository users, PasswordService passwords, VerificationService verification) {
        this.users = users;
        this.passwords = passwords;
        this.verification = verification;
    }

    public User required(HttpSession session) {
        Object id = session.getAttribute(USER_ID);
        if (!(id instanceof Long userId)) throw new ResponseStatusException(UNAUTHORIZED, "로그인이 필요합니다.");
        User user = users.findById(userId).orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "로그인이 필요합니다."));
        if (!"active".equals(user.status)) throw new ResponseStatusException(UNAUTHORIZED, "사용할 수 없는 계정입니다.");
        return user;
    }

    public User admin(HttpSession session) {
        User user = required(session);
        if (!"admin".equals(user.role)) throw new ResponseStatusException(FORBIDDEN, "관리자 권한이 필요합니다.");
        return user;
    }

    public User current(HttpSession session) {
        try { return required(session); } catch (ResponseStatusException ignored) { return null; }
    }

    @Transactional
    public User signup(Map<String, Object> body, HttpSession session) {
        String username = text(body, "userId");
        String email = text(body, "email").toLowerCase();
        String phone = text(body, "phone").replaceAll("[^0-9]", "");
        String password = text(body, "password");
        if (!username.matches("^[A-Za-z0-9_가-힣]{4,20}$"))
            throw new ResponseStatusException(BAD_REQUEST, "아이디는 한글, 영문, 숫자, 밑줄을 사용해 4~20자로 입력해 주세요.");
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            throw new ResponseStatusException(BAD_REQUEST, "올바른 이메일 주소를 입력해 주세요.");
        if (phone.length() < 10 || phone.length() > 11)
            throw new ResponseStatusException(BAD_REQUEST, "올바른 휴대폰 번호를 입력해 주세요.");
        if (password.length() < 8 || password.length() > 72 || !strongPassword(password))
            throw new ResponseStatusException(BAD_REQUEST, "비밀번호는 8~72자이며 영문, 숫자, 특수문자를 각각 포함해야 합니다.");
        if (users.existsByUsernameIgnoreCase(username)) throw new ResponseStatusException(CONFLICT, "이미 사용 중인 아이디입니다.");
        if (users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(CONFLICT, "이미 가입된 이메일입니다.");
        String channel=text(body,"verificationChannel");
        String destination="sms".equals(channel)?phone:email;
        if(requireSignupVerification&&!verification.consumeVerified("identity",channel,destination))throw new ResponseStatusException(FORBIDDEN,"이메일 또는 휴대폰 인증을 먼저 완료해 주세요.");
        User user = new User();
        user.username = username; user.email = email; user.phone = phone; user.passwordHash = passwords.encode(password);
        if("email".equals(channel))user.emailVerifiedAt=LocalDateTime.now();if("sms".equals(channel))user.phoneVerifiedAt=LocalDateTime.now();
        users.save(user);
        session.setAttribute(USER_ID, user.id);
        return user;
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public User login(Map<String, Object> body, HttpSession session) {
        User user = users.findByUsernameIgnoreCase(text(body, "userId"))
            .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "아이디 또는 비밀번호를 확인해 주세요."));
        if(user.lockedUntil!=null&&user.lockedUntil.isAfter(LocalDateTime.now()))throw new ResponseStatusException(LOCKED,"로그인 시도가 제한되었습니다. 잠시 후 다시 시도해 주세요.");
        if (!"active".equals(user.status)) throw new ResponseStatusException(UNAUTHORIZED, "아이디 또는 비밀번호를 확인해 주세요.");
        if(!passwords.matches(text(body,"password"),user.passwordHash)){user.failedLoginAttempts++;if(user.failedLoginAttempts>=5){user.lockedUntil=LocalDateTime.now().plusMinutes(15);user.failedLoginAttempts=0;}users.save(user);throw new ResponseStatusException(UNAUTHORIZED,"아이디 또는 비밀번호를 확인해 주세요.");}
        user.failedLoginAttempts=0;user.lockedUntil=null;users.save(user);
        if (passwords.isLegacy(user.passwordHash)) {
            user.passwordHash = passwords.encode(text(body, "password"));
            users.save(user);
        }
        session.setAttribute(USER_ID, user.id);
        return user;
    }

    public void establishSession(User user, HttpSession session) {
        session.setAttribute(USER_ID, user.id);
    }

    @Transactional public User updateProfile(Map<String,Object> body,HttpSession session){User u=required(session);String email=text(body,"email").toLowerCase(),phone=text(body,"phone").replaceAll("[^0-9]","");if(!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")||phone.length()<10||phone.length()>11)throw new ResponseStatusException(BAD_REQUEST,"이메일과 휴대폰 번호를 확인해 주세요.");if(users.existsByEmailIgnoreCaseAndIdNot(email,u.id))throw new ResponseStatusException(CONFLICT,"이미 가입된 이메일입니다.");boolean emailChanged=!email.equals(u.email),phoneChanged=!phone.equals(u.phone);if(emailChanged||phoneChanged){String channel=text(body,"verificationChannel"),destination="sms".equals(channel)?phone:email;if((emailChanged&&!"email".equals(channel))||(phoneChanged&&!"sms".equals(channel))||!verification.consumeVerified("identity",channel,destination))throw new ResponseStatusException(FORBIDDEN,"변경할 연락처의 본인 인증을 먼저 완료해 주세요.");}if(emailChanged)u.emailVerifiedAt=LocalDateTime.now();if(phoneChanged)u.phoneVerifiedAt=LocalDateTime.now();u.email=email;u.phone=phone;return users.save(u);}
    @Transactional public void changePassword(Map<String,Object> body,HttpSession session){User u=required(session);String current=text(body,"currentPassword"),next=text(body,"newPassword");if(!passwords.matches(current,u.passwordHash))throw new ResponseStatusException(UNAUTHORIZED,"현재 비밀번호가 올바르지 않습니다.");validateNewPassword(next);u.passwordHash=passwords.encode(next);users.save(u);}
    @Transactional public void withdraw(Map<String,Object> body,HttpSession session){User u=required(session);if(!passwords.matches(text(body,"password"),u.passwordHash))throw new ResponseStatusException(UNAUTHORIZED,"비밀번호가 올바르지 않습니다.");u.status="deleted";u.deletedAt=LocalDateTime.now();u.email="deleted+"+u.id+"@zipai.invalid";u.phone="";users.save(u);session.invalidate();}
    @Transactional public void resetPassword(String email,String password){User u=users.findByEmailIgnoreCase(email.trim().toLowerCase()).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"계정을 찾을 수 없습니다."));validateNewPassword(password);u.passwordHash=passwords.encode(password);u.failedLoginAttempts=0;u.lockedUntil=null;users.save(u);}
    private static void validateNewPassword(String p){if(p.length()<8||p.length()>72||!strongPassword(p))throw new ResponseStatusException(BAD_REQUEST,"비밀번호는 8~72자이며 영문, 숫자, 특수문자를 각각 포함해야 합니다.");}
    private static boolean strongPassword(String p){return p.matches(".*[A-Za-z].*")&&p.matches(".*[0-9].*")&&p.matches(".*[^A-Za-z0-9].*");}

    public Map<String, Object> publicUser(User user) {
        return Map.of("id", user.username, "userId", user.id, "email", user.email,
            "phone", user.phone, "role", user.role, "createdAt", user.createdAt);
    }

    private static String text(Map<String, Object> body, String key) {
        return String.valueOf(body.getOrDefault(key, "")).trim();
    }
}
