package com.logiway.services;

import com.logiway.dto.request.ForgotPasswordRequest;
import com.logiway.dto.request.LoginRequest;
import com.logiway.dto.request.ResetPasswordRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.AuthSessionResponse;
import com.logiway.dto.response.LoginResult;

import java.util.Map;

public interface AuthService {

    LoginResult login(LoginRequest request);

    AuthSessionResponse me();

    ApiMessageResponse logout(String refreshToken);

    Map<String, Object> refreshTokenFromKeycloak(String refreshToken);

    ApiMessageResponse forgotPassword(ForgotPasswordRequest request);

    ApiMessageResponse resetPassword(ResetPasswordRequest request);

    ApiMessageResponse getRejectionReason(ForgotPasswordRequest request);

    ApiMessageResponse verifyEmail(String token);
}
