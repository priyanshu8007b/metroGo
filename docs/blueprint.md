# **App Name**: RouteFlow

## Core Features:

- AI Network Constructor: An AI-powered tool that interprets textual descriptions of metro lines and stations to automatically generate the initial graph representation for route planning.
- Interactive Network Builder: A user interface for manually adding, editing, and deleting stations and connections (edges with weights) to define custom metro networks.
- Dynamic Route Search Input: Intuitive UI for selecting source and destination stations from the defined metro network to initiate route calculations.
- Shortest Travel Time Path: Calculates and displays the route with the minimum travel time between selected stations using an optimized Dijkstra's algorithm.
- Minimum Hops Path: Calculates and displays the route with the fewest station stops (minimum hops) between selected stations using Breadth-First Search (BFS).
- Visual Path Highlight: An interactive graph visualization that renders the metro network and dynamically highlights the computed optimal route, providing a clear visual representation.
- Route Details Display: Presents detailed information about the computed route, including total travel time, number of stations traversed, and the sequence of stations.

## Style Guidelines:

- The primary color, reflecting efficiency and analytical clarity, is a robust, medium-dark blue (#2273C3). This color is bold enough to stand out against a lighter background.
- The background features a subtle, cool-toned off-white (#F0F2F4), derived from the primary hue but heavily desaturated to maintain a clean and airy feel for optimal readability.
- An accent color, a bright cyan (#30E8E8), is used to draw attention to interactive elements, highlighted paths, and key call-to-actions, providing a refreshing contrast.
- The main font for headlines and body text is 'Inter' (sans-serif), chosen for its modern, objective, and highly legible characteristics, fitting the analytical nature of route planning.
- For displaying any code snippets or algorithmic complexity notation, 'Source Code Pro' (monospace sans-serif) is recommended to maintain readability and consistency.
- Utilize a set of simple, clear, and geometric icons. Focus on easily recognizable symbols for stations, connections, and directional arrows to enhance usability and spatial understanding within the map view.
- Adopt a map-centric layout where the interactive network visualization dominates the screen. Input fields and route details should be organized in a clean, uncluttered sidebar or overlaid panels to ensure focus on the core map functionality.
- Incorporate subtle and smooth animations for node highlighting, path drawing, and transitions between different route calculations. This will guide user attention and provide feedback without being distracting.