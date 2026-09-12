package com.logiway.exceptions;

public class AuthProviderUnavailableException extends RuntimeException {
    public AuthProviderUnavailableException(String message) {
        super(message);
    }
}
