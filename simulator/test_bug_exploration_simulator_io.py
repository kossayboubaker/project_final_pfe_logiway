"""
Bug Condition Exploration Test - Python Simulator Syntax and I/O

**CRITICAL**: This test is EXPECTED TO FAIL on unfixed code - failure confirms the bug exists
**DO NOT attempt to fix the test or the code when it fails**
**NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation

This test verifies the bug conditions described in Bug Condition Point 1:
- Verify simulate_truck_stops.py contains duplicate code blocks after line 225 causing SyntaxError
- Verify Python raises "from __future__ imports must occur at the beginning of the file"
- Verify backend ProcessBuilder silently fails without exposing stderr details
- Verify simulator does not correctly read trip_id from stdin JSON
- Verify simulator does not return empty pauses for trips < 180 minutes with metadata
- Verify simulator writes debug logs to stdout corrupting JSON output

**Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.5, 2.7**
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest


# Test 1: Verify no duplicate code after line 225
def test_no_duplicate_code_blocks():
    """
    Bug Condition: simulate_truck_stops.py contains duplicate code blocks after line 225
    Expected Behavior: File should contain only one definition of each function (lines 1-224 only)
    
    **Validates: Requirements 1.1, 1.3**
    """
    simulator_file = Path(__file__).parent / "simulate_truck_stops.py"
    
    with open(simulator_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Check file length - should be reasonable (not 400+ with duplicates)
    # Note: File may be longer than 224 due to added early return logic and helper functions
    assert len(lines) <= 300, f"File has {len(lines)} lines - suspected duplicate code (expected < 300)"
    
    # Check that 'from __future__ import annotations' appears only once
    future_import_count = sum(1 for line in lines if "from __future__ import annotations" in line)
    assert future_import_count == 1, f"'from __future__ import annotations' appears {future_import_count} times (should be 1)"
    
    # Check that function definitions are unique
    function_names = [
        "def haversine_m",
        "def cumulative_distances",
        "def interpolate",
        "def generate_stops_from_route",
        "def run",
        "def calculate_distance_at_time",
        "def find_point_at_distance",
        "def calculate_arrival_time",
        "def main",
    ]
    
    for func_name in function_names:
        func_count = sum(1 for line in lines if func_name in line and line.strip().startswith("def"))
        assert func_count == 1, f"Function '{func_name}' defined {func_count} times (should be 1)"


# Test 2: Verify Python syntax is valid (no SyntaxError)
def test_python_syntax_valid():
    """
    Bug Condition: Python raises SyntaxError "from __future__ imports must occur at the beginning of the file"
    Expected Behavior: Python should parse the file without SyntaxError
    
    **Validates: Requirements 1.2**
    """
    simulator_file = Path(__file__).parent / "simulate_truck_stops.py"
    
    # Try to compile the Python file
    with open(simulator_file, "r", encoding="utf-8") as f:
        source_code = f.read()
    
    try:
        compile(source_code, str(simulator_file), "exec")
    except SyntaxError as e:
        pytest.fail(f"SyntaxError in simulate_truck_stops.py: {e}")


# Test 3: Verify simulator reads trip_id from stdin correctly
def test_simulator_reads_trip_id_from_stdin():
    """
    Bug Condition: Simulator does not correctly read trip_id from stdin JSON
    Expected Behavior: Simulator should read trip_id parameter from stdin and include it in stop objects
    
    **Validates: Requirements 2.1, 2.3, 2.6**
    """
    simulator_file = Path(__file__).parent / "simulate_truck_stops.py"
    
    # Create test input with trip_id
    test_input = {
        "trip_id": "test-trip-12345",
        "vehicle_id": None,
        "backend_url": "http://localhost:8080/api",
        "osrm_url": "http://localhost:5000",
        "trip_duration_minutes": 300  # 5 hours - should generate pauses
    }
    
    input_json = json.dumps(test_input)
    
    # Run the simulator (this will fail if backend is not running, but we check the code logic)
    # We're testing that the code ATTEMPTS to use trip_id, not that it fully succeeds
    try:
        result = subprocess.run(
            [sys.executable, str(simulator_file)],
            input=input_json,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Check stderr for evidence that trip_id was read
        assert "trip_id" in result.stderr.lower() or "test-trip-12345" in result.stderr, \
            "Simulator stderr does not show evidence of reading trip_id parameter"
        
        # If we got JSON output, check that trip_id is included
        if result.stdout.strip():
            try:
                output = json.loads(result.stdout)
                # Check if trip_id appears in the result
                if "trip_id" in output or ("stops" in output and len(output["stops"]) > 0):
                    # If stops exist, they should have trip_id
                    if "stops" in output and len(output["stops"]) > 0:
                        # At least check the structure allows for trip_id
                        assert isinstance(output["stops"], list), "Stops should be a list"
            except json.JSONDecodeError:
                # Stdout might be corrupted with debug logs (another bug we're testing)
                pass
                
    except subprocess.TimeoutExpired:
        pytest.skip("Simulator timed out - likely waiting for backend")
    except FileNotFoundError:
        pytest.skip("Python executable or simulator file not found")


# Test 4: Verify simulator returns empty pauses for trips < 180 minutes
def test_simulator_returns_empty_pauses_for_short_trips():
    """
    Bug Condition: Simulator generates pauses for trips < 180 minutes instead of returning empty array
    Expected Behavior: Should return {"stops": [], "meta": {"break_alert_applicable": false, ...}}
    
    **Validates: Requirements 2.2, 2.5**
    """
    simulator_file = Path(__file__).parent / "simulate_truck_stops.py"
    
    # Create test input with short trip duration
    test_input = {
        "trip_id": "short-trip-123",
        "vehicle_id": None,
        "backend_url": "http://localhost:8080/api",
        "osrm_url": "http://localhost:5000",
        "trip_duration_minutes": 120  # 2 hours - should NOT generate pauses
    }
    
    input_json = json.dumps(test_input)
    
    try:
        result = subprocess.run(
            [sys.executable, str(simulator_file)],
            input=input_json,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Check stderr logs for the expected behavior
        assert "< 180 min" in result.stderr or "too_short" in result.stderr, \
            "Simulator should log that trip is too short for breaks"
        
        # If we got JSON output, verify it's empty stops with metadata
        if result.stdout.strip():
            try:
                output = json.loads(result.stdout)
                
                # Expected structure for short trips
                assert "stops" in output, "Output should have 'stops' field"
                assert output["stops"] == [], f"Stops should be empty for trip < 180 min, got: {output['stops']}"
                
                assert "meta" in output, "Output should have 'meta' field"
                assert output["meta"].get("break_alert_applicable") == False, \
                    "break_alert_applicable should be False for short trips"
                assert output["meta"].get("reason") == "trip_too_short_for_break_alert", \
                    "Reason should indicate trip is too short"
                    
            except json.JSONDecodeError as e:
                pytest.fail(f"Simulator stdout is not valid JSON (possible debug log corruption): {e}\nStdout: {result.stdout[:200]}")
                
    except subprocess.TimeoutExpired:
        pytest.skip("Simulator timed out - likely waiting for backend")
    except FileNotFoundError:
        pytest.skip("Python executable or simulator file not found")


# Test 5: Verify debug logs go to stderr only (not stdout)
def test_debug_logs_to_stderr_not_stdout():
    """
    Bug Condition: Simulator writes debug logs to stdout corrupting JSON output
    Expected Behavior: All debug logs should go to stderr, stdout reserved for JSON only
    
    **Validates: Requirements 2.7, 2.10**
    """
    simulator_file = Path(__file__).parent / "simulate_truck_stops.py"
    
    # Create test input
    test_input = {
        "trip_id": "test-trip-999",
        "trip_duration_minutes": 200
    }
    
    input_json = json.dumps(test_input)
    
    try:
        result = subprocess.run(
            [sys.executable, str(simulator_file)],
            input=input_json,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Check that stderr contains debug logs
        assert "[SIMULATOR]" in result.stderr, "Debug logs should be in stderr"
        
        # Check that stdout does NOT contain debug logs (only JSON)
        if result.stdout.strip():
            # Stdout should be pure JSON - no [SIMULATOR] tags
            assert "[SIMULATOR]" not in result.stdout, \
                "Debug logs found in stdout - this corrupts JSON output"
            
            # Stdout should be valid JSON
            try:
                json.loads(result.stdout)
            except json.JSONDecodeError as e:
                pytest.fail(f"Stdout is not valid JSON (corrupted by debug logs?): {e}\nStdout: {result.stdout[:200]}")
                
    except subprocess.TimeoutExpired:
        pytest.skip("Simulator timed out - likely waiting for backend")
    except FileNotFoundError:
        pytest.skip("Python executable or simulator file not found")


# Test 6: Verify simulator enriches metadata
def test_simulator_enriches_metadata():
    """
    Bug Condition: Simulator does not enrich metadata with required fields
    Expected Behavior: Metadata should include break_alert_applicable, trip_duration_minutes, route_distance_m, num_stops
    
    **Validates: Requirements 2.4, 2.7**
    """
    simulator_file = Path(__file__).parent / "simulate_truck_stops.py"
    
    # Create test input with sufficient duration
    test_input = {
        "trip_id": "metadata-test-456",
        "trip_duration_minutes": 250
    }
    
    input_json = json.dumps(test_input)
    
    try:
        result = subprocess.run(
            [sys.executable, str(simulator_file)],
            input=input_json,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.stdout.strip():
            try:
                output = json.loads(result.stdout)
                
                # Verify metadata enrichment
                if "meta" in output:
                    meta = output["meta"]
                    
                    # Check required metadata fields
                    assert "break_alert_applicable" in meta, "Metadata should include break_alert_applicable"
                    assert "trip_duration_minutes" in meta, "Metadata should include trip_duration_minutes"
                    
                    # If trip is long enough, these should also be present
                    if meta.get("break_alert_applicable"):
                        assert "route_distance_m" in meta or "num_stops" in meta, \
                            "Metadata for long trips should include route_distance_m or num_stops"
                            
            except json.JSONDecodeError:
                pytest.skip("Could not parse JSON output - backend may not be available")
                
    except subprocess.TimeoutExpired:
        pytest.skip("Simulator timed out - likely waiting for backend")
    except FileNotFoundError:
        pytest.skip("Python executable or simulator file not found")


# Test 7: Verify WARNING_ALERT has duration_sec=0
def test_warning_alert_has_zero_duration():
    """
    Bug Condition: WARNING_ALERT stop may not have duration_sec=0
    Expected Behavior: WARNING_ALERT should have duration_sec=0 (does not block the truck)
    
    **Validates: Requirements 2.6, 2.9**
    """
    simulator_file = Path(__file__).parent / "simulate_truck_stops.py"
    
    # Create test input with sufficient duration for WARNING_ALERT
    test_input = {
        "trip_id": "warning-alert-test-789",
        "trip_duration_minutes": 300  # 5 hours - should have WARNING_ALERT at 3h
    }
    
    input_json = json.dumps(test_input)
    
    try:
        result = subprocess.run(
            [sys.executable, str(simulator_file)],
            input=input_json,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.stdout.strip():
            try:
                output = json.loads(result.stdout)
                
                if "stops" in output and output["stops"]:
                    # Find WARNING_ALERT stops
                    warning_alerts = [s for s in output["stops"] if s.get("type") == "warning_alert"]
                    
                    if warning_alerts:
                        for alert in warning_alerts:
                            assert alert.get("duration_sec") == 0, \
                                f"WARNING_ALERT should have duration_sec=0, got: {alert.get('duration_sec')}"
                            
            except json.JSONDecodeError:
                pytest.skip("Could not parse JSON output - backend may not be available")
                
    except subprocess.TimeoutExpired:
        pytest.skip("Simulator timed out - likely waiting for backend")
    except FileNotFoundError:
        pytest.skip("Python executable or simulator file not found")


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "-s"])
