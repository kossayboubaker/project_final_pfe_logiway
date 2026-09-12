"""
Bug Condition Exploration Test - Missing Pause Generation on Trip Creation

This test verifies that pauses are NOT automatically generated when createTrajet() is called.
EXPECTED TO FAIL on unfixed code (proving the bug exists).

Validates: Requirements 3.1, 3.2, 3.3
"""

import pytest
import requests
import json
from pathlib import Path

# Backend configuration
BACKEND_URL = "http://localhost:8080"
API_BASE = f"{BACKEND_URL}/api"


def test_pauses_not_generated_on_trip_creation():
    """
    Bug Condition: TrajetServiceImpl.createTrajet() does NOT call genererPauses() after save
    Expected Behavior: Pauses should be generated immediately on trip creation for trips >= 180 minutes
    
    **CRITICAL**: This test is EXPECTED TO FAIL on unfixed code
    
    **Validates: Requirements 3.1, 3.2, 3.3**
    """
    
    # Test data: Trip with 300 minutes duration (5 hours) - requires pauses
    trip_data = {
        "pointDepart": "Paris, France",
        "destination": "Lyon, France",
        "latitudeDepart": 48.8566,
        "longitudeDepart": 2.3522,
        "latitudeArrivee": 45.7640,
        "longitudeArrivee": 4.8357,
        "dureeEstimeeMinutes": 300,  # 5 hours - requires regulatory breaks
        "distanceKm": 470,
        "vehiculeId": 1,
        "chauffeurId": 1
    }
    
    print("\n" + "="*80)
    print("Bug Condition Exploration: Missing Pause Generation on Trip Creation")
    print("="*80)
    
    try:
        # Step 1: Create trip via API
        print(f"\n1. Creating trip with duration {trip_data['dureeEstimeeMinutes']} minutes...")
        response = requests.post(
            f"{API_BASE}/trajets",
            json=trip_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 401:
            pytest.skip("Backend requires authentication - cannot test without credentials")
        
        assert response.status_code in [200, 201], \
            f"Trip creation failed with status {response.status_code}: {response.text}"
        
        trip = response.json()
        trip_id = trip.get("id")
        print(f"   ✓ Trip created with ID: {trip_id}")
        print(f"   ✓ Duration: {trip.get('dureeEstimeeMinutes')} minutes")
        print(f"   ✓ Status: {trip.get('statut')}")
        
        # Step 2: Query pauses immediately after creation (before "Démarrer")
        print(f"\n2. Querying pauses for trip {trip_id} (immediately after creation)...")
        pauses_response = requests.get(
            f"{API_BASE}/trajets/{trip_id}/pauses",
            timeout=10
        )
        
        assert pauses_response.status_code == 200, \
            f"Failed to query pauses: {pauses_response.status_code}"
        
        pauses = pauses_response.json()
        print(f"   Response: {json.dumps(pauses, indent=2)}")
        
        # Step 3: Verify pauses were NOT generated (demonstrates bug)
        print(f"\n3. Verifying bug condition...")
        
        if isinstance(pauses, list) and len(pauses) == 0:
            print("   ✓ BUG CONFIRMED: Pauses array is EMPTY")
            print("   ✓ Expected behavior: Pauses should be auto-generated for 300-minute trip")
            print("   ✓ Actual behavior: No pauses generated until 'Démarrer' is clicked")
            
            # This is the expected failure - the bug exists
            pytest.fail(
                f"Bug condition confirmed: Trip {trip_id} with duration {trip_data['dureeEstimeeMinutes']} "
                f"minutes has NO pauses after creation. Expected automatic pause generation."
            )
        else:
            print(f"   ✗ UNEXPECTED: Found {len(pauses)} pauses")
            print("   ✗ Bug may already be fixed, or test logic is incorrect")
            pytest.fail(f"Test expected empty pauses array but found {len(pauses)} pauses")
        
    except requests.exceptions.ConnectionError:
        pytest.skip("Backend not running - cannot execute integration test")
    except requests.exceptions.Timeout:
        pytest.skip("Backend timeout - cannot complete test")


def test_trip_creation_logs_missing():
    """
    Verify that logs do NOT contain pause generation confirmation on trip creation
    
    **CRITICAL**: This test is EXPECTED TO FAIL on unfixed code
    
    **Validates: Requirements 3.2**
    """
    
    print("\n" + "="*80)
    print("Bug Condition: Missing [TRAJET-CREATE] Pause Generation Logs")
    print("="*80)
    
    # Check if backend logs exist
    backend_log_paths = [
        Path("backend/logs/application.log"),
        Path("backend/target/logs/application.log"),
        Path("logs/application.log")
    ]
    
    log_file = None
    for path in backend_log_paths:
        if path.exists():
            log_file = path
            break
    
    if not log_file:
        pytest.skip("Backend log file not found - cannot verify logging behavior")
    
    print(f"\n1. Checking log file: {log_file}")
    
    with open(log_file, "r", encoding="utf-8") as f:
        log_content = f.read()
    
    # Search for pause generation logs on trip creation
    create_pause_logs = "[TRAJET-CREATE] Pauses réglementaires générées automatiquement" in log_content
    
    print(f"\n2. Searching for automatic pause generation logs...")
    
    if not create_pause_logs:
        print("   ✓ BUG CONFIRMED: No '[TRAJET-CREATE]' pause generation logs found")
        print("   ✓ Expected: Logs should contain confirmation of automatic pause generation")
        print("   ✓ Actual: createTrajet() does not call genererPauses()")
        
        pytest.fail(
            "Bug condition confirmed: Backend logs do NOT contain '[TRAJET-CREATE] Pauses "
            "réglementaires générées automatiquement'. TrajetServiceImpl.createTrajet() is "
            "not calling pauseReglementaireService.genererPauses()."
        )
    else:
        print("   ✗ UNEXPECTED: Found pause generation logs")
        print("   ✗ Bug may already be fixed")
        pytest.fail("Expected missing logs but found pause generation confirmation")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
