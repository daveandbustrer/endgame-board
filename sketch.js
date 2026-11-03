// to get the size of the board
const size = () => min(width, height) * 0.9;

let tiles = [];
//nuber of rows and columns
const range = 2;

//basic piece
class Piece {
  constructor(sizeRatio = 0.8) {
    this.sizeRatio = sizeRatio;
  }
}
//pawn like piece in the board game
class Beliver extends Piece {
  constructor(sizeRatio) {
    super(sizeRatio);
  }
  //placeholder drawing of the beliver
  draw(tile) {
    circle(
      tile.x + tile.size / 2,
      tile.y + tile.size / 2,
      tile.size * this.sizeRatio,
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
        color: (row + col) % 2 === 0 ? "white" : "red",
        piece: null,
      });
    }
  }
  return board;
}

// Add pieces separately.
function createPieces(board) {
  for (const tile of board) {
    tile.piece = new Beliver();
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
  noStroke();
  fill("gray");

  for (const tile of board) {
    if (tile.piece !== null) {
      tile.piece.draw(tile);
    }
  }
  pop();
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  tiles = createBoard(range);
  createPieces(tiles);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Update tile geometry
  const boardSize = size();
  const tilesize = boardSize / range;
  const offsetX = (width - boardSize) / 2;
  const offsetY = (height - boardSize) / 2;

  for (const tile of tiles) {
    tile.x = tile.col * tilesize + offsetX;
    tile.y = tile.row * tilesize + offsetY;
    tile.size = tilesize;
  }
}

function draw() {
  background("black");
  drawBoard(tiles);
  drawPieces(tiles);
}
