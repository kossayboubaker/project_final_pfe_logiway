package com.logiway.entities.converters;

import com.logiway.entities.enums.TypeNotif;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TypeNotifConverter implements AttributeConverter<TypeNotif, String> {

    @Override
    public String convertToDatabaseColumn(TypeNotif attribute) {
        if (attribute == null) {
            return TypeNotif.NOTIF_MESSAGE.name();
        }
        return attribute.name();
    }

    @Override
    public TypeNotif convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return TypeNotif.NOTIF_MESSAGE;
        }

        try {
            return TypeNotif.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return TypeNotif.NOTIF_MESSAGE;
        }
    }
}
