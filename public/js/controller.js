// Per-frame demo logic, separate from the DOM so it can be tested.
import { revBudget } from './engine-core.js';

/**
 * @param engine object with `throttle` and `tick(dt)`
 * @param limitSec seconds of revving before the app card (60 per visit)
 * @param onLimit called once when the budget runs out
 * @param onState called each frame with the engine's RPM state
 */
export function createController({ engine, limitSec = 60, onLimit = () => {}, onState = () => {} }) {
  const budget = revBudget(limitSec);
  let shown = false;
  return {
    frame(dt) {
      const s = engine.tick(Math.min(dt, .05));
      if (s) onState(s);
      if (budget.add(dt, engine.throttle) && !shown) { shown = true; onLimit(); }
      return s;
    },
    dismiss() { /* card hides; audio and revving continue */ },
    get used() { return budget.used; },
  };
}
