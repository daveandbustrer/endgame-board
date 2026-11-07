//basic piece clss
class Piece {
  constructor(sizeRatio = 0.8, canjump, team) {
    this.sizeRatio = sizeRatio;
    this.canjump = canjump;
    this.hasmoved = false;
    this.team = team;
    this.movedir = team == settings.teamOne ? 1 : -1;
  }
  getmoves(tile) {
    return tile;
  }
  drawmove(tile) {
    const { moves, captures } = this.getmoves(tile);
    push();
    fill("grey");
    for (const move of moves) {
      circle(
        move.x + move.size / 2,
        move.y + move.size / 2,
        (move.size * this.sizeRatio) / 2,
      );
    }
    pop();
    push();
    fill(this.team);
    for (const capture of captures) {
      circle(
        capture.x + capture.size / 2,
        capture.y + capture.size / 2,
        (capture.size * this.sizeRatio) / 2,
      );
    }
    pop();
  }
  move(tile, to) {
    const { moves, captures } = this.getmoves(tile);
    if (moves.includes(to) || captures.includes(to)) {
      to.piece = this;
      tile.piece = null;
      if (!this.hasmoved) {
        this.hasmoved = true;
      }
      return true;
    }
    return false;
  }
}
//pawn like piece in the board game
class Beliver extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, false, team);
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
    let captures = [];
    for (let i = 1; i <= range; i++) {
      let row = tile.row + i * this.movedir;
      if (row >= tiles.length || row < 0) break;
      const ntile = tiles[row][tile.col];
      if (i === 1) {
        for (let i = -1; i <= 1; i += 2) {
          const ncol = tile.col + i;
          const nrow = tiles[row];
          if (ncol >= nrow.length || ncol < 0) continue;
          const ntile = nrow[ncol];
          if (ntile.piece && ntile.piece.team != piececlicked.piece.team) {
            captures.push(ntile);
          }
        }
      }
      if (ntile.piece)
        if (this.canjump) {
          continue;
        } else break;
      moves.push(ntile);
    }
    return { moves, captures };
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
function boardSizeChanged(range) {
  //basic abstraction stuff
  const boardSize = size();
  const tilesize = boardSize / range;
  const offsetX = (width - boardSize) / 2;
  const offsetY = (height - boardSize) / 2;

  for (let row = 0; row < range; row++) {
    for (let col = 0; col < range; col++) {
      let tile = tiles[row][col];
      tile.x = col * tilesize + offsetX;
      tile.y = row * tilesize + offsetY;
      tile.size = tilesize;
    }
  }
  return tiles;
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
  tiles = boardSizeChanged(pieceMap.length);
}

function mouseClicked() {
  const boardSize = size();
  const tilesize = boardSize / pieceMap.length;

  const offsetX = (width - boardSize) / 2;
  const offsetY = (height - boardSize) / 2;

  const locationY = floor((mouseX - offsetX) / tilesize);
  const locationX = floor((mouseY - offsetY) / tilesize);
  if (
    locationX >= tiles.length ||
    locationY >= tiles.length ||
    locationX < 0 ||
    locationY < 0
  )
    return;

  const tile = tiles[locationX][locationY];

  if (piececlicked) {
    if (piececlicked === tile) {
      piececlicked = null;
    } else if (tile.piece && tile.piece.team === piececlicked.piece.team) {
      piececlicked = tile;
    } else {
      const moved = piececlicked.piece.move(piececlicked, tile);
      if (moved) {
        piececlicked = null;
      }
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
