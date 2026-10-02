package com.zipai.tools;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public final class CreateAdminAccount {
    private CreateAdminAccount() {}

    public static void main(String[] args) throws Exception {
        String url = required("DB_URL");
        String dbUsername = required("DB_USERNAME");
        String dbPassword = required("DB_PASSWORD");
        String username = required("NEW_ADMIN_USERNAME").trim();
        String email = required("NEW_ADMIN_EMAIL").trim().toLowerCase();
        String phone = required("NEW_ADMIN_PHONE").replaceAll("[^0-9]", "");
        String password = required("NEW_ADMIN_PASSWORD");

        if (!username.matches("^[A-Za-z0-9_\\uAC00-\\uD7A3]{4,20}$")) {
            throw new IllegalArgumentException("Username must contain 4 to 20 letters, numbers, underscores, or Korean characters.");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Invalid email address.");
        }
        if (phone.length() < 10 || phone.length() > 11) {
            throw new IllegalArgumentException("Phone number must contain 10 or 11 digits.");
        }
        if (password.length() < 8 || password.length() > 72) {
            throw new IllegalArgumentException("Password must contain 8 to 72 characters.");
        }

        try (Connection connection = DriverManager.getConnection(url, dbUsername, dbPassword)) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement query = connection.prepareStatement(
                    "SELECT username, email FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)")) {
                    query.setString(1, username);
                    query.setString(2, email);
                    try (ResultSet result = query.executeQuery()) {
                        if (result.next()) {
                            throw new IllegalStateException("The username or email is already registered.");
                        }
                    }
                }

                try (PreparedStatement insert = connection.prepareStatement(
                    "INSERT INTO users (username, email, phone, password_hash, role, status, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, 'admin', 'active', NOW(6), NOW(6))")) {
                    insert.setString(1, username);
                    insert.setString(2, email);
                    insert.setString(3, phone);
                    insert.setString(4, new BCryptPasswordEncoder().encode(password));
                    if (insert.executeUpdate() != 1) throw new IllegalStateException("Administrator account was not created.");
                }
                connection.commit();
                System.out.println("Administrator account created successfully: " + username);
            } catch (Exception error) {
                connection.rollback();
                throw error;
            }
        }
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " environment variable is required.");
        return value;
    }
}
