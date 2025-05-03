/**
 * Workout Tracker App - JavaScript-only Version
 * --------------------------------------------
 * This file contains the client-side JavaScript code for the Workout Tracker application.
 * Unlike the Python+JavaScript version, this version:
 * 1. Uses localStorage for data persistence instead of a backend database
 * 2. Handles authentication entirely on the client side
 * 3. Manages all data operations (CRUD) in JavaScript
 * 4. Includes modal dialogs for login and registration
 * 
 * The application follows a single-page application (SPA) approach where all
 * functionality is contained within a single HTML page and JavaScript file.
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
    const loginBtn = document.getElementById('login-btn');                   // Button to open login modal
    const registerBtn = document.getElementById('register-btn');             // Button to open registration modal
    const logoutBtn = document.getElementById('logout-btn');                 // Button to log out

    // Modal Elements - References to modal dialogs for login and registration
    const loginModal = document.getElementById('login-modal');               // Login modal dialog
    const registerModal = document.getElementById('register-modal');         // Registration modal dialog
    const loginForm = document.getElementById('login-form');                 // Login form
    const registerForm = document.getElementById('register-form');           // Registration form
    const closeModalBtns = document.querySelectorAll('.close-modal');        // Buttons to close modals

    // Templates - HTML templates used for dynamic content generation
    const exerciseTemplate = document.getElementById('exercise-template');           // Template for exercise items
    const workoutHistoryTemplate = document.getElementById('workout-history-template'); // Template for workout history items

    // Application State Variables
    let selectedExercise = null;  // Stores the currently selected exercise object
    let currentUser = null;       // Stores the currently logged-in user object (null if not logged in)

    /**
     * Default exercises data
     * 
     * This array contains the initial set of exercises that will be loaded
     * into localStorage when the application is first run.
     * Each exercise has:
     * - id: Unique identifier
     * - name: Name of the exercise
     * - muscle_group: Primary muscle group targeted
     * - description: Brief description of how to perform the exercise
     * - image_path: Path to the SVG image for the exercise
     */
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

    /**
     * Initialize localStorage with default data
     * 
     * This function:
     * 1. Checks if the required localStorage items exist
     * 2. Creates them with default values if they don't
     * 
     * This ensures the application has the necessary data structures
     * even when run for the first time on a new device.
     */
    function initializeLocalStorage() {
        // Initialize workouts array if it doesn't exist
        if (!localStorage.getItem('workouts')) {
            localStorage.setItem('workouts', JSON.stringify([]));  // Empty array of workouts
        }

        // Initialize exercises array if it doesn't exist
        if (!localStorage.getItem('exercises')) {
            localStorage.setItem('exercises', JSON.stringify(defaultExercises));  // Default exercises
        }

        // Initialize users array if it doesn't exist
        if (!localStorage.getItem('users')) {
            // Create a default demo user for easy testing
            const demoUser = {
                id: 1,
                username: 'demo',
                email: 'demo@example.com',
                password: 'password' // Note: In a real app, this would be hashed for security
            };
            localStorage.setItem('users', JSON.stringify([demoUser]));  // Array with demo user
        }
    }

    /**
     * Authentication Functions
     * 
     * These functions handle user authentication in the JavaScript-only version.
     * Unlike the Python+JavaScript version which uses server-side sessions,
     * this version stores authentication state in localStorage.
     */

    /**
     * Show the login modal dialog
     */
    function showLoginModal() {
        loginModal.style.display = 'block';  // Make the login modal visible
    }

    /**
     * Show the registration modal dialog
     */
    function showRegisterModal() {
        registerModal.style.display = 'block';  // Make the registration modal visible
    }

    /**
     * Hide all modal dialogs
     */
    function hideModals() {
        loginModal.style.display = 'none';     // Hide the login modal
        registerModal.style.display = 'none';  // Hide the registration modal
    }

    /**
     * Register a new user
     * 
     * This function:
     * 1. Validates that the username and email are unique
     * 2. Creates a new user object
     * 3. Adds the user to localStorage
     * 4. Logs the user in automatically
     * 
     * @param {string} username - The desired username
     * @param {string} email - The user's email address
     * @param {string} password - The user's password (stored in plain text in this demo)
     * @returns {Object} Result object with success flag and message
     */
    function registerUser(username, email, password) {
        // Get existing users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Validate username uniqueness
        if (users.some(user => user.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        // Validate email uniqueness
        if (users.some(user => user.email === email)) {
            return { success: false, message: 'Email already exists' };
        }

        // Create new user object with a unique ID
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1,  // Generate unique ID
            username: username,
            email: email,
            password: password // Note: In a real app, this would be hashed for security
        };

        // Add user to users array and save to localStorage
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Log the user in automatically after registration
        loginUser(username, password);

        return { success: true, message: 'Registration successful' };
    }

    /**
     * Log in a user
     * 
     * This function:
     * 1. Validates the username and password against stored users
     * 2. Stores the authenticated user in localStorage and application state
     * 3. Updates the UI to reflect logged-in status
     * 
     * @param {string} username - The username to log in with
     * @param {string} password - The password to log in with
     * @returns {Object} Result object with success flag and message
     */
    function loginUser(username, password) {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Find user by username and password (simple authentication)
        const user = users.find(user => user.username === username && user.password === password);

        // If user not found or password doesn't match
        if (!user) {
            return { success: false, message: 'Invalid username or password' };
        }

        // Create a copy of the user object without the password for security
        const userInfo = { ...user };
        delete userInfo.password;  // Remove password before storing in localStorage

        // Store authenticated user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(userInfo));

        // Update application state
        currentUser = userInfo;

        // Update UI to reflect logged-in status
        showLoggedInUI();

        return { success: true, message: 'Login successful' };
    }

    /**
     * Log out the current user
     * 
     * This function:
     * 1. Removes the current user from localStorage and application state
     * 2. Updates the UI to reflect logged-out status
     * 
     * @returns {Object} Result object with success flag and message
     */
    function logoutUser() {
        // Remove current user from localStorage
        localStorage.removeItem('currentUser');

        // Update application state
        currentUser = null;

        // Update UI to reflect logged-out status
        showLoggedOutUI();

        return { success: true, message: 'Logout successful' };
    }

    /**
     * Check if a user is currently logged in
     * 
     * This function:
     * 1. Checks localStorage for a stored user
     * 2. Updates application state and UI accordingly
     */
    function checkAuth() {
        // Check if there's a stored user in localStorage
        const userInfo = localStorage.getItem('currentUser');

        if (userInfo) {
            // User is logged in
            currentUser = JSON.parse(userInfo);
            showLoggedInUI();
        } else {
            // No user is logged in
            currentUser = null;
            showLoggedOutUI();
        }
    }

    /**
     * Update the UI for logged-in users
     * 
     * This function:
     * 1. Shows UI elements for logged-in users
     * 2. Hides UI elements for logged-out users
     * 3. Displays the username
     * 4. Shows functionality that requires authentication
     * 5. Filters workout history to show only the current user's workouts
     */
    function showLoggedInUI() {
        // Update authentication UI sections
        loggedOutSection.style.display = 'none';   // Hide login/register buttons
        loggedInSection.style.display = 'flex';    // Show welcome message and logout button

        // Display the current user's username in the header
        usernameSpan.textContent = currentUser.username;

        // Show add exercise button (only logged-in users can add exercises)
        if (showAddExerciseFormBtn) {
            showAddExerciseFormBtn.style.display = 'inline-block';
        }

        // Refresh workout history to show only the current user's workouts
        // This filters the workouts in localStorage by the current user's ID
        displayWorkoutHistory();
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
        loggedOutSection.style.display = 'flex';   // Show login/register buttons
        loggedInSection.style.display = 'none';    // Hide welcome message and logout button

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
     * Display exercises in the exercise list
     * 
     * This function:
     * 1. Retrieves exercises from localStorage
     * 2. Creates DOM elements for each exercise using the HTML template
     * 3. Sets up event listeners for exercise selection
     * 
     * Unlike the Python+JavaScript version, this function gets data from
     * localStorage instead of making an API request.
     */
    function displayExercises() {
        // Clear the current exercise list
        exerciseList.innerHTML = '';

        // Get exercises from localStorage
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];

        // Process each exercise and add it to the DOM
        exercises.forEach(exercise => {
            // Clone the exercise template to create a new exercise element
            const exerciseElement = document.importNode(exerciseTemplate.content, true);

            // Get references to elements within the cloned template
            const exerciseItem = exerciseElement.querySelector('.exercise-item');
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
            exerciseItem.addEventListener('click', () => {
                selectExercise(exercise, exerciseItem);
            });

            // Add the completed exercise element to the exercise list
            exerciseList.appendChild(exerciseElement);
        });
    }

    /**
     * Add a new exercise to localStorage
     * 
     * This function:
     * 1. Retrieves existing exercises from localStorage
     * 2. Generates a unique ID for the new exercise
     * 3. Adds the exercise to the array
     * 4. Saves the updated array back to localStorage
     * 5. Refreshes the exercise list in the UI
     * 
     * @param {Object} exercise - The exercise object to add (without ID)
     */
    function addExercise(exercise) {
        // Get existing exercises from localStorage
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];

        // Generate a unique ID for the new exercise (max ID + 1)
        const maxId = exercises.reduce((max, ex) => Math.max(max, ex.id), 0);
        exercise.id = maxId + 1;  // Assign the new ID to the exercise

        // Add the new exercise to the array
        exercises.push(exercise);

        // Save the updated array back to localStorage
        localStorage.setItem('exercises', JSON.stringify(exercises));

        // Refresh the exercise list in the UI
        displayExercises();
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
     * Handle workout form submission
     * 
     * This event handler:
     * 1. Validates the form data (authentication, exercise selection, weight, reps)
     * 2. Creates a workout object from the form data
     * 3. Saves the workout to localStorage
     * 4. Updates the UI after successful submission
     * 
     * Unlike the Python+JavaScript version, this saves directly to localStorage
     * instead of sending a request to a server API.
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
            id: Date.now(),                      // Use timestamp as unique ID
            exercise_id: selectedExercise.id,    // ID of the selected exercise
            exercise_name: selectedExercise.name, // Name of the exercise (for display)
            weight: weight,                      // Weight used (in lbs)
            reps: reps,                          // Number of repetitions
            date: new Date().toISOString()       // Current date and time
        };

        // Save workout to localStorage
        if (saveWorkout(workout)) {
            // Reset the form for a new entry
            workoutForm.reset();
            clearSelectionBtn.click();  // Clear selected exercise

            // Refresh workout history to show the new workout
            displayWorkoutHistory();

            // Show success message
            showFlashMessage('Workout saved successfully!');
        }
    });

    /**
     * Save a workout to localStorage
     * 
     * This function:
     * 1. Checks if the user is logged in
     * 2. Adds the user ID to the workout object
     * 3. Retrieves existing workouts from localStorage
     * 4. Adds the new workout to the array
     * 5. Saves the updated array back to localStorage
     * 
     * @param {Object} workout - The workout object to save
     * @returns {boolean} True if the workout was saved successfully, false otherwise
     */
    function saveWorkout(workout) {
        // Authentication check - ensure user is logged in
        if (!currentUser) {
            showFlashMessage('Please log in to save workouts');
            return false;
        }

        // Add user_id to the workout for filtering in displayWorkoutHistory
        workout.user_id = currentUser.id;

        // Get existing workouts from localStorage
        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];

        // Add the new workout to the array
        workouts.push(workout);

        // Save the updated array back to localStorage
        localStorage.setItem('workouts', JSON.stringify(workouts));

        return true;  // Indicate successful save
    }

    /**
     * Display workout history in the UI
     * 
     * This function:
     * 1. Checks if the user is logged in
     * 2. Retrieves all workouts from localStorage
     * 3. Filters workouts to show only those belonging to the current user
     * 4. Sorts workouts by date (newest first)
     * 5. Creates DOM elements for each workout using the HTML template
     * 
     * Unlike the Python+JavaScript version, this function filters workouts
     * client-side rather than relying on the server to filter by user.
     */
    function displayWorkoutHistory() {
        // Authentication check - ensure user is logged in
        if (!currentUser) {
            workoutHistory.innerHTML = '<p>Please log in to view your workout history.</p>';
            return;
        }

        // Get all workouts from localStorage
        const allWorkouts = JSON.parse(localStorage.getItem('workouts')) || [];

        // Filter workouts to show only those belonging to the current user
        // This is a key difference from the Python+JavaScript version, where
        // the server would only return workouts for the authenticated user
        const userWorkouts = allWorkouts.filter(workout => 
            workout.user_id === currentUser.id
        );

        // Clear the current workout history
        workoutHistory.innerHTML = '';

        // Handle empty state - show a message if no workouts are available
        if (userWorkouts.length === 0) {
            workoutHistory.innerHTML = '<p>No workout history available.</p>';
            return;
        }

        // Sort workouts by date (newest first)
        userWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Process each workout and add it to the DOM
        userWorkouts.forEach(workout => {
            // Clone the workout history template to create a new workout element
            const workoutElement = document.importNode(workoutHistoryTemplate.content, true);

            // Get references to elements within the cloned template
            const date = workoutElement.querySelector('.workout-date');
            const exercise = workoutElement.querySelector('.workout-exercise');
            const weight = workoutElement.querySelector('.workout-weight');
            const reps = workoutElement.querySelector('.workout-reps');

            // Format the date for display
            date.textContent = new Date(workout.date).toLocaleDateString();

            // Populate the workout element with data from the workout object
            exercise.textContent = workout.exercise_name;
            weight.textContent = workout.weight;
            reps.textContent = workout.reps;

            // Add the completed workout element to the workout history
            workoutHistory.appendChild(workoutElement);
        });
    }

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
     * 1. Validates the form data (required fields, unique name)
     * 2. Creates a new exercise object from the form data
     * 3. Adds the exercise to localStorage
     * 4. Updates the UI after successful submission
     * 
     * Unlike the Python+JavaScript version, this doesn't generate an SVG image
     * on the server - it just uses the provided image path.
     */
    addExerciseForm.addEventListener('submit', function(event) {
        event.preventDefault();  // Prevent the form from submitting normally

        // Get and trim form values
        const name = document.getElementById('exercise-name').value.trim();
        const muscleGroup = document.getElementById('muscle-group').value.trim();
        const description = document.getElementById('description').value.trim();
        const imagePath = document.getElementById('image-path').value;  // Image path input

        // Validate required fields
        if (!name || !muscleGroup || !description || !imagePath) {
            showFlashMessage('All fields are required.');
            return;
        }

        // Check if exercise with same name already exists (case-insensitive)
        const exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        if (exercises.some(ex => ex.name.toLowerCase() === name.toLowerCase())) {
            showFlashMessage(`An exercise named "${name}" already exists.`);
            return;
        }

        // Create new exercise object from form data
        const newExercise = {
            name: name,                   // Exercise name
            muscle_group: muscleGroup,    // Target muscle group
            description: description,     // Exercise description
            image_path: imagePath         // Path to the exercise image
        };

        // Add the exercise to localStorage using the addExercise function
        addExercise(newExercise);

        // Reset and hide the form
        addExerciseForm.reset();
        addExerciseFormContainer.style.display = 'none';
        showAddExerciseFormBtn.style.display = 'inline-block';

        // Show success message
        showFlashMessage(`Exercise "${name}" added successfully!`);
    });

    /**
     * Authentication Event Handlers
     * 
     * These event handlers manage the user interface for authentication,
     * including showing/hiding modals, form submissions, and user feedback.
     */

    /**
     * Show the login modal when the login button is clicked
     */
    loginBtn.addEventListener('click', function() {
        showLoginModal();  // Display the login modal dialog
    });

    /**
     * Show the registration modal when the register button is clicked
     */
    registerBtn.addEventListener('click', function() {
        showRegisterModal();  // Display the registration modal dialog
    });

    /**
     * Handle user logout when the logout button is clicked
     */
    logoutBtn.addEventListener('click', function() {
        const result = logoutUser();  // Call the logoutUser function
        showFlashMessage(result.message);  // Display the result message
    });

    /**
     * Close modals when the close button is clicked
     */
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            hideModals();  // Hide all modal dialogs
        });
    });

    /**
     * Close modals when clicking outside the modal content
     * 
     * This improves user experience by allowing users to close
     * the modal by clicking anywhere outside it.
     */
    window.addEventListener('click', function(event) {
        // Check if the click was on the modal background (not the content)
        if (event.target === loginModal) {
            hideModals();  // Hide all modal dialogs
        }
        if (event.target === registerModal) {
            hideModals();  // Hide all modal dialogs
        }
    });

    /**
     * Handle login form submission
     * 
     * This event handler:
     * 1. Validates the login form data
     * 2. Attempts to log in the user
     * 3. Provides feedback based on the result
     * 
     * Unlike the Python+JavaScript version, this authenticates
     * directly against localStorage instead of sending a request to a server.
     */
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();  // Prevent the form from submitting normally

        // Get form values
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // Validate required fields
        if (!username || !password) {
            showFlashMessage('Please enter both username and password');
            return;
        }

        // Attempt to log in the user
        const result = loginUser(username, password);

        // Handle the login result
        if (result.success) {
            hideModals();  // Hide the login modal
            showFlashMessage(result.message);  // Show success message
            loginForm.reset();  // Clear the form
        } else {
            showFlashMessage(result.message);  // Show error message
        }
    });

    /**
     * Handle registration form submission
     * 
     * This event handler:
     * 1. Validates the registration form data
     * 2. Attempts to register a new user
     * 3. Provides feedback based on the result
     * 
     * Unlike the Python+JavaScript version, this stores the new user
     * directly in localStorage instead of sending a request to a server.
     */
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();  // Prevent the form from submitting normally

        // Get form values
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        // Validate required fields
        if (!username || !email || !password || !confirmPassword) {
            showFlashMessage('All fields are required');
            return;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            showFlashMessage('Passwords do not match');
            return;
        }

        // Attempt to register the user
        const result = registerUser(username, email, password);

        // Handle the registration result
        if (result.success) {
            hideModals();  // Hide the registration modal
            showFlashMessage(result.message);  // Show success message
            registerForm.reset();  // Clear the form
        } else {
            showFlashMessage(result.message);  // Show error message
        }
    });

    /**
     * Application Initialization
     * 
     * This section initializes the application in the following order:
     * 1. Set up localStorage with default data if needed
     * 2. Check authentication status to set up the UI appropriately
     * 3. Display exercises from localStorage
     * 
     * This ensures the application has the necessary data and
     * the UI reflects the current authentication state before
     * displaying content to the user.
     */
    initializeLocalStorage();  // Initialize localStorage with default data if needed
    checkAuth();               // Check authentication status and update UI accordingly
    displayExercises();        // Display exercises from localStorage
});
