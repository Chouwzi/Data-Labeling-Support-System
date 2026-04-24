package com.uth.datalabeling.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        // Read from CLOUDINARY_URL in .env automatically by using the Cloudinary empty constructor
        // Note: The `dotenv-java` library should load .env variables into the environment for this to work
        // or we can pass the URL directly if we configure it via application.properties.
        // Assuming we are reading from the CLOUDINARY_URL environment variable.
        Cloudinary cloudinary = new Cloudinary(System.getenv("CLOUDINARY_URL"));
        
        // If CLOUDINARY_URL is somehow null, we could fallback to individual properties if we wanted to
        // But for this feature, using CLOUDINARY_URL is standard and provided by the user.
        return cloudinary;
    }
}
