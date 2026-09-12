package com.logiway.services;

import com.logiway.dto.request.CreateUserRequest;
import com.logiway.dto.request.UpdateUserRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);

    List<UserResponse> getUsers();

    UserResponse updateUser(Long id, UpdateUserRequest request);

    ApiMessageResponse deleteUser(Long id);
}
