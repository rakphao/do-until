import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseDeliverablesSection,
  getPendingDeliverables,
  getCurrentDeliverable,
  areAllDeliverablesDone,
  writeSpec,
  readSpec,
  markDeliverableDone,
} from '../lib/spec.mjs';

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'do-until-test-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('deliverables parsing and logic', () => {
  it('parses markdown with ids and status', () => {
    const content = `
## Deliverables
- [ ] 1. First task
- [x] 2. Second task
- [ ] 3. Third task
`;
    const dels = parseDeliverablesSection(content);
    assert.equal(dels.length, 3);
    assert.equal(dels[0].id, 1);
    assert.equal(dels[0].status, 'pending');
    assert.equal(dels[1].status, 'done');
  });

  it('getPendingDeliverables filters correctly and preserves ids', () => {
    const spec = {
      deliverables: [
        { id: 1, title: 'A', status: 'done' },
        { id: 2, title: 'B', status: 'pending' },
      ],
    };
    const pending = getPendingDeliverables(spec);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, 2);
  });

  it('areAllDeliverablesDone detects completion', () => {
    const done = { deliverables: [{ id: 1, status: 'done' }, { id: 2, status: 'done' }] };
    const notDone = { deliverables: [{ id: 1, status: 'done' }, { id: 2, status: 'pending' }] };
    assert.equal(areAllDeliverablesDone(done), true);
    assert.equal(areAllDeliverablesDone(notDone), false);
  });
});

describe('write / read / mark via public API', () => {
  it('writes spec, reads back, marks deliverable done', () => {
    withTempDir((cwd) => {
      const spec = writeSpec({
        frontmatter: { objective: 'test', confirmed: true },
        deliverables: [
          { title: 'Task A', status: 'pending' },
          { title: 'Task B', status: 'pending' },
        ],
      }, cwd);

      // Read
      const loaded = readSpec(cwd);
      assert.equal(loaded.deliverables.length, 2);
      assert.equal(loaded.deliverables[0].status, 'pending');

      // Mark first one done (index 0)
      const ok = markDeliverableDone(0, cwd);
      assert.equal(ok, true);

      const after = readSpec(cwd);
      assert.equal(after.deliverables[0].status, 'done');
      assert.equal(after.deliverables[1].status, 'pending');

      const pending = getPendingDeliverables(after);
      assert.equal(pending.length, 1);
      assert.equal(pending[0].title, 'Task B');
    });
  });
});