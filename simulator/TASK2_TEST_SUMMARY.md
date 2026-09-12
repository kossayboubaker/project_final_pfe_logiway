# Task 2: Bug Exploration Test - Trip Creation Missing Pause Generation

## Status: ✅ COMPLETED

## Test File Created
- **Location**: `simulator/test_bug_exploration_trip_creation.py`
- **Documentation**: `simulator/README_TEST_TRIP_CREATION.md`

## Test Implementation Summary

### Tests Created

#### Test 1: `test_pauses_not_generated_on_trip_creation`
**Purpose**: Verify pauses are NOT generated automatically on trip creation (demonstrates the bug)

**Test Steps**:
1. Create trip with duration 300 minutes (5 hours) via POST /api/trajets
2. Query GET /api/trajets/{id}/pauses immediately after creation (before "Démarrer")
3. Verify response is empty array (BUG CONDITION)
4. Expected FAILURE on unfixed code - proves bug exists

**Validates**: Requirements 3.1, 3.2, 3.3

#### Test 2: `test_logs_missing_pause_generation_confirmation`
**Purpose**: Verify logs do NOT contain pause generation confirmation

**Test Steps**:
1. Create trip with duration 350 minutes (6 hours)
2. Query pauses
3. If empty, confirm logs lack "[TRAJET-CREATE] Pauses réglementaires générées automatiquement"
4. Expected FAILURE - documents missing logging

**Validates**: Requirements 3.1, 3.2

#### Test 3: `test_short_trips_no_pauses_on_creation`
**Purpose**: Verify short trips correctly have NO pauses (preservation test)

**Test Steps**:
1. Create trip with duration 120 minutes (2 hours)
2. Query pauses
3. Verify pauses array is empty (CORRECT BEHAVIOR)
4. Expected PASS - confirms duration threshold logic works

**Validates**: Requirements 2.2 (preservation)

#### Test 4: `test_pauses_generated_only_on_trip_start`
**Purpose**: Document current workaround - pauses only generated on "Démarrer"

**Test Steps**:
1. Create trip with duration 400 minutes (7 hours)
2. Query pauses BEFORE "Démarrer" - expect empty
3. Call POST /api/trajets/{id}/demarrer
4. Query pauses AFTER "Démarrer" - expect non-empty
5. Documents that users must click button to see pauses

**Validates**: Requirements 3.2 (current behavior causing confusion)

## Test Architecture

### Authentication
- Uses cookie-based authentication via Keycloak
- Login endpoint: POST /api/auth/login
- Creates authenticated session for API calls
- Credentials via environment variables: TEST_USERNAME, TEST_PASSWORD

### API Endpoints Tested
- `POST /api/trajets` - Create trip
- `GET /api/trajets/{id}/pauses` - Get pauses for trip
- `POST /api/trajets/{id}/demarrer` - Start trip
- `DELETE /api/trajets/{id}` - Delete trip (cleanup)

### Test Utilities
- `is_backend_available()` - Check backend is running
- `get_session_with_auth()` - Create authenticated session
- `create_trip()` - Helper to create test trips
- `get_pauses_for_trip()` - Helper to query pauses
- `delete_trip()` - Helper to cleanup test data

## Expected Behavior

### BEFORE Fix (Current - Buggy State)
- Test 1: **FAIL** - empty pauses array (BUG)
- Test 2: **FAIL** - missing log confirmation
- Test 3: **PASS** - short trips work correctly
- Test 4: **Documents workaround** - pauses only on "Démarrer"

### AFTER Fix (Target - Fixed State)
- Test 1: **PASS** - pauses generated automatically
- Test 2: **PASS** - logs contain confirmation
- Test 3: **PASS** - short trips still work correctly
- Test 4: **Shows improvement** - pauses exist before "Démarrer"

## Running the Test

### Prerequisites
1. Backend running on http://localhost:8080
2. Keycloak configured with test user
3. Python packages: pytest, requests

### Execution
```powershell
# Set credentials
$env:TEST_USERNAME="admin@logiway.com"
$env:TEST_PASSWORD="admin"

# Run all tests
python -m pytest simulator\test_bug_exploration_trip_creation.py -v -s

# Run specific test
python -m pytest simulator\test_bug_exploration_trip_creation.py::test_pauses_not_generated_on_trip_creation -v -s
```

## Key Design Decisions

### 1. Session-Based Authentication
- Uses `requests.Session()` to maintain cookies
- Authenticates once, reuses session for all API calls
- More realistic than token-based approach

### 2. Comprehensive Error Handling
- Skips tests gracefully if backend unavailable
- Skips tests if authentication fails
- Provides clear error messages for debugging

### 3. Cleanup in Finally Blocks
- Always attempts to delete test trips
- Prevents database pollution from failed tests
- Ignores cleanup errors (already handled in main test)

### 4. Detailed Logging
- Prints test progress to stdout
- Shows trip IDs, pause counts, pause types
- Helps diagnose test failures

### 5. Realistic Test Data
- Uses real French city names (Paris, Lyon, Marseille, etc.)
- Uses realistic durations (2-7 hours)
- Uses approximate realistic distances

## Bug Confirmation

This test successfully encodes the bug condition:

**Bug**: `TrajetServiceImpl.createTrajet()` does NOT call `pauseReglementaireService.genererPauses(trajetId)` after saving a new trip.

**Evidence**: 
- Empty pauses array after trip creation
- Missing log confirmation "[TRAJET-CREATE] Pauses réglementaires générées automatiquement"
- Pauses only appear after clicking "Démarrer" button

**User Impact**:
- Users create trips but see no pause markers on map
- Users must remember to click "Démarrer" to see pauses
- Causes confusion and poor UX

## Next Steps

1. **Run Test**: Execute with valid credentials to confirm bug
2. **Document Results**: Capture test output showing failure
3. **Implement Fix**: Add `genererPauses()` call in `createTrajet()`
4. **Re-run Test**: Verify test passes after fix
5. **Update Status**: Mark task as validated when test passes

## Notes

- Test is EXPECTED TO FAIL on unfixed code - this is correct behavior
- Test failure CONFIRMS the bug exists (not a test bug)
- Test will pass automatically after implementing the fix
- No test modifications needed - test encodes expected behavior
