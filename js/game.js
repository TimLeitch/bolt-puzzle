(function (root) {
  const data = typeof module !== "undefined" && module.exports ? require("./data.js") : root.BoltData;
  const capacity = data.capacity;

  function randomFor(seed) {
    let value = seed >>> 0;
    return function () {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function clone(board) {
    return board.map((pole) => pole.slice());
  }

  function topCount(pole) {
    const color = pole[pole.length - 1];
    let count = 0;
    for (let i = pole.length - 1; i >= 0 && pole[i] === color; i--) count++;
    return count;
  }

  function generateGroup(seed, colorCount) {
    const colors = data.colors.slice(0, colorCount).map((color) => color.id);
    const random = randomFor(seed);
    const targetSteps = data.scrambleBase + colorCount * data.scramblePerColor;

    // Reverse moves from sorted stacks; each inverse move transfers one complete top group.
    for (let attempt = 0; attempt < 200; attempt++) {
      const board = colors.map((color) => Array(capacity).fill(color));
      for (let i = 0; i < data.emptyPoles; i++) board.push([]);
      const broken = new Set();
      const breakOrder = [];
      const reverseMoves = [];
      const seen = new Set([JSON.stringify(board)]);

      for (let step = 0; step < targetSteps; step++) {
        const candidates = [];
        for (let from = 0; from < board.length; from++) {
          const source = board[from];
          if (!source.length) continue;
          const color = source[source.length - 1];
          const count = topCount(source);
          for (let to = 0; to < board.length; to++) {
            const dest = board[to];
            if (from === to || (dest.length && dest[dest.length - 1] === color)) continue;
            for (let amount = 1; amount <= Math.min(count, capacity - dest.length); amount++) {
              if (!dest.length && amount === capacity) continue;
              if (amount === count && count < source.length) continue;
              const next = clone(board);
              next[from].splice(-amount);
              next[to].push(...Array(amount).fill(color));
              if (seen.has(JSON.stringify(next))) continue;
              candidates.push({ from, to, amount, color, next });
            }
          }
        }
        if (!candidates.length) break;
        const breaking = candidates.filter((move) => !broken.has(move.color));
        const pool = breaking.length ? breaking : candidates;
        const move = pool[Math.floor(random() * pool.length)];
        if (!broken.has(move.color)) {
          broken.add(move.color);
          breakOrder.push(move.color);
        }
        board.splice(0, board.length, ...move.next);
        seen.add(JSON.stringify(board));
        reverseMoves.push({ from: move.to, to: move.from });
      }
      if (broken.size === colorCount && reverseMoves.length >= colorCount * 2) {
        return { board, order: breakOrder.reverse(), solution: reverseMoves.reverse() };
      }
    }
    throw new Error("Could not generate a playable level. Please try again.");
  }

  function generate(level, legacy = false) {
    if (!Number.isSafeInteger(level) || level < 1) throw new Error("Level must be a positive whole number.");
    if (legacy || level % data.largeLevelInterval !== 0) {
      const colorCount = Math.min(data.maxColors, 3 + Math.floor((level - 1) / 4));
      const result = generateGroup(level, colorCount);
      return { ...result, groups: [result.board.length] };
    }

    const colorCount = (level / data.largeLevelInterval) % 2 === 1 ? 2 : 3;
    const board = [];
    const order = [];
    const solution = [];
    const groups = [];
    for (let i = 0; i < data.largeGroupCount; i++) {
      const group = generateGroup((Math.imul(level, 101) + i * 7919) >>> 0, colorCount);
      const offset = board.length;
      board.push(...group.board);
      order.push(...group.order);
      solution.push(...group.solution.map((step) => ({ from: step.from + offset, to: step.to + offset })));
      groups.push(group.board.length);
    }
    return { board, order, solution, groups };
  }

  function move(state, from, to) {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from === to ||
        from < 0 || to < 0 || from >= state.board.length || to >= state.board.length) {
      return { ok: false, reason: "Choose two different poles." };
    }
    const source = state.board[from];
    const dest = state.board[to];
    if (!source.length) return { ok: false, reason: "That pole has no bolts to move." };
    const color = source[source.length - 1];
    const count = topCount(source);
    if (dest.length && dest[dest.length - 1] !== color) {
      return { ok: false, reason: "Bolts can only go on the same color or an empty pole." };
    }
    if (dest.length + count > capacity) {
      return { ok: false, reason: `All ${count} matching bolt${count === 1 ? "" : "s"} must fit on the pole.` };
    }
    const board = clone(state.board);
    board[from].splice(-count);
    board[to].push(...Array(count).fill(color));
    let cleared = state.cleared;
    const clearedColors = [];
    while (cleared < state.order.length) {
      const next = state.order[cleared];
      const index = board.findIndex((pole) => pole.length === capacity && pole.every((bolt) => bolt === next));
      if (index === -1) break;
      board[index] = [];
      clearedColors.push(next);
      cleared++;
    }
    return { ok: true, state: { board, order: state.order.slice(), cleared, groups: state.groups }, clearedColors };
  }

  function start(level, legacy = false) {
    const generated = generate(level, legacy);
    return { board: generated.board, order: generated.order, cleared: 0, groups: generated.groups };
  }

  const api = { generate, move, start, topCount };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BoltGame = api;
})(globalThis);
