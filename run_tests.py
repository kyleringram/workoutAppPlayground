import unittest
from test_app import WorkoutAppTestCase

if __name__ == '__main__':
    # Create a test suite
    test_suite = unittest.TestLoader().loadTestsFromTestCase(WorkoutAppTestCase)
    
    # Run the tests
    print("Running Workout App tests...")
    unittest.TextTestRunner(verbosity=2).run(test_suite)