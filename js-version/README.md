# Workout Tracker App - JavaScript Version

This is the JavaScript version of the Workout Tracker App. It provides the same functionality as the Python/Flask version but is implemented using pure JavaScript with client-side storage.

## Features

- Database of exercises with descriptions and muscle group information
- Exercise thumbnails showing targeted muscle groups
- Record workouts with weight and reps
- View workout history by date
- Responsive design for desktop and mobile devices

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- localStorage API for data persistence

## Usage

1. Simply open the `index.html` file in a web browser
2. No server setup or installation required
3. Select an exercise, enter weight and reps, and save your workout
4. View your workout history below

## Differences Between Versions

### Python/Flask Version

The original Python/Flask version of the app has the following characteristics:

#### Advantages
- **Server-side processing**: Data is stored in a SQLite database, allowing for persistent storage across devices
- **Scalability**: Can be extended to support multiple users with authentication
- **Security**: Sensitive data can be protected on the server
- **Advanced queries**: SQL can be used for complex data analysis and reporting
- **Integration**: Can be integrated with other systems and APIs

#### Disadvantages
- **Setup required**: Needs Python, Flask, and dependencies to be installed
- **Deployment complexity**: Requires a server to host the application
- **Maintenance**: Server needs to be maintained and updated

#### When to use
- When you need to store data centrally for multiple users
- When you need advanced data analysis capabilities
- When you plan to extend the app with more complex features
- When security of data is a priority
- When you have the resources to maintain a server

### JavaScript Version

The JavaScript version of the app has the following characteristics:

#### Advantages
- **No installation required**: Works directly in the browser without any setup
- **Offline capability**: Can work without an internet connection
- **Simplicity**: No server-side code or database setup needed
- **Portability**: Can be run from any device with a web browser
- **Easy deployment**: Just copy the files to any web server or open locally

#### Disadvantages
- **Local storage only**: Data is stored in the browser's localStorage, which is limited to the device
- **Storage limitations**: localStorage has size limitations (typically 5-10MB)
- **Simple authentication**: User data is stored in localStorage without proper encryption
- **Limited data processing**: Complex queries and data analysis are more difficult

#### When to use
- When you need a quick, simple solution for personal use
- When you don't want to set up and maintain a server
- When offline capability is important
- When you want to run the app locally without installation
- When you're prototyping or learning web development

## Authentication System

This version includes a simple client-side authentication system:

1. **User Registration**: New users can create accounts with username, email, and password
2. **User Login**: Existing users can log in with their credentials
3. **User-specific Data**: Each user can only see and manage their own workout data

### How Authentication Works

The authentication system in this version is entirely client-side:

1. User credentials are stored in the browser's localStorage
2. Passwords are stored in plain text (not secure for production use)
3. User sessions persist until the user logs out or clears browser data
4. Each workout is associated with a specific user ID
5. The UI displays only workouts belonging to the currently logged-in user

### Default User

A default user is created for demonstration purposes:
- Username: `demo`
- Password: `password`

## Getting Started

1. Download or clone the repository
2. Open `js-version/index.html` in your web browser
3. Log in with the default user or create your own account
4. Start tracking your workouts!

## Browser Compatibility

This app works in all modern browsers that support:
- ES6+ JavaScript
- localStorage API
- HTML5 Template elements

## License

[MIT License](LICENSE)
