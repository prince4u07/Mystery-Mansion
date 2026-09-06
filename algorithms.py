"""Graph algorithms used by Mystery Mansion.

Each search returns a trace for the visualizer as well as the final route.
"""
from __future__ import annotations

from collections import deque
from heapq import heappop, heappush
from typing import Callable, Hashable

Node = Hashable
Graph = dict[Node, list[tuple[Node, float]]]
Heuristic = Callable[[Node, Node], float]


def _result(visited: list[Node], parents: dict[Node, Node], start: Node, target: Node) -> dict:
    path: list[Node] = []
    current: Node | None = target
    while current is not None:
        path.append(current)
        if current == start:
            path.reverse()
            return {"visited": visited, "path": path, "path_length": len(path) - 1, "edges_checked": max(0, len(visited) - 1)}
        current = parents.get(current)
    return {"visited": visited, "path": [], "path_length": 0, "edges_checked": max(0, len(visited) - 1)}


def bfs(graph: Graph, start: Node, target: Node) -> dict:
    """Breadth-first search: shortest route by number of edges."""
    queue = deque([start])
    visited = [start]
    seen = {start}
    parents: dict[Node, Node] = {}
    while queue:
        node = queue.popleft()
        if node == target:
            break
        for neighbor, _ in graph.get(node, []):
            if neighbor not in seen:
                seen.add(neighbor)
                parents[neighbor] = node
                visited.append(neighbor)
                queue.append(neighbor)
    return _result(visited, parents, start, target)


def dfs(graph: Graph, start: Node, target: Node) -> dict:
    """Depth-first search: explores one branch deeply before backtracking."""
    stack = [start]
    seen: set[Node] = set()
    visited: list[Node] = []
    parents: dict[Node, Node] = {}
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        seen.add(node)
        visited.append(node)
        if node == target:
            break
        for neighbor, _ in reversed(graph.get(node, [])):
            if neighbor not in seen:
                parents[neighbor] = node
                stack.append(neighbor)
    return _result(visited, parents, start, target)


def dijkstra(graph: Graph, start: Node, target: Node) -> dict:
    """Dijkstra's algorithm: least-cost route for non-negative edge weights."""
    distances = {start: 0.0}
    parents: dict[Node, Node] = {}
    queue = [(0.0, start)]
    visited: list[Node] = []
    while queue:
        distance, node = heappop(queue)
        if distance != distances.get(node):
            continue
        visited.append(node)
        if node == target:
            break
        for neighbor, weight in graph.get(node, []):
            candidate = distance + weight
            if candidate < distances.get(neighbor, float("inf")):
                distances[neighbor] = candidate
                parents[neighbor] = node
                heappush(queue, (candidate, neighbor))
    result = _result(visited, parents, start, target)
    result["cost"] = distances.get(target)
    return result


def a_star(graph: Graph, start: Node, target: Node, heuristic: Heuristic) -> dict:
    """A*: least-cost search guided by an admissible heuristic."""
    costs = {start: 0.0}
    parents: dict[Node, Node] = {}
    queue = [(heuristic(start, target), 0.0, start)]
    visited: list[Node] = []
    while queue:
        _, cost, node = heappop(queue)
        if cost != costs.get(node):
            continue
        visited.append(node)
        if node == target:
            break
        for neighbor, weight in graph.get(node, []):
            candidate = cost + weight
            if candidate < costs.get(neighbor, float("inf")):
                costs[neighbor] = candidate
                parents[neighbor] = node
                heappush(queue, (candidate + heuristic(neighbor, target), candidate, neighbor))
    result = _result(visited, parents, start, target)
    result["cost"] = costs.get(target)
    return result


def backtracking(graph: Graph, start: Node, target: Node) -> dict:
    """Backtracking path finder, useful for puzzle locks and constraint paths."""
    visited: list[Node] = []
    path: list[Node] = []
    seen: set[Node] = set()

    def search(node: Node) -> bool:
        visited.append(node)
        path.append(node)
        if node == target:
            return True
        seen.add(node)
        for neighbor, _ in graph.get(node, []):
            if neighbor not in seen and search(neighbor):
                return True
        path.pop()
        return False

    search(start)
    return {"visited": visited, "path": path, "path_length": max(0, len(path) - 1), "edges_checked": max(0, len(visited) - 1)}