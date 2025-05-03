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

    // API URLs
    const API_EXERCISES = '/api/exercises';
    const API_WORKOUTS = '/api/workouts';

    // Fetch exercises from the Python API
    function fetchExercises() {
        fetch(API_EXERCISES)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch exercises');
                }
                return response.json();
            })
            .then(exercises => {
                displayExercises(exercises);
            })
            .catch(error => {
                showFlashMessage(`Error: ${error.message}`);
            });
    }

    // Display exercises in the exercise list
    function displayExercises(exercises) {
        exerciseList.innerHTML = '';

        if (exercises.length === 0) {
            exerciseList.innerHTML = '<p>No exercises available. Add one to get started!</p>';
            return;
        }

        exercises.forEach(exercise => {
            const exerciseElement = document.importNode(exerciseTemplate.content, true);

            const exerciseItem = exerciseElement.querySelector('.exercise-item');
            const deleteBtn = exerciseElement.querySelector('.btn-delete');
            const img = exerciseElement.querySelector('img');
            const name = exerciseElement.querySelector('.exercise-name');
            const muscleGroup = exerciseElement.querySelector('.exercise-muscle-group');
            const description = exerciseElement.querySelector('.exercise-description');

            img.src = exercise.image_path;
            img.alt = exercise.name;
            name.textContent = exercise.name;
            muscleGroup.textContent = `Muscle Group: ${exercise.muscle_group}`;
            description.textContent = exercise.description;

            // Set up exercise selection
            exerciseItem.addEventListener('click', (event) => {
                // Don't select if delete button was clicked
                if (event.target !== deleteBtn) {
                    selectExercise(exercise, exerciseItem);
                }
            });

            // Set up delete button
            deleteBtn.addEventListener('click', () => {
                deleteExercise(exercise.id, exercise.name);
            });

            exerciseList.appendChild(exerciseElement);
        });
    }

    // Fetch workouts from the Python API
    function fetchWorkouts() {
        fetch(API_WORKOUTS)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch workouts');
                }
                return response.json();
            })
            .then(workouts => {
                displayWorkoutHistory(workouts);
            })
            .catch(error => {
                showFlashMessage(`Error: ${error.message}`);
            });
    }

    // Display workout history
    function displayWorkoutHistory(workouts) {
        workoutHistory.innerHTML = '';

        if (workouts.length === 0) {
            workoutHistory.innerHTML = '<p>No workout history available.</p>';
            return;
        }

        workouts.forEach(workout => {
            const workoutElement = document.importNode(workoutHistoryTemplate.content, true);

            const date = workoutElement.querySelector('.workout-date');
            const exercise = workoutElement.querySelector('.workout-exercise');
            const weight = workoutElement.querySelector('.workout-weight');
            const reps = workoutElement.querySelector('.workout-reps');

            // Format date (2023-01-01 12:34:56 -> 2023-01-01)
            const formattedDate = workout.date.split(' ')[0];
            
            date.textContent = formattedDate;
            exercise.textContent = workout.exercise_name;
            weight.textContent = workout.weight;
            reps.textContent = workout.reps;

            workoutHistory.appendChild(workoutElement);
        });
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

    // Delete an exercise
    function deleteExercise(exerciseId, exerciseName) {
        if (!confirm(`Are you sure you want to delete "${exerciseName}"? This will also delete all workout logs associated with it.`)) {
            return;
        }

        fetch(`${API_EXERCISES}/${exerciseId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete exercise');
            }
            return response.json();
        })
        .then(data => {
            showFlashMessage(data.message);
            
            // If the deleted exercise was selected, clear the selection
            if (selectedExercise && selectedExercise.id === exerciseId) {
                clearSelectionBtn.click();
            }
            
            // Refresh exercises and workouts
            fetchExercises();
            fetchWorkouts();
        })
        .catch(error => {
            showFlashMessage(`Error: ${error.message}`);
        });
    }

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
            exercise_id: selectedExercise.id,
            weight: weight,
            reps: reps
        };

        // Send workout to the Python API
        fetch(API_WORKOUTS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workout)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save workout');
            }
            return response.json();
        })
        .then(data => {
            // Reset form
            workoutForm.reset();
            clearSelectionBtn.click(); // Clear selected exercise
            
            // Refresh workout history
            fetchWorkouts();
            
            showFlashMessage('Workout saved successfully!');
        })
        .catch(error => {
            showFlashMessage(`Error: ${error.message}`);
        });
    });

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

        // Validate form
        if (!name || !muscleGroup || !description) {
            showFlashMessage('All fields are required.');
            return;
        }

        // Create new exercise object
        const newExercise = {
            name: name,
            muscle_group: muscleGroup,
            description: description
        };

        // Send exercise to the Python API
        fetch(API_EXERCISES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newExercise)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to add exercise');
                });
            }
            return response.json();
        })
        .then(data => {
            // Reset form and hide it
            addExerciseForm.reset();
            addExerciseFormContainer.style.display = 'none';
            showAddExerciseFormBtn.style.display = 'inline-block';
            
            // Refresh exercises
            fetchExercises();
            
            showFlashMessage(`Exercise "${name}" added successfully!`);
        })
        .catch(error => {
            showFlashMessage(`Error: ${error.message}`);
        });
    });

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
                if (flashMessages.contains(flashMessage)) {
                    flashMessages.removeChild(flashMessage);
                }
            }, 500);
        }, 5000);
    }

    // Initialize - fetch data from the Python API
    fetchExercises();
    fetchWorkouts();
});