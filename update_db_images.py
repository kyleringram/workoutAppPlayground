from app import app, db, Exercise

def update_image_paths():
    with app.app_context():
        # Get all exercises
        exercises = Exercise.query.all()
        
        # Update image paths to use .svg instead of .jpg
        for exercise in exercises:
            if exercise.image_path and exercise.image_path.endswith('.jpg'):
                # Replace .jpg with .svg
                new_path = exercise.image_path.replace('.jpg', '.svg')
                print(f"Updating {exercise.name} image path from {exercise.image_path} to {new_path}")
                exercise.image_path = new_path
        
        # Commit changes
        db.session.commit()
        print("Database updated with new image paths.")

if __name__ == '__main__':
    update_image_paths()