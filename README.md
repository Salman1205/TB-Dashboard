# TB-Dashboard

## Overview
This project is a web-based dashboard designed to showcase interactive data visualizations and provide an easy-to-navigate user experience. The application is built using HTML, CSS, JavaScript, and D3.js to create advanced visualizations. All the necessary files, including HTML, CSS, JavaScript, and data files, are organized within the `dashboard` folder.

## Project Structure
The project is organized as follows:

```
/dashboard
├── main.html          # Main entry point for the dashboard application
├── /css                # Folder for CSS stylesheets
│   └── style.css       # Main stylesheet
├── /js                 # Folder for JavaScript files
│   └── app.js          # Main JavaScript file
├── /data               # Folder for data files (e.g., JSON or CSV files)
└── /assets             # (Optional) Folder for images or other assets
```

## Tech Stack
- **HTML**: Provides the structure for the web pages.
- **CSS**: Used for styling the application to make it visually appealing.
- **JavaScript**: Adds dynamic behavior and interactivity to the dashboard.
- **D3.js**: Used for creating advanced data visualizations, including interactive charts and graphs.

## Features
- **Interactive Elements**: Utilizes JavaScript and D3.js to provide dynamic content and interactive data visualizations.
- **Responsive Design**: Ensures that the dashboard looks good on all devices, from desktops to mobile devices.
- **Data Handling**: Includes features to read and visualize data using charts and tables.
- **Visualization Types**: The dashboard includes several types of visualizations such as:
  - **Timeline Graph**: A timeline visualization created with D3.js that allows users to explore data over time. It includes interactive controls for zooming and filtering.
  - **Treemap**: A D3.js treemap visualization that represents hierarchical data, allowing users to explore different levels of the dataset. Breadcrumb navigation helps users understand the context.
  - **Sunburst Chart**: A D3.js sunburst visualization to represent hierarchical relationships in a radial layout.
  - **Force-Directed Graph**: A D3.js force-directed graph to visualize relationships between entities.
  - **Map Visualization**: An interactive map created using D3.js that shows geographical data with zoom and pan capabilities.

## Getting Started
These instructions will help you set up and run the project on your local machine.

### Prerequisites
To run this project locally, you will need:

- A modern web browser (e.g., Google Chrome, Mozilla Firefox).
- A code editor for making modifications (e.g., Visual Studio Code, Sublime Text).
- Optionally, a local server like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) for better performance during development.

### Steps to Run the Project
1. **Clone the Repository**

   - Clone the project to your local machine using the following command:
     ```bash
     git clone https://github.com/your-username/your-repo-name.git
     ```

2. **Navigate to the Project Directory**

   - Move into the project directory:
     ```bash
     cd your-repo-name
     ```
   - Navigate to the `dashboard` folder:
     ```bash
     cd dashboard
     ```

3. **Open the Project in Your Code Editor**

   - Open the `dashboard` folder in your preferred code editor.

4. **Run the Application**

   - You can open the `index.html` file directly in your browser.

   - **Optional: Use a Local Server for a Better Development Experience**:

     - **Live Server (VS Code Extension)**:
       - Install the Live Server extension.
       - Right-click `index.html` and select "Open with Live Server".
     - **Python HTTP Server**:
       - If Python is installed, you can start a local server by running:
         ```bash
         python -m http.server
         ```
       - Then open [http://localhost:8000/dashboard](http://localhost:8000/dashboard) in your browser.

## Visualization Features
- **Tooltip**: Each visualization includes tooltips to provide detailed information when hovering over data points.
- **Zoom and Pan**: The map visualization supports zooming and panning, making it easier to explore different regions.
- **Timeline Interaction**: The timeline graph includes interactive controls for filtering data by date range and zooming in on specific time periods.
- **Hierarchical Navigation**: The treemap and sunburst visualizations include breadcrumb navigation, allowing users to drill down into hierarchical data and understand context.

