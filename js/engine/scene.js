export function createScene({ enter, exit, update, render }) {
  let entered = false;
  let exited = false;

  return {
    enter(ctx) {
      if (entered) return;
      entered = true;
      if (enter) enter(ctx);
    },
    update(dt) {
      if (!entered || exited) return;
      if (update) update(dt);
    },
    render(ctx, alpha) {
      if (!entered || exited) return;
      if (render) render(ctx, alpha);
    },
    exit(ctx) {
      if (exited) return;
      exited = true;
      if (exit) exit(ctx);
    },
  };
}
