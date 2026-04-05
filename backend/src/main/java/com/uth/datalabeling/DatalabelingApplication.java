package com.uth.datalabeling;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class DatalabelingApplication {

	public static void main(String[] args) {
		// Load .env
		Dotenv dotenv = Dotenv.configure()
				.directory("./backend")
				.ignoreIfMissing()
				.load();

		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
		});

		// Set TimeZone mặc định JPA để tránh lỗi với postgreSQL
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));

		SpringApplication.run(DatalabelingApplication.class, args);
	}

}
