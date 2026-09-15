import { assertEqual, assertTrue } from "./harness.js";
import { advance, STEP, MAX_FRAME } from "../js/engine/loop.js";
import { gridIndexFromClient, keyboardIndexFromCode } from "../js/engine/input.js";
import { createGameClock } from "../js/engine/canvas-game.js";

export function register({ suite, test }) {
  suite("engine: pas de temps fixe", () => {
    test("une frame de 16.67ms produit 1 update", () => {
      const r = advance(0, 1 / 60, { step: STEP, maxFrame: MAX_FRAME });
      assertEqual(r.steps, 1);
    });

    test("une frame de 33.3ms produit 2 updates", () => {
      const r = advance(0, 1 / 30, { step: STEP, maxFrame: MAX_FRAME });
      assertEqual(r.steps, 2);
    });

    test("une frame longue est plafonnée par MAX_FRAME", () => {
      const r = advance(0, 5, { step: STEP, maxFrame: MAX_FRAME });
      assertEqual(r.elapsed, MAX_FRAME);
    });

    test("l'accumulateur est conservé entre deux appels", () => {
      const first = advance(0, 0.01, { step: STEP, maxFrame: MAX_FRAME });
      assertEqual(first.steps, 0);
      const second = advance(first.acc, 0.01, { step: STEP, maxFrame: MAX_FRAME });
      assertEqual(second.steps, 1);
    });

    test("le reste d'accumulateur est inférieur au pas", () => {
      const r = advance(0, 0.05, { step: STEP, maxFrame: MAX_FRAME });
      assertTrue(r.acc < STEP, "acc doit rester < STEP");
    });
  });

  suite("engine: mapping entrées", () => {
    test("clavier 1..9 mappe vers les cases 0..8", () => {
      assertEqual(keyboardIndexFromCode("Digit1", 9), 0);
      assertEqual(keyboardIndexFromCode("Digit9", 9), 8);
      assertEqual(keyboardIndexFromCode("Numpad5", 9), 4);
    });

    test("une touche hors plage renvoie -1", () => {
      assertEqual(keyboardIndexFromCode("KeyA", 9), -1);
      assertEqual(keyboardIndexFromCode("Digit0", 9), -1);
    });

    test("le point touché est converti en index de grille", () => {
      const rect = { left: 0, top: 0, width: 300, height: 300 };
      assertEqual(gridIndexFromClient(50, 50, rect, 3, 3), 0);
      assertEqual(gridIndexFromClient(250, 250, rect, 3, 3), 8);
      assertEqual(gridIndexFromClient(150, 50, rect, 3, 3), 1);
    });

    test("un point hors grille renvoie -1", () => {
      const rect = { left: 0, top: 0, width: 300, height: 300 };
      assertEqual(gridIndexFromClient(-10, 50, rect, 3, 3), -1);
      assertEqual(gridIndexFromClient(400, 50, rect, 3, 3), -1);
    });
  });

  suite("engine: horloge de jeu", () => {
    test("exclut la durée des pauses, y compris imbriquées", () => {
      let now = 1000;
      const clock = createGameClock(() => now);
      assertEqual(clock.now(), 1000);
      clock.setPaused("manual", true);
      now = 4000;
      clock.setPaused("visibility", true);
      clock.setPaused("manual", false);
      now = 6000;
      assertEqual(clock.now(), 1000);
      clock.setPaused("visibility", false);
      now = 6500;
      assertEqual(clock.now(), 1500);
    });
  });
}
