package com.uth.datalabeling;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class DatalabelingApplication {
	public static void main(String[] args) {
		// Load .env
		String envDir = new java.io.File(".env").exists() ? "./" : "./backend";
		Dotenv dotenv = Dotenv.configure()
				.directory(envDir)
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
