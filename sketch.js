//basic piece
class Piece {
  constructor(sizeRatio = 0.8) {
    this.sizeRatio = sizeRatio;
  }
}
//pawn like piece in the board game
class Beliver extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio);
    this.team = team;
    this.moveup = team == "red" ? -1 : 1;
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
  move(tile) {
    if (this.moveup > 0) {
    }
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
    const rowarray = [];
    for (let col = 0; col < range; col++) {
      rowarray.push({
        row,
        col,
        x: col * tilesize + offsetX,
        y: row * tilesize + offsetY,
        size: tilesize,
        color: (row + col) % 2 === 0 ? "white" : "red",
        piece: null,
      });
    }
    board.push(rowarray);
  }
  console.log(board);
  return board;
}

// Add pieces separately.
function createPieces(board, map) {
  for (const row of board) {
    for (const tile of row) {
      const cell = map[tile.row]?.[tile.col];
      const PieceType = cell?.[0];

      tile.piece = PieceType
        ? new PieceType(0.8, tile.row < map.length / 2 ? "red" : "blue")
        : null;
    }
  }
}

function drawBoard(board) {
  push();
  noStroke();
  rectMode(CORNER);

  for (const row of board) {
    for (const tile of row) {
      fill(tile.color);
      square(tile.x, tile.y, tile.size);
    }
  }
  pop();
}

function drawPieces(board) {
  push();
  fill("gray");

  for (const row of board) {
    for (const tile of row) {
      if (tile.piece !== null) {
        tile.piece.draw(tile);
      }
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
let tiles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);

  tiles = createBoard(pieceMap.length);
  createPieces(tiles, pieceMap);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  tiles = createBoard(pieceMap.length);
  createPieces(tiles, pieceMap);
}
function mouseClicked() {
  const boardSize = size();
  const tilesize = boardSize / pieceMap.length;

  const offsetX = (width - boardSize) / 2;
  const offsetY = (height - boardSize) / 2;

  const locationY = floor((mouseX - offsetX) / tilesize);
  const locationX = floor((mouseY - offsetY) / tilesize);

  const piece = tiles[locationX][locationY].piece;
  if (piece) {
    console.log(piece);
  }
}
function draw() {
  background("black");
  drawBoard(tiles);
  drawPieces(tiles);
}
