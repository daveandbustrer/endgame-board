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
    push();
    fill(this.team);
    circle(
      tile.x + tile.size / 2,
      tile.y + tile.size / 2,
      tile.size * this.sizeRatio,
    );
    pop();
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
          if (ntile.piece && ntile.piece.team != this.team) {
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
class Knight extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, true, team);
  }
  draw(tile) {
    // temp drawing for knight
    push();
    fill(this.team);
    const offset = (tile.size * (1 - this.sizeRatio)) / 2;
    square(tile.x + offset, tile.y + offset, tile.size * this.sizeRatio);
    pop();
  }
  getmoves(tile) {
    const moves = [];
    const captures = [];

    const offsets = [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ];

    for (const [dr, dc] of offsets) {
      const row = tile.row + dr;
      const col = tile.col + dc;

      if (row < 0 || row >= tiles.length) continue;
      if (col < 0 || col >= tiles[row].length) continue;

      const ntile = tiles[row][col];

      if (ntile.piece) {
        captures.push(ntile);
      } else {
        moves.push(ntile);
      }
    }

    return { moves, captures };
  }
}
class DemonKing extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    push();
    rectMode(CORNER);
    fill(this.team);

    const offset = (tile.size * (1 - this.sizeRatio)) / 2;

    rect(
      tile.x + offset,
      tile.y + offset,
      tile.size * this.sizeRatio,
      tile.size * this.sizeRatio,
    );

    pop();
  }

  // Squares this king attacks, without checking its own safety.
  getattacks(tile) {
    const attacks = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const row = tile.row + dr;
        const col = tile.col + dc;

        if (row < 0 || row >= tiles.length) continue;
        if (col < 0 || col >= tiles[row].length) continue;

        attacks.push(tiles[row][col]);
      }
    }

    return attacks;
  }

  isAttacked(target) {
    for (const row of tiles) {
      for (const source of row) {
        const enemy = source.piece;

        if (!enemy || enemy.team === this.team) continue;

        const dr = target.row - source.row;
        const dc = target.col - source.col;

        if (enemy instanceof Beliver) {
          if (dr === enemy.movedir && Math.abs(dc) === 1) {
            return true;
          }
        } else if (enemy instanceof Knight) {
          if (
            (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
            (Math.abs(dr) === 1 && Math.abs(dc) === 2)
          ) {
            return true;
          }
        } else if (enemy instanceof DemonKing) {
          if (enemy.getattacks(source).includes(target)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  getmoves(tile) {
    const moves = [];
    const captures = [];

    for (const destination of this.getattacks(tile)) {
      const occupant = destination.piece;

      // Cannot land on teammates or capture the opposing king.
      if (occupant && occupant.team === this.team) continue;
      if (occupant instanceof DemonKing) continue;

      const originalPiece = tile.piece;
      let unsafe;

      // Temporarily apply the move, including any capture.
      tile.piece = null;
      destination.piece = this;

      try {
        unsafe = this.isAttacked(destination);
      } finally {
        // Always restore the original board.
        tile.piece = originalPiece;
        destination.piece = occupant;
      }

      if (unsafe) continue;

      if (occupant) {
        captures.push(destination);
      } else {
        moves.push(destination);
      }
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
    [DemonKing],
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
    [Knight],
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
    [Knight],
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
    [Knight],
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
    [Knight],
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
    [DemonKing],
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
let turn = settings.teamOne;

function setup() {
  createCanvas(windowWidth, windowHeight);

  tiles = createBoard(pieceMap.length);
  createPieces(tiles, pieceMap);
  noStroke();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  boardSizeChanged(pieceMap.length);
}

function mouseClicked() {
  const boardSize = size();
  const tilesize = boardSize / pieceMap.length;

  const offsetX = (width - boardSize) / 2;
  const offsetY = (height - boardSize) / 2;

  const col = floor((mouseX - offsetX) / tilesize);
  const row = floor((mouseY - offsetY) / tilesize);
  if (row >= tiles.length || col >= tiles.length || row < 0 || col < 0) return;

  const tile = tiles[row][col];

  if (piececlicked) {
    if (piececlicked === tile) {
      piececlicked = null;
    } else if (tile.piece && tile.piece.team === piececlicked.piece.team) {
      piececlicked = tile;
    } else {
      const moved = piececlicked.piece.move(piececlicked, tile);
      if (moved) {
        piececlicked = null;
        if (turn == settings.teamOne) turn = settings.teamTwo;
        else turn = settings.teamOne;
      }
    }
  } else if (tile.piece && tile.piece.team === turn) {
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
