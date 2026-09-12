package com.logiway.services;

import org.junit.jupiter.api.Test;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import com.fasterxml.jackson.core.type.TypeReference;

import static org.junit.jupiter.api.Assertions.*;

class InnerRecordsTest {

    @Test
    void testTrajetServiceImplTripTimingMetrics() throws Exception {
        Class<?> clazz = Class.forName("com.logiway.services.impl.TrajetServiceImpl$TripTimingMetrics");
        Constructor<?> cons = clazz.getDeclaredConstructor(Integer.class, Integer.class, String.class);
        cons.setAccessible(true);

        Object m1 = cons.newInstance(100, 10, "BON");
        Object m2 = cons.newInstance(100, 10, "BON");
        Object m3 = cons.newInstance(200, 20, "MAUVAIS");

        // Verify getters
        Method duree = clazz.getDeclaredMethod("dureeReelleMinutes");
        duree.setAccessible(true);
        assertEquals(100, duree.invoke(m1));

        Method retard = clazz.getDeclaredMethod("retardMinutes");
        retard.setAccessible(true);
        assertEquals(10, retard.invoke(m1));

        Method statut = clazz.getDeclaredMethod("statutPerformance");
        statut.setAccessible(true);
        assertEquals("BON", statut.invoke(m1));

        // Boilerplate tests
        assertEquals(m1, m2);
        assertNotEquals(m1, m3);
        assertEquals(m1.hashCode(), m2.hashCode());
        assertNotNull(m1.toString());
    }

    @Test
    void testProfileServiceImplTripTimingMetrics() throws Exception {
        Class<?> clazz = Class.forName("com.logiway.services.impl.ProfileServiceImpl$TripTimingMetrics");
        Constructor<?> cons = clazz.getDeclaredConstructor(Integer.class, Integer.class, String.class);
        cons.setAccessible(true);

        Object m1 = cons.newInstance(80, 5, "EXCELLENT");
        Object m2 = cons.newInstance(80, 5, "EXCELLENT");
        Object m3 = cons.newInstance(150, 15, "NORMAL");

        // Verify getters
        Method duree = clazz.getDeclaredMethod("dureeReelleMinutes");
        duree.setAccessible(true);
        assertEquals(80, duree.invoke(m1));

        Method retard = clazz.getDeclaredMethod("retardMinutes");
        retard.setAccessible(true);
        assertEquals(5, retard.invoke(m1));

        Method statut = clazz.getDeclaredMethod("statutPerformance");
        statut.setAccessible(true);
        assertEquals("EXCELLENT", statut.invoke(m1));

        // Boilerplate tests
        assertEquals(m1, m2);
        assertNotEquals(m1, m3);
        assertEquals(m1.hashCode(), m2.hashCode());
        assertNotNull(m1.toString());
    }

    @Test
    void testVehiculeServiceImplDriverAvailability() throws Exception {
        Class<?> clazz = Class.forName("com.logiway.services.impl.VehiculeServiceImpl$DriverAvailability");
        Constructor<?> cons = clazz.getDeclaredConstructor(LocalDateTime.class, boolean.class);
        cons.setAccessible(true);

        LocalDateTime now = LocalDateTime.now();
        Object a1 = cons.newInstance(now, true);
        Object a2 = cons.newInstance(now, true);
        Object a3 = cons.newInstance(now.plusDays(1), false);

        // Verify getters
        Method availableAt = clazz.getDeclaredMethod("availableAt");
        availableAt.setAccessible(true);
        assertEquals(now, availableAt.invoke(a1));

        Method available = clazz.getDeclaredMethod("available");
        available.setAccessible(true);
        assertEquals(true, available.invoke(a1));

        // Boilerplate tests
        assertEquals(a1, a2);
        assertNotEquals(a1, a3);
        assertEquals(a1.hashCode(), a2.hashCode());
        assertNotNull(a1.toString());
    }

    @Test
    void testMessengerServiceImplPresenceSnapshot() throws Exception {
        Class<?> clazz = Class.forName("com.logiway.services.impl.MessengerServiceImpl$PresenceSnapshot");
        Constructor<?> cons = clazz.getDeclaredConstructor(boolean.class, LocalDateTime.class);
        cons.setAccessible(true);

        LocalDateTime now = LocalDateTime.now();
        Object s1 = cons.newInstance(true, now);
        Object s2 = cons.newInstance(true, now);
        Object s3 = cons.newInstance(false, now.minusMinutes(10));

        // Verify getters
        Method connecte = clazz.getDeclaredMethod("connecte");
        connecte.setAccessible(true);
        assertEquals(true, connecte.invoke(s1));

        Method activity = clazz.getDeclaredMethod("derniereActivite");
        activity.setAccessible(true);
        assertEquals(now, activity.invoke(s1));

        // Boilerplate tests
        assertEquals(s1, s2);
        assertNotEquals(s1, s3);
        assertEquals(s1.hashCode(), s2.hashCode());
        assertNotNull(s1.toString());
    }

    @Test
    void testGoogleCalendarLeaveSyncServiceCachedToken() throws Exception {
        Class<?> clazz = Class.forName("com.logiway.services.impl.GoogleCalendarLeaveSyncService$CachedToken");
        Constructor<?> cons = clazz.getDeclaredConstructor(String.class, long.class);
        cons.setAccessible(true);

        Object t1 = cons.newInstance("token1", 123456L);
        Object t2 = cons.newInstance("token1", 123456L);
        Object t3 = cons.newInstance("token2", 789012L);

        // Verify getters
        Method val = clazz.getDeclaredMethod("value");
        val.setAccessible(true);
        assertEquals("token1", val.invoke(t1));

        Method exp = clazz.getDeclaredMethod("expiresAtEpochSeconds");
        exp.setAccessible(true);
        assertEquals(123456L, exp.invoke(t1));

        // Boilerplate tests
        assertEquals(t1, t2);
        assertNotEquals(t1, t3);
        assertEquals(t1.hashCode(), t2.hashCode());
        assertNotNull(t1.toString());
    }

    @Test
    void testGoogleCalendarLeaveSyncServiceCredentials() throws Exception {
        Class<?> clazz = Class.forName("com.logiway.services.impl.GoogleCalendarLeaveSyncService$ServiceAccountCredentials");
        Constructor<?> cons = clazz.getDeclaredConstructor(String.class, String.class);
        cons.setAccessible(true);

        Object c1 = cons.newInstance("email1@test.com", "key1");
        Object c2 = cons.newInstance("email1@test.com", "key1");
        Object c3 = cons.newInstance("email2@test.com", "key2");

        // Verify getters
        Method email = clazz.getDeclaredMethod("clientEmail");
        email.setAccessible(true);
        assertEquals("email1@test.com", email.invoke(c1));

        Method pk = clazz.getDeclaredMethod("privateKey");
        pk.setAccessible(true);
        assertEquals("key1", pk.invoke(c1));

        // Boilerplate tests
        assertEquals(c1, c2);
        assertNotEquals(c1, c3);
        assertEquals(c1.hashCode(), c2.hashCode());
        assertNotNull(c1.toString());
    }

}

