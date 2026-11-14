(function () {
  const game = window.BoltGame;
  const colors = Object.fromEntries(window.BoltData.colors.map((color) => [color.id, color]));
  const storageKey = "bolt-puzzle-v1";
  const boardElement = document.getElementById("board");
  const orderElement = document.getElementById("color-order");
  const messageElement = document.getElementById("message");
  const storageMessage = document.getElementById("storage-message");
  const undoButton = document.getElementById("undo");
  const nextButton = document.getElementById("next");
  let level = 1;
  let moves = [];
  let state;
  let selected = null;
  let legacy = false;

  function notice(text, error = false) {
    messageElement.textContent = text;
    messageElement.classList.toggle("error", error);
  }

  function storageWarning(text) {
    storageMessage.hidden = false;
    storageMessage.textContent = text;
  }

  function restore() {
    let raw;
    try {
      raw = localStorage.getItem(storageKey);
    } catch (error) {
      storageWarning("Progress could not be loaded or saved in this browser.");
      return;
    }
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (!Number.isSafeInteger(saved.level) || saved.level < 1 || !Array.isArray(saved.moves)) throw new Error("Invalid save");
      if (saved.layoutVersion !== undefined && saved.layoutVersion !== 2) throw new Error("Unsupported save version");
      const savedLegacy = saved.layoutVersion === undefined || saved.legacy === true;
      let restored = game.start(saved.level, savedLegacy);
      for (const step of saved.moves) {
        if (!Array.isArray(step) || step.length !== 2) throw new Error("Invalid move");
        const result = game.move(restored, step[0], step[1]);
        if (!result.ok) throw new Error("Invalid move");
        restored = result.state;
      }
      level = saved.level;
      moves = saved.moves;
      state = restored;
      legacy = savedLegacy;
    } catch (error) {
      storageWarning("The saved game could not be restored. Starting at level 1.");
    }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ level, moves, layoutVersion: 2, legacy }));
    } catch (error) {
      storageWarning("Progress could not be saved in this browser. You can still play this session.");
    }
  }

  function replay() {
    let current = game.start(level, legacy);
    for (const [from, to] of moves) {
      const result = game.move(current, from, to);
      if (!result.ok) throw new Error("Unable to replay saved moves.");
      current = result.state;
    }
    state = current;
  }

  function colorStyle(element, color) {
    element.style.setProperty("--color", color.hex);
    element.style.setProperty("--light", color.light);
    element.style.setProperty("--dark", color.dark);
  }

  function render() {
    document.getElementById("level-label").textContent = `LEVEL ${String(level).padStart(2, "0")}`;
    document.getElementById("move-count").textContent = moves.length.toLocaleString();
    document.getElementById("clear-count").textContent = `${state.cleared} / ${state.order.length}`;
    undoButton.disabled = moves.length === 0;
    nextButton.hidden = state.cleared !== state.order.length;
    orderElement.replaceChildren();
    state.order.forEach((id, index) => {
      const item = document.createElement("li");
      item.className = index < state.cleared ? "done" : index === state.cleared ? "current" : "";
      item.setAttribute("aria-label", `${colors[id].name}: ${index < state.cleared ? "cleared" : index === state.cleared ? "next to clear" : "waiting"}`);
      const chip = document.createElement("span");
      chip.className = "order-chip";
      chip.textContent = colors[id].symbol;
      colorStyle(chip, colors[id]);
      item.append(chip);
      if (index < state.order.length - 1) {
        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "→";
        item.append(arrow);
      }
      orderElement.append(item);
    });

    boardElement.replaceChildren();
    boardElement.classList.toggle("grouped", state.groups.length > 1);
    let offset = 0;
    state.groups.forEach((size, groupIndex) => {
      const group = document.createElement("div");
      group.className = "pole-group";
      if (state.groups.length > 1) {
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", `Pole group ${groupIndex + 1}`);
      }
      state.board.slice(offset, offset + size).forEach((pole, localIndex) => {
        const index = offset + localIndex;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `pole-button${selected === index ? " selected" : ""}`;
        const contents = pole.length ? pole.slice().reverse().map((id) => colors[id].name).join(", ") : "empty";
        button.setAttribute("aria-label", `Pole ${index + 1}, ${pole.length} of 5 bolts. From top: ${contents}`);
        button.setAttribute("aria-pressed", String(selected === index));
        button.disabled = state.cleared === state.order.length;
        const rod = document.createElement("span");
        rod.className = "pole-rod";
        const base = document.createElement("span");
        base.className = "pole-base";
        const stack = document.createElement("span");
        stack.className = "bolt-stack";
        stack.setAttribute("aria-hidden", "true");
        pole.forEach((id) => {
          const bolt = document.createElement("span");
          bolt.className = "bolt";
          const symbol = document.createElement("span");
          symbol.className = "bolt-symbol";
          symbol.textContent = colors[id].symbol;
          bolt.append(symbol);
          colorStyle(bolt, colors[id]);
          stack.append(bolt);
        });
        const number = document.createElement("span");
        number.className = "pole-number";
        number.textContent = String(index + 1).padStart(2, "0");
        button.append(rod, base, stack, number);
        button.addEventListener("click", () => selectPole(index));
        group.append(button);
      });
      boardElement.append(group);
      offset += size;
    });
  }

  function selectPole(index) {
    if (selected === null) {
      if (!state.board[index].length) {
        notice("Choose a pole with bolts first.", true);
        return;
      }
      selected = index;
      notice("Now choose a pole for the matching top bolts.");
    } else if (selected === index) {
      selected = null;
      notice("Selection cleared. Choose a pole to move.");
    } else {
      const result = game.move(state, selected, index);
      if (!result.ok) {
        notice(result.reason, true);
        return;
      }
      moves.push([selected, index]);
      selected = null;
      state = result.state;
      if (state.cleared === state.order.length) {
        notice("Beautifully sorted! Your next level is ready.");
      } else if (result.clearedColors.length) {
        notice(`${result.clearedColors.map((id) => colors[id].name).join(" and ")} cleared! Keep going.`);
      } else {
        notice("Nice move. Pick a pole to keep sorting.");
      }
      save();
    }
    render();
    const active = boardElement.querySelectorAll(".pole-button")[index];
    if (active && !active.disabled) active.focus({ preventScroll: true });
  }

  undoButton.addEventListener("click", () => {
    moves.pop();
    selected = null;
    replay();
    notice("Last move undone.");
    save();
    render();
  });
  document.getElementById("restart").addEventListener("click", () => {
    moves = [];
    selected = null;
    state = game.start(level, legacy);
    notice("Level restarted. You've got this!");
    save();
    render();
  });
  nextButton.addEventListener("click", () => {
    level++;
    moves = [];
    selected = null;
    legacy = false;
    state = game.start(level);
    notice("A fresh puzzle is ready. Pick a pole to start.");
    save();
    render();
  });

  restore();
  if (!state) state = game.start(level);
  if (state.cleared === state.order.length) notice("Beautifully sorted! Your next level is ready.");
  render();
})();
