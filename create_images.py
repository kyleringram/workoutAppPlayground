import os

# Ensure the directory exists
os.makedirs('static/images', exist_ok=True)

# Exercise names and colors
exercises = [
    ('bench_press', 'red', 'Chest'),
    ('squat', 'blue', 'Legs'),
    ('deadlift', 'green', 'Back'),
    ('pullup', 'purple', 'Back'),
    ('bicep_curl', 'orange', 'Arms')
]

# Create a simple SVG image for each exercise
for exercise_name, color, muscle_group in exercises:
    # Create a simple SVG image with text
    svg_content = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="{color}" stroke="black" stroke-width="2"/>
    <text x="150" y="80" font-family="Arial" font-size="24" fill="white" text-anchor="middle">{exercise_name.replace('_', ' ').title()}</text>
    <text x="150" y="120" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Muscle Group: {muscle_group}</text>
</svg>
'''

    # Save the SVG file
    with open(f'static/images/{exercise_name}.svg', 'w') as f:
        f.write(svg_content)

    # Create a symbolic link from .jpg to .svg
    # Since we can't create actual symbolic links in this environment,
    # we'll create a simple HTML file that redirects to the SVG
    html_redirect = f'''<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0;url={exercise_name}.svg">
    <title>Redirecting to {exercise_name.replace('_', ' ').title()}</title>
</head>
<body>
    <p>Redirecting to <a href="{exercise_name}.svg">{exercise_name.replace('_', ' ').title()} SVG</a>...</p>
</body>
</html>
'''

    with open(f'static/images/{exercise_name}.jpg', 'w') as f:
        f.write(html_redirect)

    print(f"Created {exercise_name}.svg and {exercise_name}.jpg (redirect)")

# Create a README file explaining the image situation
readme_content = '''# Exercise Images

This directory contains SVG placeholder images for the exercises used in the application.

## Image Files

The following SVG files are available:

1. `bench_press.svg` - Placeholder for bench press exercise (Chest)
2. `squat.svg` - Placeholder for squat exercise (Legs)
3. `deadlift.svg` - Placeholder for deadlift exercise (Back)
4. `pullup.svg` - Placeholder for pull-up exercise (Back)
5. `bicep_curl.svg` - Placeholder for bicep curl exercise (Arms)

## Note on JPG Files

The application is configured to use JPG files, but for simplicity, we've created SVG placeholders instead.
The .jpg files in this directory are actually HTML redirects to the corresponding SVG files.

In a production environment, you would replace these with actual JPG images of people performing the exercises.

## Image Requirements for Production

- Format: JPG or PNG
- Recommended size: 300x200 pixels
- File size: Less than 100KB each for optimal performance

You can obtain these images from royalty-free stock photo websites or create your own.
'''

with open('static/images/README.md', 'w') as f:
    f.write(readme_content)

print("All exercise placeholder files have been created successfully!")
print("README.md has been updated with information about the placeholder images.")
