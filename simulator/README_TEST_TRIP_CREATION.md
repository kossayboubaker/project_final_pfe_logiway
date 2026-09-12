# Bug Exploration Test - Missing Pause Generation on Trip Creation

## Test File
`test_bug_exploration_trip_creation.py`

## Purpose
This test verifies Bug Condition Point 2: pauses are NOT automatically generated when `TrajetServiceImpl.createTrajet()` saves a new trip.

**This test is EXPECTED TO FAIL on unfixed code** - failure confirms the bug exists.

## Requirements
1. Backend running on `http://localhost:8080`
2. Valid user credentials with permissions to create trips
3. Python packages: `pytest`, `requests`

## Running the Test

### Option 1: With Environment Variables
```powershell
$env:TEST_USERNAME="your.email@example.com"
$env:TEST_PASSWORD="yourpassword"
python -m pytest simulator\test_bug_exploration_trip_creation.py -v -s
```

### Option 2: With Default Credentials
The test attempts to use default credentials:
- Username: `admin@logiway.com`
- Password: `admin`

If these don't exist in your Keycloak, create them or set environment variables.

```powershell
python -m pytest simulator\test_bug_exploration_trip_creation.py -v -s
```

### Run Specific Tests
```powershell
# Test 1: Verify pauses NOT generated on creation
python -m pytest simulator\test_bug_exploration_trip_creation.py::test_pauses_not_generated_on_trip_creation -v -s

# Test 2: Verify logs missing pause generation confirmation
python -m pytest simulator\test_bug_exploration_trip_creation.py::test_logs_missing_pause_generation_confirmation -v -s

# Test 3: Verify short trips have no pauses
python -m pytest simulator\test_bug_exploration_trip_creation.py::test_short_trips_no_pauses_on_creation -v -s

# Test 4: Document current workaround (Démarrer button)
python -m pytest simulator\test_bug_exploration_trip_creation.py::test_pauses_generated_only_on_trip_start -v -s
```

## Expected Outcomes (BEFORE Fix)

### Test 1: `test_pauses_not_generated_on_trip_creation`
- **EXPECTED**: FAIL (AssertionError)
- **Reason**: Pauses array is empty after trip creation
- **Confirms**: Bug exists - `genererPauses()` not called in `createTrajet()`

### Test 2: `test_logs_missing_pause_generation_confirmation`
- **EXPECTED**: FAIL
- **Reason**: No pauses generated, logs lack "[TRAJET-CREATE] Pauses réglementaires générées automatiquement"
- **Confirms**: Missing pause generation call

### Test 3: `test_short_trips_no_pauses_on_creation`
- **EXPECTED**: PASS
- **Reason**: This is correct behavior - trips < 180 minutes should have no pauses
- **Verifies**: Duration threshold logic works correctly

### Test 4: `test_pauses_generated_only_on_trip_start`
- **EXPECTED**: Documents current behavior
- **Shows**: Pauses ARE generated when "Démarrer" is clicked (workaround)
- **Confirms**: User confusion - must click button to see pauses

## Expected Outcomes (AFTER Fix)

### Test 1: `test_pauses_not_generated_on_trip_creation`
- **EXPECTED**: PASS
- **Reason**: Pauses array contains WARNING_ALERT and/or MANDATORY_REST
- **Confirms**: Fix works - `genererPauses()` called in `createTrajet()`

### Test 2: `test_logs_missing_pause_generation_confirmation`
- **EXPECTED**: PASS
- **Reason**: Pauses generated, logs contain pause generation confirmation
- **Confirms**: Logging works correctly

### Test 3: `test_short_trips_no_pauses_on_creation`
- **EXPECTED**: PASS (unchanged)
- **Verifies**: Fix doesn't break duration threshold logic

### Test 4: `test_pauses_generated_only_on_trip_start`
- **EXPECTED**: Shows pauses exist BEFORE "Démarrer"
- **Confirms**: No longer need to click button - automatic generation works

## Troubleshooting

### Authentication Failed
```
[AUTH] Login failed: 401 - {"message":"Invalid credentials"}
SKIPPED
```
**Solution**: 
1. Check Keycloak is running
2. Verify user exists in Keycloak
3. Set correct TEST_USERNAME and TEST_PASSWORD environment variables

### Backend Not Available
```
SKIPPED: Backend not available
```
**Solution**:
1. Start backend: `mvn spring-boot:run` in backend directory
2. Verify backend is running: `curl http://localhost:8080/api/v1/health`

### HTTP 404 Not Found
```
SKIPPED: Endpoint not found
```
**Solution**:
- Ensure backend version matches expected API endpoints
- Check TrajetController has POST /api/trajets endpoint
- Check PauseReglementaireController has GET /api/trajets/{id}/pauses endpoint

### Test Hangs or Times Out
**Solution**:
- Check OSRM routing service is accessible
- Check Python simulator is working
- Review backend logs for errors

## Validating the Fix

After implementing the fix (adding `genererPauses()` call in `createTrajet()`):

1. Rebuild backend: `mvn clean install`
2. Restart backend
3. Run tests again
4. Test 1 should PASS (pauses generated)
5. Test 2 should PASS (logs correct)
6. Test 3 should PASS (short trips unchanged)
7. Test 4 should show pauses exist BEFORE "Démarrer"

## Related Requirements
- Requirements 3.1: createTrajet() doesn't call genererPauses()
- Requirements 3.2: User must click "Démarrer" to see pauses
- Requirements 3.3: Pauses should generate immediately for trips >= 180 min
