//basic piece
class Piece {
  constructor(sizeRatio = 0.8, canjump) {
    this.sizeRatio = sizeRatio;
    this.canjump = canjump;
  }
  getmoves() {
    return null;
  }
  drawmove(tile) {
    push();
    fill("grey");
    for (const move of this.getmoves(tile)) {
      circle(
        move.x + move.size / 2,
        move.y + move.size / 2,
        (move.size * this.sizeRatio) / 2,
      );
    }
    pop();
  }
  move(tile, to) {
    if (this.getmoves(tile).includes(to)) {
      to.piece = this;
      tile.piece = null;
    }
  }
}
//pawn like piece in the board game
class Beliver extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, false);
    this.team = team;
    this.movedir = team == settings.teamOne ? 1 : -1;
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
  getmoves(tile) {
    let range = !this.hasmoved ? 2 : 1;
    let moves = [];
    for (let i = 1; i <= range; i++) {
      let row = tile.row + i * this.movedir;
      const ntile = tiles[row][tile.col];
      if (ntile.piece)
        if (this.canjump) {
          continue;
        } else break;
      moves.push(ntile);
    }
    return moves;
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
        color: (row + col) % 2 === 0 ? settings.colorTwo : settings.colorOne,
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
        ? new PieceType(
            0.8,
            tile.row < map.length / 2 ? settings.teamOne : settings.teamTwo,
          )
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
const settings = {
  teamOne: "red",
  teamTwo: "blue",
  colorOne: "black",
  colorTwo: "gold",
};
let tiles = [];

let piececlicked;

function setup() {
  createCanvas(windowWidth, windowHeight);

  tiles = createBoard(pieceMap.length);
  createPieces(tiles, pieceMap);
  noStroke();
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

  if (piececlicked) {
    if (piececlicked === tile) {
      piececlicked = null;
    } else {
      piececlicked.piece.move(piececlicked, tile);
      if (tile.piece) {
        piececlicked = tile;
      } else piececlicked = null;
    }
  } else if (tile.piece) {
    piececlicked = tile;
  }
}
function draw() {
  background("black");
  drawBoard(tiles);
  drawPieces(tiles);
  if (piececlicked) {
    if (piececlicked.piece) piececlicked.piece.drawmove(piececlicked);
  }
}
