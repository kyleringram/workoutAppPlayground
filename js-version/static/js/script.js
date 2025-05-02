document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const exerciseList = document.getElementById('exercise-list');
    const workoutForm = document.getElementById('workout-form');
    const selectedExerciseName = document.getElementById('selected-exercise-name');
    const selectedExerciseId = document.getElementById('selected-exercise-id');
    const clearSelectionBtn = document.getElementById('clear-selection');
    const weightInput = document.getElementById('weight');
    const repsInput = document.getElementById('reps');
    const workoutHistory = document.getElementById('workout-history');
    const flashMessages = document.getElementById('flash-messages');

    // Add Exercise Form Elements
    const showAddExerciseFormBtn = document.getElementById('show-add-exercise-form');
    const addExerciseFormContainer = document.getElementById('add-exercise-form-container');
    const addExerciseForm = document.getElementById('add-exercise-form');
    const cancelAddExerciseBtn = document.getElementById('cancel-add-exercise');

    // Templates
    const exerciseTemplate = document.getElementById('exercise-template');
    const workoutHistoryTemplate = document.getElementById('workout-history-template');

    // Variables
    let selectedExercise = null;

    // Default exercises data
    const defaultExercises = [
        {
            id: 1,
            name: 'Bench Press',
            muscle_group: 'Chest',
            description: 'Lie on a bench and press the weight upward',
            image_path: 'static/images/bench_press.svg'
        },
        {
            id: 2,
            name: 'Squat',
            muscle_group: 'Legs',
            description: 'Bend your knees and lower your body',
            image_path: 'static/images/squat.svg'
        },
        {
            id: 3,
            name: 'Deadlift',
            muscle_group: 'Back',
            description: 'Lift the weight from the ground to hip level',
            image_path: 'static/images/deadlift.svg'
        },
        {
            id: 4,
            name: 'Pull-up',
            muscle_group: 'Back',
            description: 'Pull your body up to a bar',
            image_path: 'static/images/pullup.svg'
        },
        {
            id: 5,
            name: 'Bicep Curl',
            muscle_group: 'Arms',
            description: 'Curl the weight towards your shoulder',
            image_path: 'static/images/bicep_curl.svg'
        }
    ];

    // Initialize localStorage if needed
    function initializeLocalStorage() {
        if (!localStorage.getItem('workouts')) {
            localStorage.setItem('workouts', JSON.stringify([]));
        }

        if (!localStorage.getItem('exercises')) {
            localStorage.setItem('exercises', JSON.stringify(defaultExercises));
        }
    }

    // Display exercises in the exercise list
    function displayExercises() {
        exerciseList.innerHTML = '';

        // Get exercises from localStorage
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];

        exercises.forEach(exercise => {
            const exerciseElement = document.importNode(exerciseTemplate.content, true);

            const exerciseItem = exerciseElement.querySelector('.exercise-item');
            const img = exerciseElement.querySelector('img');
            const name = exerciseElement.querySelector('.exercise-name');
            const muscleGroup = exerciseElement.querySelector('.exercise-muscle-group');
            const description = exerciseElement.querySelector('.exercise-description');

            img.src = exercise.image_path;
            img.alt = exercise.name;
            name.textContent = exercise.name;
            muscleGroup.textContent = `Muscle Group: ${exercise.muscle_group}`;
            description.textContent = exercise.description;

            exerciseItem.addEventListener('click', () => {
                selectExercise(exercise, exerciseItem);
            });

            exerciseList.appendChild(exerciseElement);
        });
    }

    // Add a new exercise
    function addExercise(exercise) {
        // Get existing exercises
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];

        // Generate a new ID (max ID + 1)
        const maxId = exercises.reduce((max, ex) => Math.max(max, ex.id), 0);
        exercise.id = maxId + 1;

        // Add the new exercise
        exercises.push(exercise);

        // Save back to localStorage
        localStorage.setItem('exercises', JSON.stringify(exercises));

        // Refresh the exercise list
        displayExercises();
    }

    // Select an exercise
    function selectExercise(exercise, exerciseItem) {
        // Remove selected class from previously selected exercise
        const previouslySelected = exerciseList.querySelector('.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        // Add selected class to the clicked exercise
        exerciseItem.classList.add('selected');

        // Update selected exercise
        selectedExercise = exercise;
        selectedExerciseName.textContent = exercise.name;
        selectedExerciseId.value = exercise.id;
        clearSelectionBtn.style.display = 'inline';
    }

    // Clear selected exercise
    clearSelectionBtn.addEventListener('click', function(event) {
        event.preventDefault();

        // Remove selected class from selected exercise
        const selected = exerciseList.querySelector('.selected');
        if (selected) {
            selected.classList.remove('selected');
        }

        // Reset selected exercise
        selectedExercise = null;
        selectedExerciseName.textContent = 'None';
        selectedExerciseId.value = '';
        clearSelectionBtn.style.display = 'none';
    });

    // Submit workout form
    workoutForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (!selectedExercise) {
            showFlashMessage('Please select an exercise first.');
            return;
        }

        const weight = parseFloat(weightInput.value);
        const reps = parseInt(repsInput.value);

        if (isNaN(weight) || weight <= 0) {
            showFlashMessage('Please enter a valid weight.');
            return;
        }

        if (isNaN(reps) || reps <= 0) {
            showFlashMessage('Please enter a valid number of reps.');
            return;
        }

        // Create workout object
        const workout = {
            id: Date.now(), // Use timestamp as ID
            exercise_id: selectedExercise.id,
            exercise_name: selectedExercise.name,
            weight: weight,
            reps: reps,
            date: new Date().toISOString()
        };

        // Save workout to localStorage
        saveWorkout(workout);

        // Reset form
        workoutForm.reset();
        clearSelectionBtn.click(); // Clear selected exercise

        // Refresh workout history
        displayWorkoutHistory();

        showFlashMessage('Workout saved successfully!');
    });

    // Save workout to localStorage
    function saveWorkout(workout) {
        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        workouts.push(workout);
        localStorage.setItem('workouts', JSON.stringify(workouts));
    }

    // Display workout history
    function displayWorkoutHistory() {
        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        workoutHistory.innerHTML = '';

        if (workouts.length === 0) {
            workoutHistory.innerHTML = '<p>No workout history available.</p>';
            return;
        }

        // Sort workouts by date (newest first)
        workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        workouts.forEach(workout => {
            const workoutElement = document.importNode(workoutHistoryTemplate.content, true);

            const date = workoutElement.querySelector('.workout-date');
            const exercise = workoutElement.querySelector('.workout-exercise');
            const weight = workoutElement.querySelector('.workout-weight');
            const reps = workoutElement.querySelector('.workout-reps');

            date.textContent = new Date(workout.date).toLocaleDateString();
            exercise.textContent = workout.exercise_name;
            weight.textContent = workout.weight;
            reps.textContent = workout.reps;

            workoutHistory.appendChild(workoutElement);
        });
    }

    // Show flash message
    function showFlashMessage(message) {
        const flashMessage = document.createElement('div');
        flashMessage.className = 'flash-message';
        flashMessage.textContent = message;

        flashMessages.innerHTML = '';
        flashMessages.appendChild(flashMessage);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            flashMessage.style.opacity = '0';
            setTimeout(() => {
                flashMessages.removeChild(flashMessage);
            }, 500);
        }, 5000);
    }

    // Show/hide add exercise form
    showAddExerciseFormBtn.addEventListener('click', function() {
        addExerciseFormContainer.style.display = 'block';
        showAddExerciseFormBtn.style.display = 'none';
    });

    cancelAddExerciseBtn.addEventListener('click', function() {
        addExerciseFormContainer.style.display = 'none';
        showAddExerciseFormBtn.style.display = 'inline-block';
        addExerciseForm.reset();
    });

    // Handle add exercise form submission
    addExerciseForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Get form values
        const name = document.getElementById('exercise-name').value.trim();
        const muscleGroup = document.getElementById('muscle-group').value.trim();
        const description = document.getElementById('description').value.trim();
        const imagePath = document.getElementById('image-path').value;

        // Validate form
        if (!name || !muscleGroup || !description || !imagePath) {
            showFlashMessage('All fields are required.');
            return;
        }

        // Check if exercise with same name already exists
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        if (exercises.some(ex => ex.name.toLowerCase() === name.toLowerCase())) {
            showFlashMessage(`An exercise named "${name}" already exists.`);
            return;
        }

        // Create new exercise object
        const newExercise = {
            name: name,
            muscle_group: muscleGroup,
            description: description,
            image_path: imagePath
        };

        // Add the exercise
        addExercise(newExercise);

        // Reset form and hide it
        addExerciseForm.reset();
        addExerciseFormContainer.style.display = 'none';
        showAddExerciseFormBtn.style.display = 'inline-block';

        // Show success message
        showFlashMessage(`Exercise "${name}" added successfully!`);
    });

    // Initialize
    initializeLocalStorage();
    displayExercises();
    displayWorkoutHistory();
});
