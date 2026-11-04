//basic piece
class Piece {
  constructor(sizeRatio = 0.8, team) {
    this.sizeRatio = sizeRatio;
    this.team = team;

    // Red starts at the top and moves down.
    // Blue starts at the bottom and moves up.
    this.direction = team === "red" ? 1 : -1;

    this.hasMoved = false;
  }
  canMoveTo(from, to) {
    return (
      from !== to &&
      from.piece === this &&
      (to.piece === null || to.piece.team !== this.team)
    );
  }

  canMove(from, to, board) {
    return false;
  }

  // Shared movement and capturing.
  move(from, to, board) {
    if (!this.canMoveTo(from, to)) return false;
    if (!this.canMove(from, to, board)) return false;

    to.piece = this;
    from.piece = null;
    this.hasMoved = true;

    return true;
  }

  // helper for pieces that can't jump.
  isPathClear(from, to, board) {
    const rowStep = Math.sign(to.row - from.row);
    const colStep = Math.sign(to.col - from.col);

    const rowDistance = Math.abs(to.row - from.row);
    const colDistance = Math.abs(to.col - from.col);

    // Only straight or diagonal paths are supported.
    if (
      (rowDistance === 0 && colDistance === 0) ||
      (rowDistance !== 0 && colDistance !== 0 && rowDistance !== colDistance)
    ) {
      return false;
    }

    let row = from.row + rowStep;
    let col = from.col + colStep;

    // Check tiles bwetween the points
    while (row !== to.row || col !== to.col) {
      const tile = board.find((tile) => tile.row === row && tile.col === col);

      if (!tile || tile.piece !== null) {
        return false;
      }

      row += rowStep;
      col += colStep;
    }

    return true;
  }
}
//pawn like piece in the board game
class Beliver extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, team);
  }
  //placeholder drawing of the beliver
  draw(tile) {
    fill(this.team);
    circle(
      tile.x + tile.size / 2,
      tile.y + tile.size / 2,
      tile.size * this.sizeRatio,
    );
  }
  canMove(from, to, board) {
    const rowChange = to.row - from.row;
    const colChange = to.col - from.col;

    // Forward movement requires an empty destination.
    if (colChange === 0 && to.piece === null) {
      if (rowChange === this.direction) {
        return true;
      }

      if (!this.hasMoved && rowChange === this.direction * 2) {
        return this.isPathClear(from, to, board);
      }
    }

    // Diagonal movement requires an enemy to capture.
    return (
      Math.abs(colChange) === 1 &&
      rowChange === this.direction &&
      to.piece !== null &&
      to.piece.team !== this.team
    );
  }
}
// Create the board with it's tiles
function createBoard(range) {
  //basic simplification stuff
  const boardSize = size();
  const tilesize = boardSize / range;
  const offsetX = (width - boardSize) / 2;
  const offsetY = (height - boardSize) / 2;

  const board = [];

  for (let row = 0; row < range; row++) {
    for (let col = 0; col < range; col++) {
      board.push({
        row,
        col,
        x: col * tilesize + offsetX,
        y: row * tilesize + offsetY,
        size: tilesize,
        color: (row + col) % 2 === 0 ? "black" : "gold",
        piece: null,
      });
    }
  }
  return board;
}

// Add pieces separately.
function createPieces(board, map) {
  for (const tile of board) {
    const cell = map[tile.row]?.[tile.col];
    const PieceType = cell?.[0];

    tile.piece = PieceType
      ? new PieceType(0.8, tile.row < map.length / 2 ? "red" : "blue")
      : null;
  }
}

function drawBoard(board) {
  push();
  noStroke();
  rectMode(CORNER);

  for (const tile of board) {
    fill(tile.color);
    square(tile.x, tile.y, tile.size);
  }
  pop();
}

function drawPieces(board) {
  push();
  fill("gray");

  for (const tile of board) {
    if (tile.piece !== null) {
      tile.piece.draw(tile);
    }
  }
  pop();
}
// to get the size of the board
const size = () => min(width, height) * 0.9;

const pieceMap = [
  [
    [],
    [],
    [],
    [],
    [],
    [],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [],
    [],
    [],
    [],
    [],
    [],
  ],
  [
    [],
    [],
    [Beliver],
    [],
    [Beliver],
    [],
    [Beliver],
    [],
    [],
    [],
    [Beliver],
    [],
    [Beliver],
    [],
    [Beliver],
    [],
    [],
  ],
  [
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
  ],
  [
    [],
    [],
    [],
    [],
    [Beliver],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [Beliver],
    [],
    [],
    [],
    [],
  ],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
  [
    [],
    [],
    [],
    [],
    [Beliver],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [Beliver],
    [],
    [],
    [],
    [],
  ],
  [
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
  ],
  [
    [],
    [],
    [Beliver],
    [],
    [Beliver],
    [],
    [Beliver],
    [],
    [],
    [],
    [Beliver],
    [],
    [Beliver],
    [],
    [Beliver],
    [],
    [],
  ],
  [
    [],
    [],
    [],
    [],
    [],
    [],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [],
    [],
    [],
    [],
    [],
    [],
  ],
];
//nuber of rows and columns
const range = 4;
let tiles = [];

let selectedTile = null;
let currentTeam = "red";

function setup() {
  createCanvas(windowWidth, windowHeight);

  tiles = createBoard(pieceMap.length);
  createPieces(tiles, pieceMap);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  const boardSize = size();
  const tileSize = boardSize / pieceMap.length;
  const offsetX = (width - boardSize) / 2;
  const offsetY = (height - boardSize) / 2;

  for (const tile of tiles) {
    tile.x = tile.col * tileSize + offsetX;
    tile.y = tile.row * tileSize + offsetY;
    tile.size = tileSize;
  }
}

function draw() {
  background("black");
  drawBoard(tiles);

  if (selectedTile !== null) {
    push();
    noFill();
    stroke("lime");
    strokeWeight(3);
    rectMode(CORNER);

    square(selectedTile.x, selectedTile.y, selectedTile.size);

    pop();
  }

  drawPieces(tiles);
}

function mousePressed() {
  const clickedTile = tiles.find(
    (tile) =>
      mouseX >= tile.x &&
      mouseX < tile.x + tile.size &&
      mouseY >= tile.y &&
      mouseY < tile.y + tile.size,
  );

  if (!clickedTile) {
    selectedTile = null;
    return;
  }

  // Clicking your own piece selects it.
  // Clicking it again deselects it.
  if (clickedTile.piece !== null && clickedTile.piece.team === currentTeam) {
    selectedTile = selectedTile === clickedTile ? null : clickedTile;

    return;
  }

  if (selectedTile === null) return;

  const piece = selectedTile.piece;
  const moved = piece.move(selectedTile, clickedTile, tiles);

  if (moved) {
    selectedTile = null;
    currentTeam = currentTeam === "red" ? "blue" : "red";
  }
}
