package com.logiway.services;

import com.logiway.dto.request.MessengerTextRequest;
import com.logiway.dto.request.MessengerMessageUpdateRequest;
import com.logiway.dto.response.MessengerConversationResponse;
import com.logiway.dto.response.MessengerMessagePageResponse;
import com.logiway.dto.response.MessengerMessageResponse;
import com.logiway.dto.response.MessengerPresenceResponse;
import com.logiway.dto.response.MessengerReadResponse;
import com.logiway.dto.response.MessengerUserResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MessengerService {
    List<MessengerConversationResponse> getConversations(String search);

    MessengerMessagePageResponse getConversationMessages(Long destinataireId, int page, int size);

    MessengerMessageResponse sendTextMessage(MessengerTextRequest request);

    MessengerMessageResponse sendFileMessage(Long destinataireId, MultipartFile file);

    MessengerMessageResponse sendVocalMessage(Long destinataireId, MultipartFile file, Integer dureeVocale);

    MessengerMessageResponse updateMessage(Long messageId, MessengerMessageUpdateRequest request);

    void deleteMessage(Long messageId);

    Resource loadFile(String filename);

    MessengerReadResponse markConversationAsRead(Long destinataireId);

    List<MessengerUserResponse> getAuthorizedUsers(String search);

    MessengerPresenceResponse heartbeat();

    void disconnectPresence();
}