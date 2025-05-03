import unittest
import json
import os
from app import app, db, Exercise, WorkoutLog, User

class WorkoutAppTestCase(unittest.TestCase):
    def setUp(self):
        # Configure the app for testing
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_workout.db'
        app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing

        # Create the test database and tables
        with app.app_context():
            db.create_all()

            # Add sample exercises
            sample_exercises = [
                Exercise(name='Test Bench Press', muscle_group='Chest', description='Test description', image_path='/static/images/bench_press.svg'),
                Exercise(name='Test Squat', muscle_group='Legs', description='Test description', image_path='/static/images/squat.svg')
            ]

            for exercise in sample_exercises:
                db.session.add(exercise)

            # Create test users
            test_user = User(username='testuser', email='test@example.com')
            test_user.set_password('testpassword')

            test_user2 = User(username='testuser2', email='test2@example.com')
            test_user2.set_password('testpassword')

            db.session.add(test_user)
            db.session.add(test_user2)

            db.session.commit()

        # Create a test client
        self.client = app.test_client()

        # Store test user IDs for later use
        with app.app_context():
            self.test_user_id = User.query.filter_by(username='testuser').first().id
            self.test_user2_id = User.query.filter_by(username='testuser2').first().id

    def tearDown(self):
        # Remove the test database
        with app.app_context():
            db.session.remove()
            db.drop_all()

        # Delete the test database file
        if os.path.exists('test_workout.db'):
            os.remove('test_workout.db')

    def login(self, username, password):
        return self.client.post('/login', data=dict(
            username=username,
            password=password
        ), follow_redirects=True)

    def logout(self):
        return self.client.get('/logout', follow_redirects=True)

    def test_register(self):
        # Test user registration
        response = self.client.post('/register', data=dict(
            username='newuser',
            email='new@example.com',
            password='newpassword',
            confirm_password='newpassword'
        ), follow_redirects=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Registration successful', response.data)

        # Verify user was created in database
        with app.app_context():
            user = User.query.filter_by(username='newuser').first()
            self.assertIsNotNone(user)
            self.assertEqual(user.email, 'new@example.com')

    def test_login_logout(self):
        # Test login
        response = self.login('testuser', 'testpassword')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Welcome back', response.data)

        # Test logout
        response = self.logout()
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'You have been logged out', response.data)

    def test_login_invalid_credentials(self):
        # Test login with invalid credentials
        response = self.login('testuser', 'wrongpassword')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid username or password', response.data)

    def test_access_control(self):
        # Test accessing protected route without login
        response = self.client.get('/', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Login', response.data)  # Should redirect to login page

        # Login and try again
        with app.app_context():
            # Make sure the database is properly set up
            db.create_all()

        self.login('testuser', 'testpassword')
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Workout Tracker', response.data)  # Should show main page

    def test_index_route_authenticated(self):
        # Login first
        self.login('testuser', 'testpassword')

        # Test the index route
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Workout Tracker', response.data)
        self.assertIn(b'Welcome, testuser', response.data)

    def test_add_workout_authenticated(self):
        # Login first
        self.login('testuser', 'testpassword')

        # Select an exercise
        with app.app_context():
            exercise = Exercise.query.first()

        # Set the selected exercise in the session
        with self.client.session_transaction() as session:
            session['selected_exercise_id'] = exercise.id

        # Test adding a workout
        response = self.client.post('/add_workout', data=dict(
            weight=100.5,
            reps=10
        ), follow_redirects=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Workout saved successfully', response.data)

        # Verify workout was added to database
        with app.app_context():
            workout = WorkoutLog.query.filter_by(user_id=self.test_user_id).first()
            self.assertIsNotNone(workout)
            self.assertEqual(workout.exercise_id, exercise.id)
            self.assertEqual(workout.weight, 100.5)
            self.assertEqual(workout.reps, 10)

    def test_user_data_isolation(self):
        # Login as first user
        self.login('testuser', 'testpassword')

        # Add a workout for first user
        with app.app_context():
            exercise = Exercise.query.first()

        # Set the selected exercise in the session
        with self.client.session_transaction() as session:
            session['selected_exercise_id'] = exercise.id

        self.client.post('/add_workout', data=dict(
            weight=100.5,
            reps=10
        ), follow_redirects=True)

        # Logout and login as second user
        self.logout()
        self.login('testuser2', 'testpassword')

        # Get the index page which shows workouts
        response = self.client.get('/')

        # Second user should not see first user's workout
        self.assertNotIn(b'100.5', response.data)

        # Add a workout for second user
        with self.client.session_transaction() as session:
            session['selected_exercise_id'] = exercise.id

        self.client.post('/add_workout', data=dict(
            weight=200.5,
            reps=5
        ), follow_redirects=True)

        # Get the index page again
        response = self.client.get('/')

        # Second user should see their own workout but not first user's
        self.assertIn(b'200.5', response.data)
        self.assertNotIn(b'100.5', response.data)

        # Verify in database that each user has their own workout
        with app.app_context():
            user1_workout = WorkoutLog.query.filter_by(user_id=self.test_user_id).first()
            user2_workout = WorkoutLog.query.filter_by(user_id=self.test_user2_id).first()

            self.assertEqual(user1_workout.weight, 100.5)
            self.assertEqual(user1_workout.reps, 10)

            self.assertEqual(user2_workout.weight, 200.5)
            self.assertEqual(user2_workout.reps, 5)

if __name__ == '__main__':
    unittest.main()
