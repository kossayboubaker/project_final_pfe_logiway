package com.logiway.controllers;

import com.logiway.dto.meteo.MeteoResponse;
import com.logiway.services.MeteoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meteo")
@RequiredArgsConstructor
public class MeteoController {

    private final MeteoService meteoService;

    @GetMapping
    public ResponseEntity<MeteoResponse> getWeather(@RequestParam double lat, @RequestParam double lon) {
        return ResponseEntity.ok(meteoService.getMeteo(lat, lon));
    }
}