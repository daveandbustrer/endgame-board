// --------------------------------------------------
// Basic piece class
// --------------------------------------------------

class Piece {
  constructor(sizeRatio = 0.8, canjump = false, team = null) {
    this.sizeRatio = sizeRatio;
    this.canjump = canjump;
    this.hasmoved = false;
    this.team = team;
    this.movedir = team === settings.teamOne ? 1 : -1;
  }

  // Every piece returns the same shape of result.
  getmoves(tile) {
    return { moves: [], captures: [] };
  }

  getLegalMoves(tile) {
    if (!tile || tile.piece !== this) {
      return { moves: [], captures: [] };
    }

    const { moves, captures } = this.getmoves(tile);

    const isSafe = (destination) => {
      const occupant = destination.piece;

      if (occupant && occupant.team === this.team) return false;
      if (occupant instanceof DemonKing) return false;

      // Test the board without changing turn or hasmoved.
      tile.piece = null;
      destination.piece = this;

      try {
        return !isTeamInCheck(this.team);
      } finally {
        tile.piece = this;
        destination.piece = occupant;
      }
    };

    return {
      moves: moves.filter(isSafe),
      captures: captures.filter(isSafe),
    };
  }

  drawmove(tile, available = null) {
    const { moves, captures } = available || this.getLegalMoves(tile);

    push();
    noStroke();
    fill(190, 195, 205, 170);

    for (const move of moves) {
      circle(move.x + move.size / 2, move.y + move.size / 2, move.size * 0.22);
    }

    noFill();
    stroke(this.team);
    strokeWeight(max(2, tile.size * 0.07));

    for (const capture of captures) {
      circle(
        capture.x + capture.size / 2,
        capture.y + capture.size / 2,
        capture.size * 0.82,
      );
    }

    pop();
  }

  move(tile, to) {
    if (!tile || !to || tile.piece !== this || tile === to) {
      return false;
    }

    const { moves, captures } = this.getLegalMoves(tile);

    if (!moves.includes(to) && !captures.includes(to)) {
      return false;
    }

    to.piece = this;
    tile.piece = null;
    this.hasmoved = true;

    return true;
  }
}

// --------------------------------------------------
// Piece movement and drawing
// --------------------------------------------------

// Pawn-like piece.
class Beliver extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    drawPieceShape(tile, this, "beliver");
  }

  getmoves(tile) {
    const moves = [];
    const captures = [];
    const range = this.hasmoved ? 1 : 2;

    // Forward movement stops at the first occupied tile.
    for (let distance = 1; distance <= range; distance++) {
      const destination = getTile(tile.row + distance * this.movedir, tile.col);

      if (!destination || destination.piece) break;
      moves.push(destination);
    }

    // Captures are separate from forward movement.
    for (const dc of [-1, 1]) {
      const destination = getTile(tile.row + this.movedir, tile.col + dc);

      if (destination?.piece && destination.piece.team !== this.team) {
        captures.push(destination);
      }
    }

    return { moves, captures };
  }
}

class Knight extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, true, team);
  }

  draw(tile) {
    drawPieceShape(tile, this, "knight");
  }

  getmoves(tile) {
    const moves = [];
    const captures = [];

    for (const [dr, dc] of knightOffsets) {
      const destination = getTile(tile.row + dr, tile.col + dc);

      addDestination(destination, this.team, moves, captures);
    }

    return { moves, captures };
  }
}

class DemonKing extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    drawPieceShape(tile, this, "demonking");
  }

  // Raw attack squares: no recursive king-safety checks.
  getattacks(tile) {
    const attacks = [];

    for (const [dr, dc] of allDirections) {
      const destination = getTile(tile.row + dr, tile.col + dc);

      if (destination) attacks.push(destination);
    }

    return attacks;
  }

  isAttacked(target) {
    for (const row of tiles) {
      for (const source of row) {
        const enemy = source.piece;

        if (!enemy || enemy.team === this.team) continue;

        if (enemy instanceof Beliver) {
          const dr = target.row - source.row;
          const dc = target.col - source.col;

          if (dr === enemy.movedir && Math.abs(dc) === 1) {
            return true;
          }
        } else if (enemy instanceof DemonKing) {
          if (enemy.getattacks(source).includes(target)) {
            return true;
          }
        } else {
          // The tested square contains this team's king.
          // Always use raw moves here, not getLegalMoves().
          const { captures } = enemy.getmoves(source);

          if (captures.includes(target)) return true;
        }
      }
    }

    return false;
  }

  getmoves(tile) {
    const moves = [];
    const captures = [];

    for (const destination of this.getattacks(tile)) {
      addDestination(destination, this.team, moves, captures);
    }

    // Shared getLegalMoves() handles king safety.
    return { moves, captures };
  }
}

// Shared diagonal movement.
class DiPiece extends Piece {
  constructor(sizeRatio, canjump, team = null, range = Infinity) {
    super(sizeRatio, canjump, team);
    this.range = range;
  }

  getmoves(tile) {
    return getSlidingMoves(tile, this, diagonalDirections, this.range);
  }
}

class Angel extends DiPiece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    drawPieceShape(tile, this, "angel");
  }
}

class FallenAngel extends Piece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    drawPieceShape(tile, this, "fallenangel");
  }

  getmoves(tile) {
    return getSlidingMoves(tile, this, allDirections, 4);
  }
}

class GrimReaper extends DiPiece {
  constructor(sizeRatio, team) {
    super(sizeRatio, true, team, 2);
  }

  draw(tile) {
    drawPieceShape(tile, this, "grimreaper");
  }
}

class Inquisitor extends Piece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    drawPieceShape(tile, this, "inquisitor");
  }

  getmoves(tile) {
    return getSlidingMoves(tile, this, straightDirections, 6);
  }
}

class StarDevourer extends Piece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
    this.range = 4;
  }

  draw(tile) {
    drawPieceShape(tile, this, "stardevourer");
  }

  getmoves(tile) {
    return getBandMoves(tile, this, false);
  }
}

class DragonKing extends Piece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
    this.range = 4;
  }

  draw(tile) {
    drawPieceShape(tile, this, "dragonking");
  }

  getmoves(tile) {
    return getBandMoves(tile, this, true);
  }
}

// --------------------------------------------------
// Movement helpers
// --------------------------------------------------

const diagonalDirections = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const straightDirections = [
  [1, 0],
  [0, 1],
  [0, -1],
  [-1, 0],
];

const allDirections = [...diagonalDirections, ...straightDirections];

const knightOffsets = [
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
];

// Returns null rather than accessing outside the board.
function getTile(row, col) {
  return tiles[row]?.[col] ?? null;
}

function addDestination(destination, team, moves, captures) {
  if (!destination) return;

  if (!destination.piece) {
    moves.push(destination);
  } else if (destination.piece.team !== team) {
    captures.push(destination);
  }
}

function getSlidingMoves(tile, piece, directions, range) {
  const moves = [];
  const captures = [];

  // A board-sized limit is enough for any straight ray.
  const limit = Math.min(
    range,
    Math.max(tiles.length, ...tiles.map((row) => row.length)),
  );

  for (const [dr, dc] of directions) {
    for (let distance = 1; distance <= limit; distance++) {
      const destination = getTile(
        tile.row + dr * distance,
        tile.col + dc * distance,
      );

      if (!destination) break;

      addDestination(destination, piece.team, moves, captures);

      // Jumpers may continue past an occupied square,
      // but still cannot land on a teammate.
      if (destination.piece && !piece.canjump) break;
    }
  }

  return { moves, captures };
}

// Keeps your existing three-row / three-column paths.
function getBandMoves(tile, piece, vertical) {
  const moves = [];
  const captures = [];

  const checkTile = (row, col) => {
    const destination = getTile(row, col);

    if (!destination) return false;

    addDestination(destination, piece.team, moves, captures);
    return !destination.piece;
  };

  // One step sideways relative to the long movement axis.
  for (const side of [-1, 1]) {
    checkTile(
      tile.row + (vertical ? 0 : side),
      tile.col + (vertical ? side : 0),
    );
  }

  for (const offset of [-1, 0, 1]) {
    for (const direction of [-1, 1]) {
      for (let distance = 1; distance <= piece.range; distance++) {
        const row = tile.row + (vertical ? distance * direction : offset);

        const col = tile.col + (vertical ? offset : distance * direction);

        if (!checkTile(row, col)) break;
      }
    }
  }

  return { moves, captures };
}

// --------------------------------------------------
// Stylized piece artwork
// Coordinates are relative to the center of each tile.
// --------------------------------------------------

function drawPieceShape(tile, piece, type) {
  push();

  translate(tile.x + tile.size / 2, tile.y + tile.size / 2);

  scale(tile.size * piece.sizeRatio);

  const trim = piece.team === settings.teamOne ? "#ffb3a7" : "#a9dcff";

  const body = piece.team === settings.teamOne ? "#522b39" : "#253953";

  rectMode(CENTER);
  ellipseMode(CENTER);
  strokeJoin(ROUND);
  strokeWeight(0.025);
  stroke(trim);
  fill(body);

  // Small ground shadow.
  noStroke();
  fill(0, 100);
  ellipse(0, 0.39, 0.78, 0.14);

  stroke(trim);
  fill(body);

  // Wings sit behind the body.
  if (type === "angel" || type === "fallenangel") {
    for (const side of [-1, 1]) {
      push();
      scale(side, 1);

      beginShape();
      vertex(0.04, -0.08);
      vertex(0.38, -0.38);
      vertex(0.44, -0.08);
      vertex(0.31, 0.04);
      vertex(0.39, 0.12);
      vertex(0.18, 0.23);
      vertex(0.07, 0.16);
      endShape(CLOSE);

      line(0.12, 0.04, 0.34, -0.19);
      line(0.14, 0.13, 0.34, -0.02);
      pop();
    }
  }

  // Robe / armored body.
  beginShape();
  vertex(-0.1, -0.13);
  vertex(0.1, -0.13);
  vertex(0.17, 0.12);
  vertex(0.26, 0.33);
  vertex(-0.26, 0.33);
  vertex(-0.17, 0.12);
  endShape(CLOSE);

  line(-0.07, 0.02, -0.12, 0.29);
  line(0.07, 0.02, 0.12, 0.29);

  // Head.
  ellipse(0, -0.22, 0.23, 0.27);

  if (type === "demonking" || type === "dragonking") {
    // Crown and horns.
    beginShape();
    vertex(-0.14, -0.28);
    vertex(-0.21, -0.43);
    vertex(-0.07, -0.36);
    vertex(0, -0.48);
    vertex(0.07, -0.36);
    vertex(0.21, -0.43);
    vertex(0.14, -0.28);
    endShape(CLOSE);

    fill(trim);
    noStroke();
    ellipse(0, 0.03, 0.07, 0.11);

    if (type === "dragonking") {
      stroke(trim);
      strokeWeight(0.04);
      noFill();

      // Coiled dragon-like ornament.
      bezier(-0.2, 0.23, 0.3, 0.15, -0.31, -0.02, 0.16, -0.11);
    }
  }

  if (type === "angel") {
    noFill();
    stroke("#f4df9b");
    ellipse(0, -0.4, 0.25, 0.08);
  }

  if (type === "fallenangel") {
    line(-0.09, -0.31, -0.16, -0.43);
    line(0.09, -0.31, 0.16, -0.43);
  }

  if (type === "grimreaper") {
    // Hood and dark face.
    fill("#11151f");
    ellipse(0, -0.21, 0.15, 0.19);

    stroke("#dce7ef");
    strokeWeight(0.035);
    line(0.27, 0.33, 0.27, -0.36);

    noFill();
    bezier(0.27, -0.36, 0.03, -0.57, -0.2, -0.42, -0.16, -0.24);
  }

  if (type === "knight") {
    // Helmet crest and visor.
    fill(trim);
    triangle(-0.08, -0.33, 0.02, -0.47, 0.1, -0.31);

    stroke("#10141d");
    strokeWeight(0.04);
    line(-0.07, -0.23, 0.08, -0.23);
  }

  if (type === "inquisitor") {
    // Tall helmet and sword.
    fill(body);
    stroke(trim);

    triangle(-0.13, -0.24, 0, -0.48, 0.13, -0.24);

    line(0.28, 0.3, 0.28, -0.3);
    line(0.18, 0.08, 0.37, 0.08);

    fill(trim);
    ellipse(0, 0.04, 0.09, 0.14);
  }

  if (type === "stardevourer") {
    // Hooded, starless face with a bright core.
    fill("#0c101c");
    stroke(trim);

    beginShape();
    vertex(0, -0.43);
    vertex(0.18, -0.19);
    vertex(0.11, -0.07);
    vertex(-0.11, -0.07);
    vertex(-0.18, -0.19);
    endShape(CLOSE);

    noStroke();
    fill(trim);
    circle(0, 0.08, 0.1);
  }

  // Team-colored pedestal.
  stroke(trim);
  strokeWeight(0.025);
  fill(piece.team);
  rect(0, 0.35, 0.53, 0.09, 0.025);

  pop();
}

// --------------------------------------------------
// Board creation and rendering
// --------------------------------------------------

function createBoard(range) {
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

function createPieces(board, map) {
  for (const row of board) {
    for (const tile of row) {
      const PieceType = map[tile.row]?.[tile.col]?.[0];

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

  for (const row of board) {
    for (const tile of row) {
      noStroke();
      fill(tile.color);
      square(tile.x, tile.y, tile.size);

      if (lastMove.includes(tile)) {
        fill(255, 255, 255, 35);
        square(tile.x, tile.y, tile.size);
      }

      if (tile === checkedTile) {
        fill(220, 30, 45, 90);
        stroke("#ff5364");
        strokeWeight(3);
        square(tile.x, tile.y, tile.size);
      }

      if (tile === piececlicked) {
        noFill();
        stroke("#7fe6aa");
        strokeWeight(3);
        square(tile.x + 1.5, tile.y + 1.5, tile.size - 3);
      }
    }
  }

  pop();
}

function drawPieces(board) {
  for (const row of board) {
    for (const tile of row) {
      if (tile.piece) tile.piece.draw(tile);
    }
  }
}

function boardSizeChanged() {
  if (!tiles.length) return;

  const boardSize = size();
  const tilesize = boardSize / tiles.length;
  const offsetX = (width - boardSize) / 2;
  const offsetY = (height - boardSize) / 2;

  for (const row of tiles) {
    for (const tile of row) {
      tile.x = tile.col * tilesize + offsetX;
      tile.y = tile.row * tilesize + offsetY;
      tile.size = tilesize;
    }
  }
}

// --------------------------------------------------
// Check, checkmate, and game state
// --------------------------------------------------

function findKing(team) {
  for (const row of tiles) {
    for (const tile of row) {
      if (tile.piece instanceof DemonKing && tile.piece.team === team) {
        return tile;
      }
    }
  }

  return null;
}

function isTeamInCheck(team) {
  const tile = findKing(team);

  // A missing king is an invalid position, not a safe one.
  return tile ? tile.piece.isAttacked(tile) : true;
}

function teamHasLegalMove(team) {
  for (const row of tiles) {
    for (const tile of row) {
      const piece = tile.piece;

      if (!piece || piece.team !== team) continue;

      const { moves, captures } = piece.getLegalMoves(tile);

      if (moves.length || captures.length) return true;
    }
  }

  return false;
}

function updateGameStatus() {
  const kingTile = findKing(turn);

  if (!kingTile) {
    gameOver = true;
    checkedTile = null;
    checkMessage = `Invalid board: ${turn} has no DemonKing.`;
    return;
  }

  const inCheck = kingTile.piece.isAttacked(kingTile);
  checkedTile = inCheck ? kingTile : null;

  if (!teamHasLegalMove(turn)) {
    gameOver = true;

    const winner =
      turn === settings.teamOne ? settings.teamTwo : settings.teamOne;

    checkMessage = inCheck ? `Checkmate! ${winner} wins!` : "Stalemate! Draw.";

    clearTimeout(resetTimer);
    resetTimer = setTimeout(reset, 4000);
    return;
  }

  checkMessage = inCheck ? `${turn} is in check!` : "";
}

function clearSelection() {
  piececlicked = null;
  selectedMoves = null;
}

function selectPiece(tile) {
  piececlicked = tile;

  // Calculate only when selecting, not every draw frame.
  selectedMoves = tile.piece.getLegalMoves(tile);
}

function startGame() {
  clearTimeout(resetTimer);
  resetTimer = null;

  tiles = createBoard(pieceMap.length);
  createPieces(tiles, pieceMap);

  gameOver = false;
  checkMessage = "";
  checkedTile = null;
  lastMove = [];

  clearSelection();
  turn = settings.teamTwo;

  creen_type = "game";
  startButton.hide();

  updateGameStatus();
}

function reset() {
  clearTimeout(resetTimer);
  resetTimer = null;

  creen_type = "menu";
  tiles = [];
  lastMove = [];
  checkedTile = null;

  clearSelection();

  checkMessage = "";
  gameOver = false;

  startButton.show();
  positionMenuButton();
}

// --------------------------------------------------
// Menu and status display
// --------------------------------------------------

function drawMenu() {
  push();
  noStroke();
  textAlign(CENTER, CENTER);

  fill("gold");
  textSize(min(48, width * 0.075));
  text("End Boardgame", width / 2, height / 2 - 100);

  fill("#d5d8e2");
  textSize(min(20, width * 0.035));
  text("An intense two-player strategy game", width / 2, height / 2 - 45);

  pop();
}

function drawStatus() {
  push();
  rectMode(CORNER);
  noStroke();

  fill(12, 14, 21, 235);
  rect(0, 0, width, 44);

  fill(gameOver ? "#f5d77c" : "#ffffff");
  textAlign(CENTER, CENTER);
  textSize(min(22, width * 0.045));

  text(checkMessage || `${turn}'s turn`, width / 2, 22);

  pop();
}

function positionMenuButton() {
  if (!startButton) return;
  startButton.position(width / 2 - 90, height / 2 + 10);
}

// Leave room for the status bar on smaller screens.
const size = () => max(1, min(width * 0.94, height * 0.9, height - 100));

// --------------------------------------------------
// Starting position
// Same layout, written more compactly.
// --------------------------------------------------

const pieceMap = Array.from({ length: 17 }, () =>
  Array.from({ length: 17 }, () => []),
);

for (const row of [0, 16]) {
  pieceMap[row][6] = [Angel];
  pieceMap[row][7] = [DragonKing];
  pieceMap[row][8] = [DemonKing];
  pieceMap[row][9] = [FallenAngel];
  pieceMap[row][10] = [Angel];
}

for (const row of [1, 15]) {
  for (const col of [2, 14]) {
    pieceMap[row][col] = [Knight];
  }

  for (const col of [4, 12]) {
    pieceMap[row][col] = [Inquisitor];
  }

  for (const col of [6, 10]) {
    pieceMap[row][col] = [GrimReaper];
  }
}

for (const row of [2, 14]) {
  for (let col = 0; col < 17; col++) {
    if (col === 4 || col === 12) continue;

    pieceMap[row][col] = col === 3 || col === 13 ? [StarDevourer] : [Beliver];
  }
}

for (const row of [3, 13]) {
  pieceMap[row][4] = [Beliver];
  pieceMap[row][12] = [Beliver];
}

// --------------------------------------------------
// Settings and global state
// --------------------------------------------------

const settings = {
  teamOne: "red",
  teamTwo: "blue",
  colorOne: "#242631",
  colorTwo: "#bfa35d",
};

let tiles = [];

let piececlicked = null;
let selectedMoves = null;
let checkedTile = null;
let lastMove = [];

let turn = settings.teamTwo;
let creen_type = "menu";
let startButton;

let checkMessage = "";
let gameOver = false;
let resetTimer = null;

// --------------------------------------------------
// p5 setup and input
// --------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  startButton = createButton("Start Game");
  startButton.size(180, 50);

  startButton.style("font-size", "22px");
  startButton.style("background-color", "gold");
  startButton.style("color", "black");
  startButton.style("border", "none");
  startButton.style("border-radius", "8px");
  startButton.style("cursor", "pointer");

  startButton.mouseClicked(startGame);

  positionMenuButton();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionMenuButton();
  boardSizeChanged();
}

function mouseClicked(event) {
  // Ignore clicks on HTML controls such as Start Game.
  if (event?.target && event.target.tagName !== "CANVAS") {
    return;
  }

  if (creen_type !== "game" || gameOver || !tiles.length) {
    return;
  }

  const firstTile = tiles[0][0];

  const col = floor((mouseX - firstTile.x) / firstTile.size);

  const row = floor((mouseY - firstTile.y) / firstTile.size);

  const tile = getTile(row, col);

  if (!tile) return;

  if (piececlicked) {
    if (piececlicked === tile) {
      clearSelection();
      return;
    }

    if (tile.piece?.team === turn) {
      selectPiece(tile);
      return;
    }

    const source = piececlicked;

    // move() revalidates instead of trusting cached markers.
    if (source.piece?.move(source, tile)) {
      lastMove = [source, tile];
      clearSelection();

      turn = turn === settings.teamOne ? settings.teamTwo : settings.teamOne;

      updateGameStatus();
    }
  } else if (tile.piece?.team === turn) {
    selectPiece(tile);
  }
}

function draw() {
  background("#10121a");

  if (creen_type === "menu") {
    drawMenu();
    return;
  }

  drawBoard(tiles);
  drawPieces(tiles);

  if (piececlicked?.piece && selectedMoves) {
    piececlicked.piece.drawmove(piececlicked, selectedMoves);
  }

  drawStatus();
}
