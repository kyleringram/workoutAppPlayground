# This file has been deprecated and is no longer needed.
# 
# Database initialization is now handled in two ways:
# 1. Automatically when running the application using `run.py`
#    (see the `init_db_if_needed()` function in run.py)
# 
# 2. Manually using the Flask CLI command:
#    flask --app app init-db
#    (see the `init_db()` function in app.py)
#
# This file is kept as a placeholder to avoid breaking any existing scripts
# that might depend on it, but it simply imports and calls the init_db function
# from app.py.

from app import app, db, Exercise

# Run the database initialization directly
if __name__ == '__main__':
    print("Running database initialization from init_db.py (deprecated)...")
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created.")

        # Check if exercises already exist
        if Exercise.query.count() == 0:
            print("No exercises found. Adding sample exercises...")
            # Add sample exercises
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
            print('Database already contains exercises. No changes made.')

    print("Note: This script is deprecated. Please use 'flask --app app init-db' or 'python run.py' instead.")
