import unittest
import json
import os
from app import app, db, Exercise, WorkoutLog

class WorkoutAppTestCase(unittest.TestCase):
    def setUp(self):
        # Configure the app for testing
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_workout.db'

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

            db.session.commit()

        # Create a test client
        self.client = app.test_client()

    def tearDown(self):
        # Remove the test database
        with app.app_context():
            db.session.remove()
            db.drop_all()

        # Delete the test database file
        if os.path.exists('test_workout.db'):
            os.remove('test_workout.db')

    def test_index_route(self):
        # Test the index route
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_get_exercises(self):
        # Test the get_exercises route
        response = self.client.get('/api/exercises')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]['name'], 'Test Bench Press')
        self.assertEqual(data[1]['name'], 'Test Squat')

    def test_add_workout(self):
        # Test the add_workout route
        with app.app_context():
            exercise = Exercise.query.first()

        workout_data = {
            'exercise_id': exercise.id,
            'weight': 100.5,
            'reps': 10
        }

        response = self.client.post(
            '/api/workouts',
            data=json.dumps(workout_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 201)

        data = json.loads(response.data)
        self.assertEqual(data['exercise_id'], exercise.id)
        self.assertEqual(data['weight'], 100.5)
        self.assertEqual(data['reps'], 10)

    def test_get_workouts(self):
        # Add a workout
        with app.app_context():
            exercise = Exercise.query.first()
            workout = WorkoutLog(exercise_id=exercise.id, weight=100.5, reps=10)
            db.session.add(workout)
            db.session.commit()

        # Test the get_workouts route
        response = self.client.get('/api/workouts')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['exercise_id'], exercise.id)
        self.assertEqual(data[0]['weight'], 100.5)
        self.assertEqual(data[0]['reps'], 10)

if __name__ == '__main__':
    unittest.main()
