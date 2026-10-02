package com.zipai.tools;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public final class ResetAdminPassword {
    private ResetAdminPassword() {}

    public static void main(String[] args) throws Exception {
        String url = required("DB_URL");
        String dbUsername = required("DB_USERNAME");
        String dbPassword = required("DB_PASSWORD");
        String adminUsername = required("ADMIN_USERNAME");
        String newPassword = required("ADMIN_NEW_PASSWORD");

        if (!adminUsername.matches("^[A-Za-z0-9_\\uAC00-\\uD7A3]{4,20}$")) {
            throw new IllegalArgumentException("Invalid administrator username format.");
        }
        if (newPassword.length() < 8 || newPassword.length() > 72) {
            throw new IllegalArgumentException("The new password must contain 8 to 72 characters.");
        }

        try (Connection connection = DriverManager.getConnection(url, dbUsername, dbPassword)) {
            connection.setAutoCommit(false);
            try {
                String role = null;
                String status = null;
                try (PreparedStatement query = connection.prepareStatement(
                    "SELECT role, status FROM users WHERE username = ?")) {
                    query.setString(1, adminUsername);
                    try (ResultSet result = query.executeQuery()) {
                        if (result.next()) {
                            role = result.getString("role");
                            status = result.getString("status");
                        }
                    }
                }
                if (role == null) adminUsername = findSoleActiveAdmin(connection, adminUsername);
                else {
                    if (!"admin".equals(role)) throw new IllegalStateException("The selected account is not an administrator.");
                    if (!"active".equals(status)) throw new IllegalStateException("The selected administrator is not active.");
                }

                try (PreparedStatement update = connection.prepareStatement(
                    "UPDATE users SET password_hash = ?, updated_at = NOW(6) WHERE username = ? AND role = 'admin' AND status = 'active'")) {
                    update.setString(1, new BCryptPasswordEncoder().encode(newPassword));
                    update.setString(2, adminUsername);
                    if (update.executeUpdate() != 1) throw new IllegalStateException("The password was not changed.");
                }
                connection.commit();
                System.out.println("Administrator password reset successfully: " + adminUsername);
            } catch (Exception error) {
                connection.rollback();
                throw error;
            }
        }
    }

    private static String findSoleActiveAdmin(Connection connection, String requested) throws Exception {
        List<String> administrators = new ArrayList<>();
        try (PreparedStatement query = connection.prepareStatement(
            "SELECT username FROM users WHERE role = 'admin' AND status = 'active' ORDER BY id")) {
            try (ResultSet result = query.executeQuery()) {
                while (result.next()) administrators.add(result.getString("username"));
            }
        }
        if (administrators.size() == 1) {
            System.out.println("Requested account not found; using the sole active administrator: " + administrators.get(0));
            return administrators.get(0);
        }
        if (administrators.isEmpty()) {
            throw new IllegalStateException("No active administrator exists in the production database.");
        }
        throw new IllegalStateException("Account '" + requested + "' was not found. Active administrators: " + String.join(", ", administrators));
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " environment variable is required.");
        return value;
    }
}
