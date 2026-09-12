package com.logiway.entities.converters;

import com.logiway.entities.enums.TypeNotif;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TypeNotifConverter — Tests Unitaires")
class TypeNotifConverterTest {

    private final TypeNotifConverter converter = new TypeNotifConverter();

    @Test
    @DisplayName("convertToDatabaseColumn → attribute null retourne NOTIF_MESSAGE")
    void convertToDatabaseColumn_null_returnsDefault() {
        String result = converter.convertToDatabaseColumn(null);
        assertThat(result).isEqualTo("NOTIF_MESSAGE");
    }

    @Test
    @DisplayName("convertToDatabaseColumn → retourne le nom de l'enum")
    void convertToDatabaseColumn_valid_returnsName() {
        for (TypeNotif type : TypeNotif.values()) {
            String result = converter.convertToDatabaseColumn(type);
            assertThat(result).isEqualTo(type.name());
        }
    }

    @Test
    @DisplayName("convertToEntityAttribute → dbData null ou vide retourne NOTIF_MESSAGE")
    void convertToEntityAttribute_nullOrBlank_returnsDefault() {
        assertThat(converter.convertToEntityAttribute(null)).isEqualTo(TypeNotif.NOTIF_MESSAGE);
        assertThat(converter.convertToEntityAttribute("   ")).isEqualTo(TypeNotif.NOTIF_MESSAGE);
    }

    @Test
    @DisplayName("convertToEntityAttribute → dbData valide retourne l'enum correspondante")
    void convertToEntityAttribute_valid_returnsEnum() {
        for (TypeNotif type : TypeNotif.values()) {
            TypeNotif result = converter.convertToEntityAttribute(type.name());
            assertThat(result).isEqualTo(type);
            
            // Test case insensitivity and spaces
            TypeNotif resultMixed = converter.convertToEntityAttribute("  " + type.name().toLowerCase() + "  ");
            assertThat(resultMixed).isEqualTo(type);
        }
    }

    @Test
    @DisplayName("convertToEntityAttribute → dbData invalide retourne NOTIF_MESSAGE")
    void convertToEntityAttribute_invalid_returnsDefault() {
        TypeNotif result = converter.convertToEntityAttribute("INVALID_TYPE_123");
        assertThat(result).isEqualTo(TypeNotif.NOTIF_MESSAGE);
    }
}
