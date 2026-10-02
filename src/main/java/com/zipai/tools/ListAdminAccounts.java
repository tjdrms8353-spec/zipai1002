package com.zipai.tools;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public final class ListAdminAccounts {
    private ListAdminAccounts() {}

    public static void main(String[] args) throws Exception {
        String url = required("DB_URL");
        String username = required("DB_USERNAME");
        String password = required("DB_PASSWORD");
        int count = 0;

        try (Connection connection = DriverManager.getConnection(url, username, password);
             PreparedStatement query = connection.prepareStatement(
                 "SELECT username, email, status FROM users WHERE role = 'admin' ORDER BY id");
             ResultSet result = query.executeQuery()) {
            System.out.println("ADMIN_ACCOUNTS_BEGIN");
            while (result.next()) {
                count++;
                System.out.printf("username=%s | email=%s | status=%s%n",
                    result.getString("username"), result.getString("email"), result.getString("status"));
            }
            System.out.println("ADMIN_ACCOUNTS_END");
            System.out.println("ADMIN_ACCOUNT_COUNT=" + count);
        }
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " environment variable is required.");
        return value;
    }
}
