/**
 * Workout Tracker App - Frontend JavaScript
 * -----------------------------------------
 * This file contains the client-side JavaScript code for the Workout Tracker application.
 * It handles:
 * 1. User interface interactions
 * 2. Communication with the Python backend API
 * 3. Authentication and session management
 * 4. Dynamic content rendering
 * 
 * The application follows a single-page application (SPA) approach where most of the
 * UI updates happen without full page reloads, using fetch API to communicate with
 * the backend.
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements - References to HTML elements that we'll interact with
    const exerciseList = document.getElementById('exercise-list');           // Container for the list of exercises
    const workoutForm = document.getElementById('workout-form');             // Form for recording a new workout
    const selectedExerciseName = document.getElementById('selected-exercise-name'); // Display for selected exercise name
    const selectedExerciseId = document.getElementById('selected-exercise-id');     // Hidden input for selected exercise ID
    const clearSelectionBtn = document.getElementById('clear-selection');    // Button to clear exercise selection
    const weightInput = document.getElementById('weight');                   // Input for workout weight
    const repsInput = document.getElementById('reps');                       // Input for workout repetitions
    const workoutHistory = document.getElementById('workout-history');       // Container for workout history
    const flashMessages = document.getElementById('flash-messages');         // Container for notification messages

    // Add Exercise Form Elements - References to elements for adding new exercises
    const showAddExerciseFormBtn = document.getElementById('show-add-exercise-form');  // Button to show the add exercise form
    const addExerciseFormContainer = document.getElementById('add-exercise-form-container'); // Container for the add exercise form
    const addExerciseForm = document.getElementById('add-exercise-form');    // Form for adding a new exercise
    const cancelAddExerciseBtn = document.getElementById('cancel-add-exercise'); // Button to cancel adding an exercise

    // Authentication Elements - References to elements for user authentication UI
    const authStatus = document.getElementById('auth-status');               // Container for auth status display
    const loggedOutSection = authStatus.querySelector('.logged-out');        // UI elements shown when logged out
    const loggedInSection = authStatus.querySelector('.logged-in');          // UI elements shown when logged in
    const usernameSpan = document.getElementById('username');                // Display for logged-in username
    const logoutBtn = document.getElementById('logout-btn');                 // Button to log out

    // Templates - HTML templates used for dynamic content generation
    const exerciseTemplate = document.getElementById('exercise-template');           // Template for exercise items
    const workoutHistoryTemplate = document.getElementById('workout-history-template'); // Template for workout history items

    // Application State Variables
    let selectedExercise = null;  // Stores the currently selected exercise object
    let currentUser = null;       // Stores the currently logged-in user object (null if not logged in)

    // API URLs - These are the endpoints that connect JavaScript to the Python backend
    const API_EXERCISES = '/api/exercises';  // Endpoint for CRUD operations on exercises
    const API_WORKOUTS = '/api/workouts';    // Endpoint for CRUD operations on workouts
    const API_AUTH_USER = '/api/auth/user';  // Endpoint to get current authenticated user
    const API_AUTH_LOGOUT = '/api/auth/logout'; // Endpoint to log out the current user

    // Note: There are also /api/auth/login and /api/auth/register endpoints
    // that are used directly in the login.html and register.html templates

    // Fetch exercises from the Python API
    // This function demonstrates the basic pattern of JavaScript-Python interaction:
    // 1. JavaScript makes a fetch request to a Python API endpoint
    // 2. Python processes the request and returns JSON data
    // 3. JavaScript receives and processes the JSON data
    // 4. JavaScript updates the UI based on the data
    function fetchExercises() {
        // Make a GET request to the exercises endpoint
        fetch(API_EXERCISES)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch exercises');
                }
                // Parse the JSON response from Python
                return response.json();
            })
            .then(exercises => {
                // Process the data received from Python
                displayExercises(exercises);
            })
            .catch(error => {
                showFlashMessage(`Error: ${error.message}`);
            });
    }

    /**
     * Display exercises in the exercise list
     * 
     * This function:
     * 1. Clears the current exercise list
     * 2. Handles the empty state (no exercises)
     * 3. Creates DOM elements for each exercise using the HTML template
     * 4. Sets up event listeners for exercise selection and deletion
     * 
     * @param {Array} exercises - Array of exercise objects from the API
     */
    function displayExercises(exercises) {
        // Clear the current exercise list
        exerciseList.innerHTML = '';

        // Handle empty state - show a message if no exercises are available
        if (exercises.length === 0) {
            exerciseList.innerHTML = '<p>No exercises available. Add one to get started!</p>';
            return;
        }

        // Process each exercise and add it to the DOM
        exercises.forEach(exercise => {
            // Clone the exercise template to create a new exercise element
            // The 'true' parameter means we're doing a deep clone (including all children)
            const exerciseElement = document.importNode(exerciseTemplate.content, true);

            // Get references to elements within the cloned template
            const exerciseItem = exerciseElement.querySelector('.exercise-item');
            const deleteBtn = exerciseElement.querySelector('.btn-delete');
            const img = exerciseElement.querySelector('img');
            const name = exerciseElement.querySelector('.exercise-name');
            const muscleGroup = exerciseElement.querySelector('.exercise-muscle-group');
            const description = exerciseElement.querySelector('.exercise-description');

            // Populate the exercise element with data from the exercise object
            img.src = exercise.image_path;
            img.alt = exercise.name;
            name.textContent = exercise.name;
            muscleGroup.textContent = `Muscle Group: ${exercise.muscle_group}`;
            description.textContent = exercise.description;

            // Set up exercise selection - clicking on the exercise selects it
            exerciseItem.addEventListener('click', (event) => {
                // Don't select if delete button was clicked
                // This prevents selection when the user is trying to delete
                if (event.target !== deleteBtn) {
                    selectExercise(exercise, exerciseItem);
                }
            });

            // Set up delete button - clicking the delete button deletes the exercise
            deleteBtn.addEventListener('click', () => {
                deleteExercise(exercise.id, exercise.name);
            });

            // Add the completed exercise element to the exercise list
            exerciseList.appendChild(exerciseElement);
        });
    }

    // Fetch workouts from the Python API
    // This function demonstrates how JavaScript handles authentication with Python:
    // 1. JavaScript checks client-side if user is logged in before making the request
    // 2. JavaScript makes a request to a protected endpoint that requires authentication
    // 3. Python checks if the request is authenticated via the session
    // 4. If not authenticated, Python returns a 401 Unauthorized status
    // 5. JavaScript handles the authentication error and updates the UI accordingly
    function fetchWorkouts() {
        // Client-side check: Only fetch workouts if user is logged in
        // This is a UX optimization to avoid unnecessary requests
        if (!currentUser) {
            if (workoutHistory) {
                workoutHistory.innerHTML = '<p>Please log in to view your workout history.</p>';
            }
            return;
        }

        // Make request to protected endpoint
        fetch(API_WORKOUTS)
            .then(response => {
                if (response.status === 401) {
                    // 401 Unauthorized - Python has determined the session is not authenticated
                    // This can happen if the session expired or was invalidated
                    showFlashMessage('Please log in to view your workouts');
                    showLoggedOutUI();
                    return null;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch workouts');
                }
                // Parse the JSON response from Python
                return response.json();
            })
            .then(workouts => {
                if (workouts) {
                    // Process the data received from Python
                    // The Python backend has already filtered workouts to only include
                    // those belonging to the authenticated user
                    displayWorkoutHistory(workouts);
                }
            })
            .catch(error => {
                showFlashMessage(`Error: ${error.message}`);
            });
    }

    /**
     * Display workout history in the UI
     * 
     * This function:
     * 1. Clears the current workout history
     * 2. Handles the empty state (no workouts)
     * 3. Creates DOM elements for each workout using the HTML template
     * 4. Formats dates for better readability
     * 
     * @param {Array} workouts - Array of workout objects from the API
     */
    function displayWorkoutHistory(workouts) {
        // Clear the current workout history
        workoutHistory.innerHTML = '';

        // Handle empty state - show a message if no workouts are available
        if (workouts.length === 0) {
            workoutHistory.innerHTML = '<p>No workout history available.</p>';
            return;
        }

        // Process each workout and add it to the DOM
        workouts.forEach(workout => {
            // Clone the workout history template to create a new workout element
            const workoutElement = document.importNode(workoutHistoryTemplate.content, true);

            // Get references to elements within the cloned template
            const date = workoutElement.querySelector('.workout-date');
            const exercise = workoutElement.querySelector('.workout-exercise');
            const weight = workoutElement.querySelector('.workout-weight');
            const reps = workoutElement.querySelector('.workout-reps');

            // Format date (2023-01-01 12:34:56 -> 2023-01-01)
            // The date comes from the server in ISO format with time
            // We only want to display the date part for better readability
            const formattedDate = workout.date.split(' ')[0];

            // Populate the workout element with data from the workout object
            date.textContent = formattedDate;
            exercise.textContent = workout.exercise_name;
            weight.textContent = workout.weight;
            reps.textContent = workout.reps;

            // Add the completed workout element to the workout history
            workoutHistory.appendChild(workoutElement);
        });
    }

    /**
     * Select an exercise for recording a workout
     * 
     * This function:
     * 1. Updates the UI to highlight the selected exercise
     * 2. Updates the form with the selected exercise details
     * 3. Shows the clear selection button
     * 
     * @param {Object} exercise - The exercise object to select
     * @param {HTMLElement} exerciseItem - The DOM element representing the exercise
     */
    function selectExercise(exercise, exerciseItem) {
        // Remove selected class from previously selected exercise (visual indication)
        const previouslySelected = exerciseList.querySelector('.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        // Add selected class to the clicked exercise (visual indication)
        exerciseItem.classList.add('selected');

        // Update application state and form with selected exercise
        selectedExercise = exercise;                        // Update state variable
        selectedExerciseName.textContent = exercise.name;   // Update display name
        selectedExerciseId.value = exercise.id;             // Update hidden form field
        clearSelectionBtn.style.display = 'inline';         // Show clear button
    }

    /**
     * Clear the currently selected exercise
     * 
     * This event handler:
     * 1. Removes the visual selection indicator
     * 2. Resets the form fields
     * 3. Hides the clear selection button
     */
    clearSelectionBtn.addEventListener('click', function(event) {
        event.preventDefault();  // Prevent default link behavior

        // Remove selected class from selected exercise (visual indication)
        const selected = exerciseList.querySelector('.selected');
        if (selected) {
            selected.classList.remove('selected');
        }

        // Reset application state and form
        selectedExercise = null;                     // Clear state variable
        selectedExerciseName.textContent = 'None';   // Reset display name
        selectedExerciseId.value = '';               // Clear hidden form field
        clearSelectionBtn.style.display = 'none';    // Hide clear button
    });

    /**
     * Delete workout logs for an exercise
     * 
     * This function:
     * 1. Checks if the user is logged in
     * 2. Confirms the deletion with the user
     * 3. Sends a DELETE request to the API
     * 4. Handles authentication errors
     * 5. Updates the UI after successful deletion
     * 
     * Note: This doesn't delete the exercise itself, only the user's workout logs for it,
     * as exercises are shared among all users.
     * 
     * @param {number} exerciseId - The ID of the exercise to delete logs for
     * @param {string} exerciseName - The name of the exercise (for confirmation message)
     */
    function deleteExercise(exerciseId, exerciseName) {
        // Client-side authentication check
        if (!currentUser) {
            showFlashMessage('Please log in to delete exercises');
            return;
        }

        // Confirm deletion with the user
        if (!confirm(`Are you sure you want to delete workout logs for "${exerciseName}"?`)) {
            return; // User cancelled the deletion
        }

        // Send DELETE request to the API
        fetch(`${API_EXERCISES}/${exerciseId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.status === 401) {
                // 401 Unauthorized - user's session may have expired
                showFlashMessage('Please log in to delete exercises');
                showLoggedOutUI(); // Update UI to logged-out state
                return null;
            }
            if (!response.ok) {
                throw new Error('Failed to delete exercise');
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                // Show success message
                showFlashMessage(data.message);

                // If the deleted exercise was selected, clear the selection
                // This prevents issues with trying to use a deleted exercise
                if (selectedExercise && selectedExercise.id === exerciseId) {
                    clearSelectionBtn.click();
                }

                // Refresh data to update the UI
                fetchExercises(); // Refresh the exercise list
                fetchWorkouts();  // Refresh the workout history
            }
        })
        .catch(error => {
            // Show error message if something went wrong
            showFlashMessage(`Error: ${error.message}`);
        });
    }

    /**
     * Handle workout form submission
     * 
     * This event handler:
     * 1. Validates the form data (authentication, exercise selection, weight, reps)
     * 2. Creates a workout object from the form data
     * 3. Sends the workout to the Python API
     * 4. Handles authentication errors
     * 5. Updates the UI after successful submission
     */
    workoutForm.addEventListener('submit', function(event) {
        event.preventDefault();  // Prevent the form from submitting normally

        // Authentication check - ensure user is logged in
        if (!currentUser) {
            showFlashMessage('Please log in to save workouts');
            return;
        }

        // Validate exercise selection
        if (!selectedExercise) {
            showFlashMessage('Please select an exercise first.');
            return;
        }

        // Parse and validate weight input
        const weight = parseFloat(weightInput.value);
        if (isNaN(weight) || weight <= 0) {
            showFlashMessage('Please enter a valid weight.');
            return;
        }

        // Parse and validate reps input
        const reps = parseInt(repsInput.value);
        if (isNaN(reps) || reps <= 0) {
            showFlashMessage('Please enter a valid number of reps.');
            return;
        }

        // Create workout object from form data
        const workout = {
            exercise_id: selectedExercise.id,  // ID of the selected exercise
            weight: weight,                    // Weight used (in lbs)
            reps: reps                         // Number of repetitions
        };

        // Send workout data to the Python API
        fetch(API_WORKOUTS, {
            method: 'POST',                          // HTTP method
            headers: {
                'Content-Type': 'application/json'   // Content type header
            },
            body: JSON.stringify(workout)            // Convert workout object to JSON string
        })
        .then(response => {
            if (response.status === 401) {
                // 401 Unauthorized - user's session may have expired
                showFlashMessage('Please log in to save workouts');
                showLoggedOutUI();  // Update UI to logged-out state
                return null;
            }
            if (!response.ok) {
                throw new Error('Failed to save workout');
            }
            return response.json();  // Parse JSON response
        })
        .then(data => {
            if (data) {
                // Reset the form for a new entry
                workoutForm.reset();
                clearSelectionBtn.click();  // Clear selected exercise

                // Refresh workout history to show the new workout
                fetchWorkouts();

                // Show success message
                showFlashMessage('Workout saved successfully!');
            }
        })
        .catch(error => {
            // Show error message if something went wrong
            showFlashMessage(`Error: ${error.message}`);
        });
    });

    /**
     * Show the add exercise form
     * 
     * This event handler shows the form for adding a new exercise
     * and hides the "Add New Exercise" button.
     */
    showAddExerciseFormBtn.addEventListener('click', function() {
        addExerciseFormContainer.style.display = 'block';      // Show the form container
        showAddExerciseFormBtn.style.display = 'none';         // Hide the "Add New Exercise" button
    });

    /**
     * Cancel adding a new exercise
     * 
     * This event handler hides the add exercise form,
     * shows the "Add New Exercise" button, and resets the form.
     */
    cancelAddExerciseBtn.addEventListener('click', function() {
        addExerciseFormContainer.style.display = 'none';           // Hide the form container
        showAddExerciseFormBtn.style.display = 'inline-block';     // Show the "Add New Exercise" button
        addExerciseForm.reset();                                   // Reset the form fields
    });

    /**
     * Handle add exercise form submission
     * 
     * This event handler:
     * 1. Validates the form data (authentication, required fields)
     * 2. Creates a new exercise object from the form data
     * 3. Sends the exercise to the Python API
     * 4. Handles authentication errors
     * 5. Updates the UI after successful submission
     */
    addExerciseForm.addEventListener('submit', function(event) {
        event.preventDefault();  // Prevent the form from submitting normally

        // Authentication check - ensure user is logged in
        if (!currentUser) {
            showFlashMessage('Please log in to add exercises');
            return;
        }

        // Get and trim form values
        const name = document.getElementById('exercise-name').value.trim();
        const muscleGroup = document.getElementById('muscle-group').value.trim();
        const description = document.getElementById('description').value.trim();

        // Validate required fields
        if (!name || !muscleGroup || !description) {
            showFlashMessage('All fields are required.');
            return;
        }

        // Create new exercise object from form data
        const newExercise = {
            name: name,                   // Exercise name
            muscle_group: muscleGroup,    // Target muscle group
            description: description      // Exercise description
        };

        // Send exercise data to the Python API
        fetch(API_EXERCISES, {
            method: 'POST',                          // HTTP method
            headers: {
                'Content-Type': 'application/json'   // Content type header
            },
            body: JSON.stringify(newExercise)        // Convert exercise object to JSON string
        })
        .then(response => {
            if (response.status === 401) {
                // 401 Unauthorized - user's session may have expired
                showFlashMessage('Please log in to add exercises');
                showLoggedOutUI();  // Update UI to logged-out state
                return { error: 'Authentication required' };
            }
            // Parse JSON response and handle errors
            return response.json().then(data => {
                if (!response.ok) {
                    // If response is not OK, throw an error with the error message from the server
                    throw new Error(data.error || 'Failed to add exercise');
                }
                return data;
            });
        })
        .then(data => {
            // Check for error from previous then block
            if (data.error) {
                showFlashMessage(`Error: ${data.error}`);
                return;
            }

            // Reset and hide the form
            addExerciseForm.reset();
            addExerciseFormContainer.style.display = 'none';
            showAddExerciseFormBtn.style.display = 'inline-block';

            // Refresh the exercise list to show the new exercise
            fetchExercises();

            // Show success message
            showFlashMessage(`Exercise "${name}" added successfully!`);
        })
        .catch(error => {
            // Show error message if something went wrong
            showFlashMessage(`Error: ${error.message}`);
        });
    });

    /**
     * Display a flash message to the user
     * 
     * This function:
     * 1. Creates a new flash message element
     * 2. Adds it to the flash messages container
     * 3. Automatically removes it after a delay
     * 
     * Flash messages are used to provide feedback to the user about
     * the result of their actions (success, error, etc.)
     * 
     * @param {string} message - The message to display
     */
    function showFlashMessage(message) {
        // Create a new flash message element
        const flashMessage = document.createElement('div');
        flashMessage.className = 'flash-message';
        flashMessage.textContent = message;

        // Clear any existing flash messages and add the new one
        flashMessages.innerHTML = '';
        flashMessages.appendChild(flashMessage);

        // Auto-remove after 5 seconds with a fade-out effect
        setTimeout(() => {
            // Start the fade-out effect by setting opacity to 0
            flashMessage.style.opacity = '0';

            // After the fade-out animation completes (500ms), remove the element
            setTimeout(() => {
                // Check if the element still exists before trying to remove it
                if (flashMessages.contains(flashMessage)) {
                    flashMessages.removeChild(flashMessage);
                }
            }, 500);  // 500ms for the fade-out animation
        }, 5000);  // 5000ms (5 seconds) before starting the fade-out
    }

    // Check if user is authenticated
    // This function demonstrates how JavaScript-Python authentication works:
    // 1. JavaScript requests the current user's authentication status from Python
    // 2. Python checks the session data and returns the user info if authenticated
    // 3. JavaScript updates the UI and application state based on authentication status
    // 4. JavaScript fetches user-specific data only if the user is authenticated
    function checkAuth() {
        // Request current authentication status from Python backend
        fetch(API_AUTH_USER)
            .then(response => response.json())
            .then(data => {
                if (data.authenticated) {
                    // User is logged in - Python has returned user data from the session
                    currentUser = data.user;
                    showLoggedInUI();
                } else {
                    // User is not logged in - Python session has no user data
                    currentUser = null;
                    showLoggedOutUI();
                }

                // Fetch data after checking authentication
                // This ensures we only try to fetch protected data when authenticated
                fetchExercises();
                fetchWorkouts();
            })
            .catch(error => {
                console.error('Error checking authentication:', error);
                showLoggedOutUI();
            });
    }

    /**
     * Update the UI for logged-in users
     * 
     * This function:
     * 1. Shows UI elements for logged-in users
     * 2. Hides UI elements for logged-out users
     * 3. Displays the username
     * 4. Shows functionality that requires authentication
     */
    function showLoggedInUI() {
        // Update authentication UI sections
        loggedOutSection.style.display = 'none';      // Hide login/register links
        loggedInSection.style.display = 'block';      // Show welcome message and logout button

        // Display the current user's username
        usernameSpan.textContent = currentUser.username;

        // Show add exercise button (only logged-in users can add exercises)
        if (showAddExerciseFormBtn) {
            showAddExerciseFormBtn.style.display = 'inline-block';
        }
    }

    /**
     * Update the UI for logged-out users
     * 
     * This function:
     * 1. Shows UI elements for logged-out users
     * 2. Hides UI elements for logged-in users
     * 3. Hides functionality that requires authentication
     * 4. Clears user-specific data from the UI
     */
    function showLoggedOutUI() {
        // Update authentication UI sections
        loggedOutSection.style.display = 'block';     // Show login/register links
        loggedInSection.style.display = 'none';       // Hide welcome message and logout button

        // Hide add exercise button (only logged-in users can add exercises)
        if (showAddExerciseFormBtn) {
            showAddExerciseFormBtn.style.display = 'none';
        }

        // Clear workout history and show login message
        if (workoutHistory) {
            workoutHistory.innerHTML = '<p>Please log in to view your workout history.</p>';
        }
    }

    /**
     * Handle user logout
     * 
     * This event handler:
     * 1. Sends a logout request to the Python API
     * 2. Clears the current user from application state
     * 3. Updates the UI to reflect logged-out status
     * 4. Shows a confirmation message
     */
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Send logout request to the Python API
            fetch(API_AUTH_LOGOUT, {
                method: 'POST'  // POST method for logout action
            })
            .then(response => response.json())  // Parse JSON response
            .then(data => {
                // Show success message
                showFlashMessage(data.message || 'Logged out successfully');

                // Update application state
                currentUser = null;  // Clear current user

                // Update UI to reflect logged-out status
                showLoggedOutUI();
            })
            .catch(error => {
                // Log error for debugging
                console.error('Error logging out:', error);

                // Show error message to user
                showFlashMessage('Error logging out. Please try again.');
            });
        });
    }

    /**
     * Application Initialization
     * 
     * The application starts by checking the user's authentication status first.
     * This ensures that:
     * 1. The UI is correctly set up based on whether the user is logged in
     * 2. Data fetching only happens after authentication is confirmed
     * 3. User-specific data is only shown to authenticated users
     */
    checkAuth();  // This will trigger fetchExercises() and fetchWorkouts() after checking auth
});  // End of DOMContentLoaded event handler
