from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///workout.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
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
    """Render the main page template"""
    return render_template('index.html')

# API Endpoints
@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    """Get all exercises"""
    exercises = Exercise.query.all()
    return jsonify([exercise.to_dict() for exercise in exercises])

@app.route('/api/exercises', methods=['POST'])
def add_exercise():
    """Add a new exercise"""
    try:
        data = request.json
        
        # Validate data
        if not data.get('name') or not data.get('muscle_group') or not data.get('description'):
            return jsonify({'error': 'All fields are required'}), 400
            
        # Check if exercise with same name already exists
        existing_exercise = Exercise.query.filter_by(name=data['name']).first()
        if existing_exercise:
            return jsonify({'error': f'An exercise named "{data["name"]}" already exists'}), 400
            
        # Create SVG image for the exercise
        exercise_name = data['name'].lower().replace(' ', '_')
        
        # Generate SVG content
        svg_content = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="blue" stroke="black" stroke-width="2"/>
    <text x="150" y="80" font-family="Arial" font-size="24" fill="white" text-anchor="middle">{data['name']}</text>
    <text x="150" y="120" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Muscle Group: {data['muscle_group']}</text>
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
            name=data['name'],
            muscle_group=data['muscle_group'],
            description=data['description'],
            image_path=image_path
        )
        
        # Save to database
        db.session.add(exercise)
        db.session.commit()
        
        return jsonify(exercise.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exercises/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):
    """Delete an exercise"""
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
        
        return jsonify({'message': f'Exercise "{exercise.name}" deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    """Get all workouts"""
    workouts = WorkoutLog.query.order_by(WorkoutLog.date.desc()).all()
    return jsonify([workout.to_dict() for workout in workouts])

@app.route('/api/workouts', methods=['POST'])
def add_workout():
    """Add a new workout"""
    try:
        data = request.json
        
        # Validate data
        if not data.get('exercise_id') or not data.get('weight') or not data.get('reps'):
            return jsonify({'error': 'All fields are required'}), 400
            
        # Create new workout
        workout = WorkoutLog(
            exercise_id=data['exercise_id'],
            weight=float(data['weight']),
            reps=int(data['reps'])
        )
        
        # Save to database
        db.session.add(workout)
        db.session.commit()
        
        return jsonify(workout.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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