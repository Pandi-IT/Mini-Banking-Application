package com.bankease;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
public class BankeaseCoreApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(BankeaseCoreApplication.class, args);
	}

	private static void loadEnv() {
		try {
			Path path = Paths.get(".env");
			if (!Files.exists(path)) {
				path = Paths.get("../.env");
			}
			if (Files.exists(path)) {
				List<String> lines = Files.readAllLines(path);
				for (String line : lines) {
					line = line.trim();
					if (line.isEmpty() || line.startsWith("#")) {
						continue;
					}
					int equalsIdx = line.indexOf('=');
					if (equalsIdx > 0) {
						String key = line.substring(0, equalsIdx).trim();
						String value = line.substring(equalsIdx + 1).trim();
						
						// Remove surrounding quotes if any
						if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						} else if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						}
						
						System.setProperty(key, value);
					}
				}
				System.out.println("[EnvLoader] Successfully loaded configuration from: " + path.toAbsolutePath());
			} else {
				System.out.println("[EnvLoader] No .env file found. Relying on system environment variables.");
			}
		} catch (IOException e) {
			System.err.println("[EnvLoader] Warning: Could not read .env file: " + e.getMessage());
		}
	}
}
