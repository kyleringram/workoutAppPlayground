# Workout Tracker App

A web application for tracking workouts. Users can select exercises from a database, record the weight and reps for each exercise, and view their workout history.

This repository contains three versions of the app:
1. **Python/Flask Version** (in the root directory) - A server-based application using Python, Flask, and SQLite
2. **JavaScript Version** (in the `js-version` directory) - A client-side application using HTML, CSS, and JavaScript with localStorage
3. **Python+JavaScript Hybrid Version** (in the `py-js-version` directory) - A combination approach using a Python/Flask API backend with a JavaScript frontend

## Features

- User authentication and multiple user support
- Database of exercises with descriptions and muscle group information
- Exercise thumbnails showing targeted muscle groups
- Record workouts with weight and reps
- View workout history by date
- Responsive design for desktop and mobile devices

## Technologies Used

- Python 3
- Flask (Web Framework)
- SQLAlchemy (ORM)
- SQLite (Database)
- HTML/CSS/JavaScript (Frontend)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd WorkoutApp
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Initialize the database (optional - will be done automatically when running the app):
   ```
   flask --app app init-db
   ```
   Note: This step is optional as the database will be automatically initialized when running the application using `run.py`.

5. Add exercise images:
   - Place exercise images in the `static/images` directory
   - Required images: bench_press.jpg, squat.jpg, deadlift.jpg, pullup.jpg, bicep_curl.jpg
   - See `static/images/README.md` for details

## Running the Applications

### Python/Flask Version

You can run the Python/Flask version in two ways:

#### Option 1: Using run.py (Recommended)

1. Run the application using the run.py script:
   ```
   python run.py
   ```
   This script will automatically initialize the database if it doesn't exist and start the Flask development server.

   If you encounter a "Port 5001 is in use" error, you have two options:

   **Option A: Use a different port**
   ```
   python run.py --port 5002
   ```

   **Option B: Find and kill the process using port 5001**

   You can use the included `check_port.py` script to easily find and kill processes:

   ```
   # Check if port 5001 is in use
   python check_port.py

   # Check a different port
   python check_port.py 5002

   # Kill the process using port 5001
   python check_port.py --kill
   ```

   Or manually check using terminal commands:

   - **On macOS/Linux**:
     ```
     lsof -i :5001
     ```
     This will show the process ID (PID) in the second column.

     To kill the process:
     ```
     kill -9 <PID>
     ```

   - **On Windows**:
     ```
     netstat -ano | findstr :5001
     ```
     This will show the process ID (PID) in the last column.

     To kill the process:
     ```
     taskkill /PID <PID> /F
     ```

2. Open a web browser and navigate to:
   ```
   http://127.0.0.1:5001/
   ```
   (If you specified a different port, use that port number instead of 5001)

#### Option 2: Using Flask CLI

This method requires manual database initialization and runs the server on the default port (5000):

1. Initialize the database (if not already done):
   ```
   flask --app app init-db
   ```

2. Start the Flask development server:
   ```
   flask --app app run --debug
   ```

3. Open a web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

Note: This method uses port 5000, while the `run.py` method uses port 5001. Make sure to use the correct port for the method you choose.

### JavaScript Version

Running the JavaScript version is much simpler:

1. Navigate to the js-version directory:
   ```
   cd js-version
   ```

2. Open the index.html file in your web browser:
   - **On macOS**: `open index.html`
   - **On Windows**: Double-click the file or use `start index.html`
   - **On Linux**: `xdg-open index.html`

Alternatively, you can use a simple HTTP server:

1. Navigate to the js-version directory:
   ```
   cd js-version
   ```

2. Start a simple HTTP server:
   - **Using Python 3**: `python -m http.server 8000`
   - **Using Python 2**: `python -m SimpleHTTPServer 8000`

3. Open a web browser and navigate to:
   ```
   http://localhost:8000/
   ```

### Python+JavaScript Hybrid Version

Running the hybrid version:

1. Navigate to the py-js-version directory:
   ```
   cd py-js-version
   ```

2. Initialize the database:
   ```
   flask --app api init-db
   ```

3. Start the Flask API server:
   ```
   python api.py
   ```

4. Open a web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

This version combines a Python/Flask backend API with a JavaScript frontend. The JavaScript code makes API calls to the Python backend for data persistence.

## Usage

1. **Register an Account**: If you're a new user, click on the "Register" link and create an account with a username, email, and password.
2. **Login**: Use your username and password to log in to the application.
3. **Select an Exercise**: Browse the exercise list and click on an exercise to select it.
4. **Record a Workout**: Enter the weight and reps for the selected exercise and click "Save Workout".
5. **View Workout History**: Scroll down to see your workout history, sorted by date.
6. **Logout**: Click the "Logout" button in the top-right corner when you're done.

Note: A default admin user is created during database initialization with the following credentials:
- Username: admin
- Password: admin123

## Testing

To run the tests for the application:

```
python run_tests.py
```

This will run all the unit tests and display the results.

## Project Structure

### Python/Flask Version (Root Directory)
```
WorkoutApp/
├── app.py                  # Main application file with Flask CLI commands
├── run.py                  # Script to run the application (auto-initializes DB)
├── check_port.py           # Utility to check/kill processes using a specific port
├── init_db.py              # Deprecated script for database initialization
├── test_app.py             # Unit tests for the application
├── run_tests.py            # Script to run the tests
├── requirements.txt        # Python dependencies
├── README.md               # This file
├── static/                 # Static files
│   ├── css/                # CSS stylesheets
│   │   └── style.css       # Main stylesheet
│   ├── js/                 # JavaScript files
│   │   └── script.js.bak   # Backup of JavaScript file (not used)
│   └── images/             # Exercise images
│       └── README.md       # Image requirements
└── templates/              # HTML templates
    ├── index.html          # Main page template
    ├── login.html          # Login page template
    └── register.html       # Registration page template
```

### JavaScript Version (js-version Directory)
```
WorkoutApp/js-version/
├── index.html              # Main HTML file
├── README.md               # JavaScript version documentation
└── static/                 # Static files
    ├── css/                # CSS stylesheets
    │   └── style.css       # Main stylesheet (same as Python version)
    ├── js/                 # JavaScript files
    │   └── script.js       # Main JavaScript file
    └── images/             # Exercise images (same as Python version)
```

### Python+JavaScript Hybrid Version (py-js-version Directory)
```
WorkoutApp/py-js-version/
├── api.py                  # Python/Flask API backend
├── README.md               # Hybrid version documentation
├── templates/              # HTML templates
│   └── index.html          # Main page template with JavaScript integration
└── static/                 # Static files
    ├── css/                # CSS stylesheets
    │   └── style.css       # Main stylesheet
    └── js/                 # JavaScript files
        └── script.js       # JavaScript for frontend and API communication
```

## Choosing Between Versions

### Python/Flask Version (Server-based)

**Advantages:**
- Data is stored in a SQLite database, allowing for persistent storage across devices
- Supports multiple users with authentication
- Sensitive data can be protected on the server
- SQL can be used for complex data analysis and reporting
- Can be integrated with other systems and APIs

**When to use:**
- When you need to store data centrally for multiple users
- When you need advanced data analysis capabilities
- When you plan to extend the app with more complex features
- When security of data is a priority

### JavaScript Version (Client-side)

**Advantages:**
- Works directly in the browser without any setup
- Can work without an internet connection
- No server-side code or database setup needed
- Can be run from any device with a web browser
- Just copy the files to any web server or open locally

**When to use:**
- When you need a quick, simple solution for personal use
- When you don't want to set up and maintain a server
- When offline capability is important
- When you want to run the app locally without installation

For more details on the JavaScript version, see the [JavaScript Version README](js-version/README.md).

### Python+JavaScript Hybrid Version (API-based)

**Advantages:**
- Combines the best of both approaches
- Server-side data persistence with a dynamic frontend
- No page reloads for a smoother user experience
- Clear separation between frontend and backend
- Scalable architecture for larger applications
- RESTful API can be used by other clients (mobile apps, etc.)

**When to use:**
- When you need both server-side persistence and a dynamic UI
- When building a single-page application (SPA)
- When you want to separate frontend and backend concerns
- When you might need to support multiple client applications
- When you're building a more complex application that needs to scale

For more details on the hybrid version, see the [Python+JavaScript Hybrid Version README](py-js-version/README.md).

## Future Enhancements

- Workout plans and routines
- Progress tracking with charts and statistics
- Exercise search and filtering
- Custom exercise creation

## License

[MIT License](LICENSE)
