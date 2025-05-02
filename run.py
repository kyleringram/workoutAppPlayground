from app import app, db, Exercise
import os
import argparse

def init_db_if_needed():
    # Check if database file exists
    if not os.path.exists('instance/workout.db'):
        print("Database not found. Initializing database...")
        with app.app_context():
            # Create all tables
            db.create_all()

            # Add sample exercises if the database is empty
            if Exercise.query.count() == 0:
                sample_exercises = [
                    Exercise(name='Bench Press', muscle_group='Chest', description='Lie on a bench and press the weight upward', image_path='/static/images/bench_press.svg'),
                    Exercise(name='Squat', muscle_group='Legs', description='Bend your knees and lower your body', image_path='/static/images/squat.svg'),
                    Exercise(name='Deadlift', muscle_group='Back', description='Lift the weight from the ground to hip level', image_path='/static/images/deadlift.svg'),
                    Exercise(name='Pull-up', muscle_group='Back', description='Pull your body up to a bar', image_path='/static/images/pullup.svg'),
                    Exercise(name='Bicep Curl', muscle_group='Arms', description='Curl the weight towards your shoulder', image_path='/static/images/bicep_curl.svg')
                ]

                for exercise in sample_exercises:
                    db.session.add(exercise)

                db.session.commit()
                print('Database initialized with sample exercises.')
    else:
        print("Database already exists.")

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run the Workout Tracker App')
    parser.add_argument('--port', type=int, default=5001, help='Port to run the server on (default: 5001)')
    args = parser.parse_args()

    # Get port from command line arguments
    port = args.port

    # Initialize database if needed
    init_db_if_needed()

    # Print server information
    print(f"Starting server at http://127.0.0.1:{port}/")

    # Run the Flask application
    app.run(debug=True, port=port)
