package com.logiway.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
    
    @GetMapping
    public String checkHealth() {
        return "LogiWay Backend is Running!";
    }
}
