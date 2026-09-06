# Pathfinder Arcade

A browser-based Pac-Man game that demonstrates pathfinding through ghost behavior.

## Run

```powershell
python server.py
```

Open <http://127.0.0.1:8000>.

## Controls

Use the arrow keys or `WASD` to move. Collect pellets, use power pellets to frighten ghosts, and survive the maze.

## Ghost AI

- **Blinky:** A* direct target tracking
- **Pinky:** BFS shortest-route chase
- **Inky:** DFS scatter exploration
