package com.logiway.services;

import com.logiway.dto.response.NotificationResponse;
import java.util.List;

public interface NotificationService {

    List<NotificationResponse> getCurrentUserNotifications();

    List<NotificationResponse> getCurrentUserUnreadNotifications();

}
