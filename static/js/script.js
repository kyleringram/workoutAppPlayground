document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const showAddExerciseFormBtn = document.getElementById('show-add-exercise-form');
    const addExerciseFormContainer = document.getElementById('add-exercise-form-container');
    const cancelAddExerciseBtn = document.getElementById('cancel-add-exercise');

    // Show the add exercise form when the button is clicked
    if (showAddExerciseFormBtn) {
        showAddExerciseFormBtn.addEventListener('click', function() {
            addExerciseFormContainer.style.display = 'block';
            showAddExerciseFormBtn.style.display = 'none';
        });
    }

    // Hide the add exercise form when the cancel button is clicked
    if (cancelAddExerciseBtn) {
        cancelAddExerciseBtn.addEventListener('click', function() {
            addExerciseFormContainer.style.display = 'none';
            showAddExerciseFormBtn.style.display = 'inline-block';
        });
    }
});