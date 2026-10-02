package com.zipai.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {
    private static final String LEGACY_PREFIX = "$scrypt$";
    private final PasswordEncoder bcrypt;
    public PasswordService(PasswordEncoder bcrypt) { this.bcrypt = bcrypt; }
    public String encode(String raw) { return bcrypt.encode(raw); }
    public boolean matches(String raw, String encoded) {
        if (!encoded.startsWith(LEGACY_PREFIX)) return bcrypt.matches(raw, encoded);
        String[] parts = encoded.split("\\$");
        if (parts.length != 4) return false;
        try {
            byte[] actual = SCrypt.generate(raw.getBytes(StandardCharsets.UTF_8),
                HexFormat.of().parseHex(parts[2]), 16384, 8, 1, 64);
            return MessageDigest.isEqual(actual, HexFormat.of().parseHex(parts[3]));
        } catch (RuntimeException error) {
            return false;
        }
    }
    public boolean isLegacy(String encoded) { return encoded.startsWith(LEGACY_PREFIX); }
}
