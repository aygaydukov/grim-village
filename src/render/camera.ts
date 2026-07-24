import { TILE_SIZE } from "../sim/types";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export function createCamera(viewW: number, viewH: number, worldW: number, worldH: number): Camera {
  return {
    x: (worldW * TILE_SIZE) / 2 - viewW / 2,
    y: (worldH * TILE_SIZE) / 2 - viewH / 2,
    zoom: 1.35,
    minZoom: 0.55,
    maxZoom: 3.2,
  };
}

export function moveCamera(cam: Camera, dx: number, dy: number): void {
  cam.x += dx / cam.zoom;
  cam.y += dy / cam.zoom;
}

export function zoomCamera(cam: Camera, delta: number, pivotScreenX: number, pivotScreenY: number): void {
  const before = cam.zoom;
  cam.zoom = Math.min(cam.maxZoom, Math.max(cam.minZoom, cam.zoom * (delta > 0 ? 0.9 : 1.1)));
  // Зум к курсору
  cam.x = pivotScreenX / before + cam.x - pivotScreenX / cam.zoom;
  cam.y = pivotScreenY / before + cam.y - pivotScreenY / cam.zoom;
}

export function screenToWorld(cam: Camera, sx: number, sy: number): { x: number; y: number } {
  return {
    x: (sx / cam.zoom + cam.x) / TILE_SIZE,
    y: (sy / cam.zoom + cam.y) / TILE_SIZE,
  };
}

export function clampCamera(cam: Camera, viewW: number, viewH: number, worldW: number, worldH: number): void {
  const mapW = worldW * TILE_SIZE;
  const mapH = worldH * TILE_SIZE;
  const vw = viewW / cam.zoom;
  const vh = viewH / cam.zoom;

  if (mapW <= vw) cam.x = (mapW - vw) / 2;
  else cam.x = Math.min(Math.max(cam.x, 0), mapW - vw);

  if (mapH <= vh) cam.y = (mapH - vh) / 2;
  else cam.y = Math.min(Math.max(cam.y, 0), mapH - vh);
}
