from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///workout.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'workout_app_secret_key'  # Added for flash messages and session
db = SQLAlchemy(app)

# Push application context
app.app_context().push()

# Database Models
class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    muscle_group = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    image_path = db.Column(db.String(200))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'muscle_group': self.muscle_group,
            'description': self.description,
            'image_path': self.image_path
        }

class WorkoutLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercise.id'), nullable=False)
    weight = db.Column(db.Float, nullable=False)
    reps = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

    exercise = db.relationship('Exercise', backref=db.backref('logs', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'exercise_id': self.exercise_id,
            'exercise_name': self.exercise.name,
            'weight': self.weight,
            'reps': self.reps,
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S')
        }

# Routes
@app.route('/')
def index():
    exercises = Exercise.query.all()
    workouts = WorkoutLog.query.order_by(WorkoutLog.date.desc()).all()
    selected_exercise = None

    if 'selected_exercise_id' in session and session['selected_exercise_id']:
        selected_exercise = Exercise.query.get(session['selected_exercise_id'])

    return render_template('index.html', 
                          exercises=exercises, 
                          workouts=workouts, 
                          selected_exercise=selected_exercise)

@app.route('/select_exercise/<int:exercise_id>')
def select_exercise(exercise_id):
    exercise = Exercise.query.get_or_404(exercise_id)
    session['selected_exercise_id'] = exercise.id
    return redirect(url_for('index'))

@app.route('/add_workout', methods=['POST'])
def add_workout():
    if 'selected_exercise_id' not in session or not session['selected_exercise_id']:
        flash('Please select an exercise first.')
        return redirect(url_for('index'))

    try:
        workout = WorkoutLog(
            exercise_id=session['selected_exercise_id'],
            weight=float(request.form['weight']),
            reps=int(request.form['reps'])
        )
        db.session.add(workout)
        db.session.commit()

        # Clear the selected exercise
        session.pop('selected_exercise_id', None)

        flash('Workout saved successfully!')
    except Exception as e:
        flash(f'Error saving workout: {str(e)}')

    return redirect(url_for('index'))

# Clear selected exercise
@app.route('/clear_selection')
def clear_selection():
    session.pop('selected_exercise_id', None)
    return redirect(url_for('index'))

# Delete exercise
@app.route('/delete_exercise/<int:exercise_id>', methods=['POST'])
def delete_exercise(exercise_id):
    try:
        exercise = Exercise.query.get_or_404(exercise_id)

        # Check if there are any workout logs associated with this exercise
        workout_logs = WorkoutLog.query.filter_by(exercise_id=exercise_id).all()
        if workout_logs:
            # Delete associated workout logs first
            for log in workout_logs:
                db.session.delete(log)

        # Delete the exercise
        db.session.delete(exercise)
        db.session.commit()

        # Clear selected exercise if it was the one deleted
        if 'selected_exercise_id' in session and session['selected_exercise_id'] == exercise_id:
            session.pop('selected_exercise_id', None)

        flash(f'Exercise "{exercise.name}" deleted successfully!')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting exercise: {str(e)}')

    return redirect(url_for('index'))

# Add new exercise
@app.route('/add_exercise', methods=['POST'])
def add_exercise():
    try:
        # Get form data
        name = request.form['name']
        muscle_group = request.form['muscle_group']
        description = request.form['description']

        # Validate data
        if not name or not muscle_group or not description:
            flash('All fields are required.')
            return redirect(url_for('index'))

        # Check if exercise with same name already exists
        existing_exercise = Exercise.query.filter_by(name=name).first()
        if existing_exercise:
            flash(f'An exercise named "{name}" already exists.')
            return redirect(url_for('index'))

        # Create SVG image for the exercise
        import os
        import random

        # Convert exercise name to filename format
        exercise_name = name.lower().replace(' ', '_')

        # Generate a random color for the SVG
        colors = ['red', 'blue', 'green', 'purple', 'orange', 'teal', 'brown', 'pink']
        color = random.choice(colors)

        # Create SVG content
        svg_content = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="{color}" stroke="black" stroke-width="2"/>
    <text x="150" y="80" font-family="Arial" font-size="24" fill="white" text-anchor="middle">{name}</text>
    <text x="150" y="120" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Muscle Group: {muscle_group}</text>
</svg>
'''

        # Ensure the directory exists
        os.makedirs('static/images', exist_ok=True)

        # Save the SVG file
        svg_path = f'static/images/{exercise_name}.svg'
        with open(svg_path, 'w') as f:
            f.write(svg_content)

        # Set the image path for the exercise
        image_path = f'/static/images/{exercise_name}.svg'

        # Create new exercise
        exercise = Exercise(
            name=name,
            muscle_group=muscle_group,
            description=description,
            image_path=image_path
        )

        # Save to database
        db.session.add(exercise)
        db.session.commit()

        flash(f'Exercise "{name}" added successfully!')
    except Exception as e:
        flash(f'Error adding exercise: {str(e)}')

    return redirect(url_for('index'))

# Initialize the database
@app.cli.command('init-db')
def init_db():
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

if __name__ == '__main__':
    app.run(debug=True)
