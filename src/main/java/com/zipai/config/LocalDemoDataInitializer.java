package com.zipai.config;

import com.zipai.domain.User;
import com.zipai.repository.UserRepository;
import com.zipai.service.PasswordService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local-demo")
public class LocalDemoDataInitializer {
    @Bean
    CommandLineRunner localDemoAccounts(UserRepository users, PasswordService passwords) {
        return args -> {
            createIfMissing(users, passwords, "demo", "demo@zipai.local", "01011112222", "member", "demo1234!");
            createIfMissing(users, passwords, "admin", "admin@zipai.local", "01099998888", "admin", "admin1234!");
        };
    }

    private void createIfMissing(UserRepository users, PasswordService passwords, String username,
                                 String email, String phone, String role, String rawPassword) {
        if (users.existsByUsernameIgnoreCase(username)) return;
        User user = new User();
        user.username = username;
        user.email = email;
        user.phone = phone;
        user.role = role;
        user.passwordHash = passwords.encode(rawPassword);
        users.save(user);
    }
}
