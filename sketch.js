//basic piece
class Piece {
  constructor(sizeRatio = 0.8, canjump) {
    this.sizeRatio = sizeRatio;
    this.canjump = canjump;
  }
}
//pawn like piece in the board game
class Beliver extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, false);
    this.team = team;
    this.movedir = team == "red" ? 1 : -1;
    this.hasmoved = false;
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
  drawmove(tile) {
    let range = !this.hasmoved ? 2 : 1;
    push();
    fill("grey");
    for (let i = 1; i <= range; i++) {
      let row = tile.row + i * this.movedir;
      const ntile = tiles[row][tile.col];
      if (ntile.piece)
        if (this.canjump) {
          continue;
        } else break;
      circle(
        ntile.x + ntile.size / 2,
        ntile.y + ntile.size / 2,
        (ntile.size * this.sizeRatio) / 2,
      );
    }
    pop();
  }
  move(tile) {
    if (this.movedir > 0) {
    }
  }
}
// Create the board with it's tiles
function createBoard(range) {
  //basic abstraction stuff
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

  rectMode(CORNER);
  let piecetile;
  for (const row of board) {
    for (const tile of row) {
      fill(tile.color);
      if (piececlicked === tile) {
        piecetile = tile;
        continue;
      } else noStroke();
      square(tile.x, tile.y, tile.size);
    }
  }
  if (piecetile) {
    push();
    fill(piecetile.color);
    strokeWeight(3);
    stroke("green");
    square(piecetile.x, piecetile.y, piecetile.size);
    pop();
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

let piececlicked;

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

  const tile = tiles[locationX][locationY];
  const piece = tile.piece;
  if (piececlicked === tile) {
    piececlicked = null;
  } else if (piece) {
    piececlicked = tile;
  }
}
function draw() {
  background("black");
  drawBoard(tiles);
  drawPieces(tiles);
  if (piececlicked) {
    piececlicked.piece.drawmove(piececlicked);
  }
}
