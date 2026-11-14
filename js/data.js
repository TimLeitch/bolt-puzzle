(function (root) {
  const data = {
    capacity: 5,
    emptyPoles: 2,
    maxColors: 5,
    scrambleBase: 12,
    scramblePerColor: 4,
    largeLevelInterval: 5,
    largeGroupCount: 4,
    colors: [
      { id: "coral", name: "Coral", hex: "#ef786c", light: "#ffb5a2", dark: "#b54843", symbol: "●" },
      { id: "blue", name: "Blue", hex: "#719be7", light: "#b9d1ff", dark: "#456ab1", symbol: "◆" },
      { id: "gold", name: "Gold", hex: "#e5b858", light: "#ffe2a0", dark: "#ae7c25", symbol: "★" },
      { id: "mint", name: "Mint", hex: "#79bda2", light: "#c5ecd8", dark: "#478b71", symbol: "▲" },
      { id: "violet", name: "Violet", hex: "#aa8cd2", light: "#e0cafa", dark: "#7655a0", symbol: "■" }
    ]
  };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  root.BoltData = data;
})(globalThis);
