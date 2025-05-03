"""
Workout Tracker App - Python + JavaScript Integration
----------------------------------------------------
This is the backend API for the Workout Tracker application. It provides:
1. Database models for users, exercises, and workout logs
2. Authentication and authorization system
3. RESTful API endpoints for the JavaScript frontend
4. HTML template rendering

The application uses Flask as the web framework and SQLAlchemy for ORM.
"""

# Import necessary libraries
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize Flask application
app = Flask(__name__)

# Configure database connection
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///workout.db'  # SQLite database file location
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking to improve performance
app.config['SECRET_KEY'] = secrets.token_hex(16)  # Generate a secure random key for session encryption

# Initialize SQLAlchemy database instance
db = SQLAlchemy(app)

# Push application context
# This makes the application context available to the current thread
# Necessary for database operations outside of request context
app.app_context().push()

# Database Models
# These SQLAlchemy models define the database structure and relationships

class User(db.Model):
    """
    User model for authentication and authorization.

    Each user has their own set of workout logs, allowing for personalized tracking.
    Passwords are stored as secure hashes, not plain text.
    """
    # Primary key and basic user information
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)  # Username must be unique
    email = db.Column(db.String(100), unique=True, nullable=False)    # Email must be unique
    password_hash = db.Column(db.String(200), nullable=False)         # Stores hashed password, not plain text
    created_at = db.Column(db.DateTime, default=datetime.utcnow)      # Timestamp when user was created

    # Relationship with workout logs
    # One-to-many: one user can have many workout logs
    # cascade="all, delete-orphan" means if a user is deleted, all their workout logs are deleted too
    workout_logs = db.relationship('WorkoutLog', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        """
        Hash and set the user's password.

        Args:
            password (str): Plain text password to be hashed and stored
        """
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """
        Verify a password against the stored hash.

        Args:
            password (str): Plain text password to check

        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """
        Convert user object to dictionary for JSON serialization.
        Note: password_hash is intentionally excluded for security.

        Returns:
            dict: User data in dictionary format
        """
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


class Exercise(db.Model):
    """
    Exercise model to store different types of exercises.

    Exercises are shared among all users - they are not user-specific.
    Each exercise has a name, muscle group, description, and image path.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)       # Name of the exercise
    muscle_group = db.Column(db.String(50), nullable=False) # Primary muscle group targeted
    description = db.Column(db.Text)                       # Detailed description of the exercise
    image_path = db.Column(db.String(200))                 # Path to the exercise image (SVG)

    def to_dict(self):
        """
        Convert exercise object to dictionary for JSON serialization.

        Returns:
            dict: Exercise data in dictionary format
        """
        return {
            'id': self.id,
            'name': self.name,
            'muscle_group': self.muscle_group,
            'description': self.description,
            'image_path': self.image_path
        }


class WorkoutLog(db.Model):
    """
    WorkoutLog model to store individual workout entries.

    Each log entry represents one exercise performed by a user with specific weight and reps.
    Logs are associated with both a user and an exercise.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Foreign key to User
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercise.id'), nullable=False)  # Foreign key to Exercise
    weight = db.Column(db.Float, nullable=False)  # Weight used (in lbs)
    reps = db.Column(db.Integer, nullable=False)  # Number of repetitions performed
    date = db.Column(db.DateTime, default=datetime.utcnow)  # When the workout was performed

    # Relationship with Exercise model
    # This allows easy access to exercise details from a workout log
    exercise = db.relationship('Exercise', backref=db.backref('logs', lazy=True))

    def to_dict(self):
        """
        Convert workout log object to dictionary for JSON serialization.
        Includes the exercise name for convenience in the frontend.

        Returns:
            dict: Workout log data in dictionary format
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'exercise_id': self.exercise_id,
            'exercise_name': self.exercise.name,  # Include exercise name for frontend display
            'weight': self.weight,
            'reps': self.reps,
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S')
        }

# Authentication helper function
def login_required(f):
    """
    Decorator to require login for protected routes.

    This decorator checks if the user is logged in (has a user_id in session)
    before allowing access to the decorated route. If not logged in, it returns
    a 401 Unauthorized response, which the frontend can handle appropriately.

    Args:
        f (function): The route function to be decorated

    Returns:
        function: The decorated function that checks authentication
    """
    def decorated_function(*args, **kwargs):
        # Check if user_id exists in the session
        if 'user_id' not in session:
            # If not authenticated, return 401 Unauthorized status code
            # The frontend JavaScript will handle this response
            return jsonify({'error': 'Authentication required'}), 401
        # If authenticated, proceed to the original route function
        return f(*args, **kwargs)

    # Preserve the original function name for Flask's routing
    decorated_function.__name__ = f.__name__
    return decorated_function


# Routes
# These routes handle page rendering and navigation

@app.route('/')
def index():
    """
    Render the main application page.

    This is the entry point of the application where users can:
    - View and select exercises
    - Record workouts
    - View workout history

    The actual content displayed depends on the user's authentication status,
    which is handled by the JavaScript frontend.

    Returns:
        rendered template: The index.html template
    """
    return render_template('index.html')


@app.route('/login')
def login_page():
    """
    Render the login page.

    If the user is already logged in (has a user_id in session),
    redirect them to the main page instead of showing the login form.

    Returns:
        rendered template or redirect: The login.html template or redirect to index
    """
    if 'user_id' in session:
        # If already logged in, redirect to main page
        return redirect(url_for('index'))
    # Otherwise, show the login page
    return render_template('login.html')


@app.route('/register')
def register_page():
    """
    Render the registration page.

    If the user is already logged in (has a user_id in session),
    redirect them to the main page instead of showing the registration form.

    Returns:
        rendered template or redirect: The register.html template or redirect to index
    """
    if 'user_id' in session:
        # If already logged in, redirect to main page
        return redirect(url_for('index'))
    # Otherwise, show the registration page
    return render_template('register.html')

# Authentication API Endpoints
# These endpoints handle user registration, login, logout, and session management

@app.route('/api/auth/register', methods=['POST'])
def register():
    """
    Register a new user.

    This endpoint:
    1. Validates the registration data
    2. Checks for existing username/email
    3. Creates a new user with a hashed password
    4. Logs the user in automatically

    Expected JSON payload:
    {
        "username": "string",
        "email": "string",
        "password": "string"
    }

    Returns:
        JSON response: Success message and user data, or error message
        Status code: 201 Created on success, 400 Bad Request on validation error,
                    500 Internal Server Error on other errors
    """
    try:
        # Get JSON data from request body
        data = request.json

        # Validate required fields
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'All fields are required'}), 400

        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400

        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400

        # Create new user object
        user = User(
            username=data['username'],
            email=data['email']
        )
        # Hash and set the password
        user.set_password(data['password'])

        # Save to database
        db.session.add(user)
        db.session.commit()

        # Log the user in by setting session variables
        # This creates a server-side session that persists across requests
        session['user_id'] = user.id
        session['username'] = user.username

        # Return success response with user data
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict()  # Convert user object to dictionary for JSON response
        }), 201  # 201 Created status code

    except Exception as e:
        # Handle any unexpected errors
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Log in an existing user.

    This endpoint:
    1. Validates the login credentials
    2. Checks username and password
    3. Creates a session for the user if valid

    Expected JSON payload:
    {
        "username": "string",
        "password": "string"
    }

    Returns:
        JSON response: Success message and user data, or error message
        Status code: 200 OK on success, 400 Bad Request on validation error,
                    401 Unauthorized for invalid credentials, 500 Internal Server Error on other errors
    """
    try:
        # Get JSON data from request body
        data = request.json

        # Validate required fields
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400

        # Find user by username
        user = User.query.filter_by(username=data['username']).first()

        # Check if user exists and password is correct
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401

        # Log the user in by setting session variables
        session['user_id'] = user.id
        session['username'] = user.username

        # Return success response with user data
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()  # Convert user object to dictionary for JSON response
        }), 200  # 200 OK status code

    except Exception as e:
        # Handle any unexpected errors
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """
    Log out the current user.

    This endpoint:
    1. Removes the user_id and username from the session
    2. Effectively ends the user's authenticated session

    No request body is needed.

    Returns:
        JSON response: Success message
        Status code: 200 OK
    """
    # Remove user data from session
    session.pop('user_id', None)  # None is the default value if key doesn't exist
    session.pop('username', None)

    # Return success response
    return jsonify({'message': 'Logout successful'}), 200


@app.route('/api/auth/user', methods=['GET'])
def get_current_user():
    """
    Get the current logged-in user's information.

    This endpoint:
    1. Checks if a user is logged in (has a session)
    2. Returns the user's data if authenticated

    This is used by the frontend to determine if a user is logged in
    when the page loads or refreshes.

    No request body is needed.

    Returns:
        JSON response: Authentication status and user data if authenticated
        Status code: 200 OK
    """
    # Check if user is logged in
    if 'user_id' not in session:
        # Not logged in
        return jsonify({'authenticated': False}), 200

    # Get user from database
    user = User.query.get(session['user_id'])

    # Check if user still exists in database
    if not user:
        # User was deleted or doesn't exist anymore
        # Clear the invalid session
        session.pop('user_id', None)
        session.pop('username', None)
        return jsonify({'authenticated': False}), 200

    # User is authenticated, return user data
    return jsonify({
        'authenticated': True,
        'user': user.to_dict()  # Convert user object to dictionary for JSON response
    }), 200

# Exercise and Workout API Endpoints
# These endpoints handle CRUD operations for exercises and workout logs

@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    """
    Get all exercises.

    This endpoint retrieves all exercises from the database.
    Exercises are shared among all users, so no authentication is required.

    Returns:
        JSON response: Array of exercise objects
        Status code: 200 OK
    """
    # Query all exercises from the database
    exercises = Exercise.query.all()

    # Convert each exercise object to a dictionary and return as JSON
    return jsonify([exercise.to_dict() for exercise in exercises])


@app.route('/api/exercises', methods=['POST'])
@login_required  # Only authenticated users can add exercises
def add_exercise():
    """
    Add a new exercise (requires authentication).

    This endpoint:
    1. Validates the exercise data
    2. Checks if an exercise with the same name already exists
    3. Creates an SVG image for the exercise
    4. Saves the new exercise to the database

    Expected JSON payload:
    {
        "name": "string",
        "muscle_group": "string",
        "description": "string"
    }

    Returns:
        JSON response: The created exercise data or error message
        Status code: 201 Created on success, 400 Bad Request on validation error,
                    500 Internal Server Error on other errors
    """
    try:
        # Get JSON data from request body
        data = request.json

        # Validate required fields
        if not data.get('name') or not data.get('muscle_group') or not data.get('description'):
            return jsonify({'error': 'All fields are required'}), 400

        # Check if exercise with same name already exists
        existing_exercise = Exercise.query.filter_by(name=data['name']).first()
        if existing_exercise:
            return jsonify({'error': f'An exercise named "{data["name"]}" already exists'}), 400

        # Create SVG image for the exercise
        # Convert exercise name to lowercase with underscores for the filename
        exercise_name = data['name'].lower().replace(' ', '_')

        # Generate SVG content - a simple blue rectangle with the exercise name and muscle group
        svg_content = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="blue" stroke="black" stroke-width="2"/>
    <text x="150" y="80" font-family="Arial" font-size="24" fill="white" text-anchor="middle">{data['name']}</text>
    <text x="150" y="120" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Muscle Group: {data['muscle_group']}</text>
</svg>
'''

        # Ensure the static/images directory exists
        os.makedirs('static/images', exist_ok=True)

        # Save the SVG file to the static/images directory
        svg_path = f'static/images/{exercise_name}.svg'
        with open(svg_path, 'w') as f:
            f.write(svg_content)

        # Set the image path for the exercise (as a URL path)
        image_path = f'/static/images/{exercise_name}.svg'

        # Create new exercise object
        exercise = Exercise(
            name=data['name'],
            muscle_group=data['muscle_group'],
            description=data['description'],
            image_path=image_path
        )

        # Save to database
        db.session.add(exercise)
        db.session.commit()

        # Return the created exercise as JSON
        return jsonify(exercise.to_dict()), 201  # 201 Created status code

    except Exception as e:
        # Handle any unexpected errors
        return jsonify({'error': str(e)}), 500


@app.route('/api/exercises/<int:exercise_id>', methods=['DELETE'])
@login_required  # Only authenticated users can delete exercise logs
def delete_exercise(exercise_id):
    """
    Delete workout logs for an exercise (requires authentication).

    This endpoint:
    1. Finds the specified exercise
    2. Deletes all workout logs for that exercise belonging to the current user
    3. Does NOT delete the exercise itself, as it may be used by other users

    URL parameters:
        exercise_id (int): The ID of the exercise

    Returns:
        JSON response: Success message or error message
        Status code: 200 OK on success, 404 Not Found if exercise doesn't exist,
                    500 Internal Server Error on other errors
    """
    try:
        # Find the exercise or return 404 if not found
        exercise = Exercise.query.get_or_404(exercise_id)

        # Get the current user's ID from the session
        user_id = session['user_id']

        # Find all workout logs for this exercise belonging to the current user
        workout_logs = WorkoutLog.query.filter_by(exercise_id=exercise_id, user_id=user_id).all()

        if workout_logs:
            # Delete all the user's workout logs for this exercise
            for log in workout_logs:
                db.session.delete(log)

        # Note: We don't delete the exercise itself as it might be used by other users
        # Instead, we just delete the user's workout logs for this exercise

        # Commit the changes to the database
        db.session.commit()

        # Return success message
        return jsonify({'message': f'Workout logs for "{exercise.name}" deleted successfully'}), 200

    except Exception as e:
        # Rollback the transaction in case of error
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/workouts', methods=['GET'])
@login_required  # Only authenticated users can view their workouts
def get_workouts():
    """
    Get all workouts for the current user (requires authentication).

    This endpoint:
    1. Gets the current user's ID from the session
    2. Retrieves all workout logs for that user
    3. Orders them by date (newest first)

    Returns:
        JSON response: Array of workout log objects
        Status code: 200 OK
    """
    # Get the current user's ID from the session
    user_id = session['user_id']

    # Query all workout logs for this user, ordered by date (newest first)
    workouts = WorkoutLog.query.filter_by(user_id=user_id).order_by(WorkoutLog.date.desc()).all()

    # Convert each workout log object to a dictionary and return as JSON
    return jsonify([workout.to_dict() for workout in workouts])


@app.route('/api/workouts', methods=['POST'])
@login_required  # Only authenticated users can add workouts
def add_workout():
    """
    Add a new workout for the current user (requires authentication).

    This endpoint:
    1. Gets the current user's ID from the session
    2. Validates the workout data
    3. Creates a new workout log entry

    Expected JSON payload:
    {
        "exercise_id": integer,
        "weight": number,
        "reps": integer
    }

    Returns:
        JSON response: The created workout log data or error message
        Status code: 201 Created on success, 400 Bad Request on validation error,
                    500 Internal Server Error on other errors
    """
    try:
        # Get JSON data from request body
        data = request.json

        # Get the current user's ID from the session
        user_id = session['user_id']

        # Validate required fields
        if not data.get('exercise_id') or not data.get('weight') or not data.get('reps'):
            return jsonify({'error': 'All fields are required'}), 400

        # Create new workout log object
        workout = WorkoutLog(
            user_id=user_id,  # Associate with the current user
            exercise_id=data['exercise_id'],
            weight=float(data['weight']),  # Convert to float in case it's sent as string
            reps=int(data['reps'])         # Convert to int in case it's sent as string
        )

        # Save to database
        db.session.add(workout)
        db.session.commit()

        # Return the created workout log as JSON
        return jsonify(workout.to_dict()), 201  # 201 Created status code

    except Exception as e:
        # Handle any unexpected errors
        return jsonify({'error': str(e)}), 500

# Database Initialization
@app.cli.command('init-db')
def init_db():
    """
    Initialize the database with tables and sample data.

    This function:
    1. Creates all database tables based on the defined models
    2. Adds sample exercises if none exist
    3. Adds a sample user if none exist
    4. Adds sample workout logs for the sample user

    Usage:
        flask --app api init-db
    """
    # Create all tables defined by the models
    db.create_all()

    # Add sample exercises if the database is empty
    if Exercise.query.count() == 0:
        # Define sample exercises with their details
        sample_exercises = [
            Exercise(
                name='Bench Press', 
                muscle_group='Chest', 
                description='Lie on a bench and press the weight upward', 
                image_path='/static/images/bench_press.svg'
            ),
            Exercise(
                name='Squat', 
                muscle_group='Legs', 
                description='Bend your knees and lower your body', 
                image_path='/static/images/squat.svg'
            ),
            Exercise(
                name='Deadlift', 
                muscle_group='Back', 
                description='Lift the weight from the ground to hip level', 
                image_path='/static/images/deadlift.svg'
            ),
            Exercise(
                name='Pull-up', 
                muscle_group='Back', 
                description='Pull your body up to a bar', 
                image_path='/static/images/pullup.svg'
            ),
            Exercise(
                name='Bicep Curl', 
                muscle_group='Arms', 
                description='Curl the weight towards your shoulder', 
                image_path='/static/images/bicep_curl.svg'
            )
        ]

        # Add each sample exercise to the database
        for exercise in sample_exercises:
            db.session.add(exercise)

        # Commit the changes
        db.session.commit()
        print('Database initialized with sample exercises.')

    # Add a sample user if the database is empty
    if User.query.count() == 0:
        # Create a sample user with demo credentials
        sample_user = User(
            username='demo',
            email='demo@example.com'
        )
        # Set the password (will be hashed)
        sample_user.set_password('password')

        # Add the user to the database
        db.session.add(sample_user)
        db.session.commit()

        # Add sample workouts for the sample user
        if WorkoutLog.query.count() == 0:
            # Get the first exercise (Bench Press)
            bench_press = Exercise.query.filter_by(name='Bench Press').first()
            if bench_press:
                # Create sample workout logs
                sample_workouts = [
                    WorkoutLog(
                        user_id=sample_user.id, 
                        exercise_id=bench_press.id, 
                        weight=135, 
                        reps=10, 
                        date=datetime.utcnow()
                    ),
                    WorkoutLog(
                        user_id=sample_user.id, 
                        exercise_id=bench_press.id, 
                        weight=145, 
                        reps=8, 
                        date=datetime.utcnow()
                    )
                ]

                # Add each sample workout to the database
                for workout in sample_workouts:
                    db.session.add(workout)

                # Commit the changes
                db.session.commit()
                print('Database initialized with sample user and workouts.')


# Run the application when executed directly
if __name__ == '__main__':
    # Start the Flask development server
    # debug=True enables:
    # - Automatic reloading when code changes
    # - Detailed error pages
    # - Debug console for errors
    app.run(debug=True)
