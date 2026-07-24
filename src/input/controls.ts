export interface InputState {
  keys: Set<string>;
}

export function createInput(canvas: HTMLCanvasElement): InputState {
  const keys = new Set<string>();

  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)
    ) {
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
  });

  // Фокус на canvas при клике
  canvas.addEventListener("mousedown", () => canvas.focus());
  canvas.tabIndex = 0;

  return { keys };
}

export function cameraVelocity(keys: Set<string>, speed: number): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) dy -= speed;
  if (keys.has("KeyS") || keys.has("ArrowDown")) dy += speed;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= speed;
  if (keys.has("KeyD") || keys.has("ArrowRight")) dx += speed;
  return { dx, dy };
}
