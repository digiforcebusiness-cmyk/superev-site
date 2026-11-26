// Per-car wording built from the catalog, so 132 pages each say something specific.
const fmt = (n) => n.toLocaleString('en-US');

function revCharacter(c) {
  if (c.redline >= 9500) return 'a screaming, motorsport-style top end';
  if (c.redline >= 8500) return 'a high-revving, race-bred top end';
  if (c.redline >= 7200) return 'an eager rush toward the redline';
  if (c.redline >= 6200) return 'a broad, muscular mid-range';
  return 'deep, low-rev torque';
}

export function carParagraphs(c, cat) {
  const first = cat.intro.split('. ')[0].replace(/\.$/, '') + '.';
  const what = c.engine
    ? `The ${c.name} in SuperRev is built around its ${c.engine}: a ${fmt(c.idle)} rpm idle, ${revCharacter(c)} and a ${fmt(c.redline)} rpm redline.`
    : `${c.name} is one of SuperRev's own engine characters: a ${fmt(c.idle)} rpm idle, ${revCharacter(c)} and a ${fmt(c.redline)} rpm redline.`;
  return [
    what,
    `${first} Press Start, hold the pedal and listen to every RPM band blend in real time, with the same layered engine audio the SuperRev app uses. Switch between Exhaust, Intake, Side and Cabin to hear it from different spots around the car.`,
    `In the app, the ${c.name} goes further: GPS mode makes the engine follow your real speed and gear changes while you drive, and acceleration sync makes it respond to your phone's motion.`,
  ];
}

export function carFaq(c) {
  return [
    [`Can I hear the ${c.name} engine sound online?`,
      `Yes. Press Start on this page and hold the pedal (or the Space bar) to rev the ${c.name} from idle to its ${fmt(c.redline)} rpm redline, free in your browser.`],
    [`Can the ${c.name} sound follow my real driving?`,
      `Yes, in the SuperRev app for iPhone and Android. GPS mode turns your real speed into engine RPM and gear changes, so the ${c.name} revs and shifts as you drive.`],
    [`Can the ${c.name} react to my phone's movement?`,
      `Yes. Acceleration sync in the SuperRev app uses your phone's motion sensors, so speeding up or braking changes the engine note instantly.`],
  ];
}

export function carDescription(c) {
  const spec = c.engine ?? 'SuperRev signature engine';
  const full = `Rev the ${c.name} engine sound online: ${spec}, ${fmt(c.redline)} rpm redline. Free in your browser, then hear it follow your real driving in the app.`;
  const short = `Rev the ${c.name} engine sound online: ${spec}, ${fmt(c.redline)} rpm redline. Free in your browser.`;
  const shortest = `Rev the ${c.name} engine sound online, free in your browser, then drive with it in the SuperRev app.`;
  return [full, short, shortest].find((d) => d.length <= 160) ?? shortest.slice(0, 157) + '…';
}

export const HOME_FAQ = [
  ['What is SuperRev?', 'SuperRev is an engine sound simulator for iPhone and Android. It plays real layered engine recordings that follow your driving, with 132 engines from V8 muscle to V12 hypercars.'],
  ['Can I try SuperRev engine sounds online?', 'Yes. Pick any engine above, press Start and hold the pedal or the Space bar to rev it in your browser, free.'],
  ['What is GPS mode?', 'GPS mode is in the SuperRev app. It turns your real speed into engine RPM and gear shifts, so the engine sound follows your car as you drive.'],
  ['What is acceleration sync?', "Acceleration sync is in the SuperRev app. It uses your phone's motion sensors so the engine note rises and falls as you accelerate and brake."],
  ['Does SuperRev work offline?', 'Yes. The app needs no account and no internet connection to play engines.'],
];
