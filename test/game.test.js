const test = require("node:test");
const assert = require("node:assert/strict");
const game = require("../js/game.js");

test("moves a whole top group and rejects moves where it will not all fit", () => {
  const state = { board: [["coral", "blue", "blue", "blue"], ["blue", "blue"], ["blue", "blue", "blue"], ["coral"]], order: ["coral", "blue"], cleared: 0 };
  const result = game.move(state, 0, 1);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.board[0], ["coral"]);
  assert.deepEqual(result.state.board[1], Array(5).fill("blue"));
  assert.equal(result.state.cleared, 0);
  assert.equal(game.move(state, 0, 2).ok, false);
  assert.equal(game.move(state, 0, 3).ok, false);
  assert.equal(game.move(state, 0, 0).ok, false);
  assert.deepEqual(state.board[0], ["coral", "blue", "blue", "blue"]);
});

test("completed stacks wait for their turn, then clear in order including a cascade", () => {
  const state = { board: [Array(5).fill("blue"), ["coral", "coral"], ["coral", "coral", "coral"]], order: ["coral", "blue"], cleared: 0 };
  const result = game.move(state, 1, 2);
  assert.equal(result.ok, true);
  assert.deepEqual(result.clearedColors, ["coral", "blue"]);
  assert.equal(result.state.cleared, 2);
  assert.deepEqual(result.state.board, [[], [], []]);
});

test("generated levels are deterministic and have a valid solution in the displayed order", () => {
  for (let level = 1; level <= 500; level++) {
    const generated = game.generate(level);
    assert.deepEqual(game.generate(level), generated, `level ${level} is deterministic`);
    assert.equal(generated.board.length, generated.order.length + 2 * generated.groups.length);
    assert.equal(generated.groups.reduce((sum, size) => sum + size, 0), generated.board.length);
    assert.ok(generated.board.every((pole) => pole.length <= 5));
    for (const color of generated.order) {
      assert.equal(generated.board.flat().filter((bolt) => bolt === color).length,
        5 * generated.order.filter((item) => item === color).length);
      assert.ok(!generated.board.some((pole) => pole.length === 5 && pole.every((bolt) => bolt === color)));
    }
    let state = { board: generated.board, order: generated.order, cleared: 0 };
    for (const step of generated.solution) {
      const result = game.move(state, step.from, step.to);
      assert.equal(result.ok, true, `level ${level}: ${result.reason}`);
      state = result.state;
    }
    assert.equal(state.cleared, state.order.length, `level ${level} clears`);
    assert.ok(state.board.every((pole) => pole.length === 0));
  }
});

test("large levels have 16 or 20 grouped poles while legacy saves keep their original board", () => {
  assert.deepEqual(game.generate(5).groups, [4, 4, 4, 4]);
  assert.deepEqual(game.generate(10).groups, [5, 5, 5, 5]);
  assert.deepEqual(game.generate(15).groups, [4, 4, 4, 4]);
  const legacy = game.generate(5, true);
  assert.deepEqual(legacy.groups, [6]);
  let state = game.start(5, true);
  for (const step of legacy.solution) {
    const result = game.move(state, step.from, step.to);
    assert.equal(result.ok, true);
    state = result.state;
  }
  assert.equal(state.cleared, state.order.length);
});
