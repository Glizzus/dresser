// Phase 1 review script. Runs the pure engine against the fixture and
// prints the computed Status output for both houses. No build step:
//   node engine/run.ts

import { evaluateStatus } from './engine.ts';
import { DEFAULT_INVARIANTS } from './invariants.ts';
import { FIXTURE, PILE_FIXTURE } from './fixture.ts';
import type { House, InvariantResult } from './types.ts';

function line(): string {
  return '─'.repeat(64);
}

function printInvariant(r: InvariantResult): void {
  const tag = r.satisfied ? '✓' : '✗';
  console.log(`  ${tag} ${r.label}  (have ${r.have} / need ${r.need})`);
  if (!r.satisfied && r.bottleneck) {
    console.log(
      `      bottleneck: ${r.bottleneck.category} (short ${r.bottleneck.shortfall})`,
    );
    console.log(`      fix: ${r.fix}`);
  }
}

function printHouse(house: House): void {
  const status = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, PILE_FIXTURE, house);

  console.log(line());
  console.log(`HOUSE ${house}`);
  console.log(line());

  const banner =
    status.brokenCount === 0
      ? 'All holding'
      : `${status.brokenCount} invariant${status.brokenCount === 1 ? '' : 's'} broken`;
  console.log(`Summary: ${banner}`);
  console.log('');

  console.log('BROKEN');
  if (status.broken.length === 0) console.log('  (none)');
  status.broken.forEach(printInvariant);
  console.log('');

  console.log('HOLDING');
  if (status.holding.length === 0) console.log('  (none)');
  status.holding.forEach(printInvariant);
  console.log('');

  console.log('HAMPER');
  if (status.hamper.length === 0) console.log('  (empty)');
  for (const group of status.hamper) {
    const names = group.items.map((i) => i.name).join(', ');
    console.log(`  ${group.category}: ${names}`);
  }
  console.log('');
}

printHouse('A');
printHouse('B');

// Badge counts that the house switcher will show.
const a = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, PILE_FIXTURE, 'A');
const b = evaluateStatus(DEFAULT_INVARIANTS, FIXTURE, PILE_FIXTURE, 'B');
console.log(line());
console.log(
  `Switcher badges →  House A: ${a.brokenCount} broken   House B: ${b.brokenCount} broken`,
);
console.log(line());
