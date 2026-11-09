// ============================================================
// DRAWING HELPERS
// Each piece's artwork is defined in its own draw(tile) method.
// These helpers provide consistent scaling, colors, and details.
// ============================================================

const paletteCache = {};

const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Builds (once per team) the p5 colors from theme.teams.
function teamPalette(team) {
  if (!paletteCache[team]) {
    const source = theme.teams[team];
    const palette = {};

    for (const key in source) palette[key] = color(source[key]);

    const glow = rgbOf(source.glow).join(",");

    palette.auraIn = `rgba(${glow},0.34)`;
    palette.auraOut = `rgba(${glow},0)`;
    palette.lightRGB = rgbOf(source.light);

    paletteCache[team] = palette;
  }

  return paletteCache[team];
}

function radialGradient(x, y, r0, r1, stops, fx = x, fy = y) {
  const gradient = drawingContext.createRadialGradient(fx, fy, r0, x, y, r1);

  for (const [offset, css] of stops) gradient.addColorStop(offset, css);

  return gradient;
}

// Fills a canvas path with a gradient without disturbing p5's cached fill.
function fillGradient(gradient, path) {
  const ctx = drawingContext;

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  path(ctx);
  ctx.fill();
  ctx.restore();
}

function roundRectPath(x, y, w, h, r) {
  return (ctx) => {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
}

function beginPieceDrawing(piece, tile) {
  push();

  translate(tile.x + tile.size / 2, tile.y + tile.size / 2);

  scale((tile.size * piece.sizeRatio) / 100);

  colorMode(RGB, 255);
  rectMode(CORNER);
  ellipseMode(CENTER);
  strokeJoin(ROUND);
  strokeCap(ROUND);

  const palette = teamPalette(piece.team);

  // Soft team-colored aura so dark robes read against the dark board.
  fillGradient(
    radialGradient(0, 4, 6, 64, [
      [0, palette.auraIn],
      [1, palette.auraOut],
    ]),
    (ctx) => ctx.arc(0, 4, 64, 0, TWO_PI),
  );

  noStroke();
  fill(0, 0, 0, 85);
  ellipse(0, 42, 80, 13);

  fill(palette.body);
  stroke(palette.outline);
  strokeWeight(2.4);

  return palette;
}

function piecePolygon(points) {
  beginShape();

  for (const [x, y] of points) {
    vertex(x, y);
  }

  endShape(CLOSE);
}

function drawPieceBase(palette) {
  fill(palette.dark);
  stroke(palette.outline);
  strokeWeight(2.4);

  rect(-29, 31, 58, 7, 3);
  rect(-36, 38, 72, 9, 3);

  stroke(palette.trim);
  strokeWeight(1.4);
  line(-27, 34, 27, 34);
  line(-32, 41, 32, 41);
}

function drawPieceRobe(palette) {
  fill(palette.dark);
  stroke(palette.outline);
  strokeWeight(2.4);

  piecePolygon([
    [-12, -10],
    [12, -10],
    [18, 15],
    [27, 32],
    [-27, 32],
    [-18, 15],
  ]);

  stroke(palette.light);
  strokeWeight(2);
  line(-5, -5, -13, 27);
  line(5, -5, 13, 27);
}

function drawPieceJewel(palette, x, y, radius = 5) {
  fill(palette.gem);
  stroke(palette.outline);
  strokeWeight(1.5);

  piecePolygon([
    [x, y - radius],
    [x + radius * 0.7, y],
    [x, y + radius],
    [x - radius * 0.7, y],
  ]);
}

// ============================================================
// MOVEMENT HELPERS
// ============================================================

// Movement along straight or diagonal rays.
// Jumping pieces can continue past occupied squares.
function getRayMoves(piece, tile, directions, range) {
  const moves = [];
  const captures = [];

  for (const [dr, dc] of directions) {
    for (let distance = 1; distance <= range; distance++) {
      const row = tile.row + dr * distance;
      const col = tile.col + dc * distance;

      if (row < 0 || row >= tiles.length) break;
      if (col < 0 || col >= tiles[row].length) break;

      const destination = tiles[row][col];

      if (destination.piece) {
        if (destination.piece.team !== piece.team) {
          captures.push(destination);
        }

        if (!piece.canjump) break;
      } else {
        moves.push(destination);
      }
    }
  }

  return { moves, captures };
}

// ============================================================
// BASE PIECE
// ============================================================

class Piece {
  constructor(sizeRatio = 0.8, canjump = false, team = null) {
    this.sizeRatio = sizeRatio;
    this.canjump = canjump;
    this.hasmoved = false;
    this.team = team;
    this.movedir = team === settings.teamOne ? 1 : -1;
  }

  getmoves(tile) {
    return { moves: [], captures: [] };
  }

  drawmove(tile) {
    const { moves, captures } = this.getmoves(tile);
    const palette = teamPalette(this.team);

    push();
    noStroke();

    fill(...palette.lightRGB, 175);

    for (const move of moves) {
      circle(
        move.x + move.size / 2,
        move.y + move.size / 2,
        (move.size * this.sizeRatio) / 2,
      );
    }

    // Captures get a red ring so they stay visible around the piece.
    fill(255, 70, 90, 55);
    stroke(255, 90, 105, 235);
    strokeWeight(3);

    for (const capture of captures) {
      circle(
        capture.x + capture.size / 2,
        capture.y + capture.size / 2,
        capture.size * 0.9,
      );
    }

    pop();
  }

  move(tile, to) {
    const { moves, captures } = this.getmoves(tile);

    if (moves.includes(to)) {
      to.piece = this;
      tile.piece = null;
      this.hasmoved = true;

      return true;
    } else if (captures.includes(to)) {
      let piece = to.piece;
      to.piece = this;
      tile.piece = null;
      this.hasmoved = true;
    }

    return false;
  }
}

// ============================================================
// BELIVER
// ============================================================

class Beliver extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    drawPieceRobe(p);

    // Hood.
    fill(p.body);
    stroke(p.outline);
    strokeWeight(2.4);
    ellipse(0, -20, 29, 33);

    // Hood opening.
    fill(p.dark);
    ellipse(0, -18, 17, 22);

    // Robe trim.
    stroke(p.trim);
    strokeWeight(2);
    line(0, -4, 0, 25);

    drawPieceJewel(p, 0, 5, 4);
    drawPieceBase(p);

    pop();
  }

  getmoves(tile) {
    const range = this.hasmoved ? 1 : 2;
    const moves = [];
    const captures = [];

    // Diagonal captures.
    const captureRow = tile.row + this.movedir;

    if (captureRow >= 0 && captureRow < tiles.length) {
      for (const dc of [-1, 1]) {
        const col = tile.col + dc;

        if (col < 0 || col >= tiles[captureRow].length) continue;

        const destination = tiles[captureRow][col];

        if (destination.piece && destination.piece.team !== this.team) {
          captures.push(destination);
        }
      }
    }

    // Forward movement.
    for (let distance = 1; distance <= range; distance++) {
      const row = tile.row + distance * this.movedir;

      if (row < 0 || row >= tiles.length) break;

      const destination = tiles[row][tile.col];

      if (destination.piece) break;

      moves.push(destination);
    }

    return { moves, captures };
  }
}

// ============================================================
// KNIGHT
// ============================================================

class Knight extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, true, team);
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    // Armored horse silhouette.
    fill(p.body);
    stroke(p.outline);
    strokeWeight(2.4);

    piecePolygon([
      [-26, 31],
      [-21, 13],
      [-8, -1],
      [-17, -7],
      [-31, -3],
      [-37, -13],
      [-23, -29],
      [-17, -43],
      [-8, -33],
      [5, -38],
      [21, -24],
      [25, -5],
      [17, 12],
      [22, 31],
    ]);

    // Mane.
    fill(p.dark);

    piecePolygon([
      [5, -38],
      [21, -24],
      [25, -5],
      [17, 12],
      [11, 22],
      [8, 0],
      [12, -19],
    ]);

    // Eye.
    noStroke();
    fill(p.trim);
    ellipse(-15, -21, 5, 5);

    // Armor details.
    stroke(p.trim);
    strokeWeight(2);
    line(-25, 25, 17, 25);
    line(-29, -10, -13, -6);

    drawPieceBase(p);

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

      const destination = tiles[row][col];

      if (destination.piece) {
        if (destination.piece.team !== this.team) {
          captures.push(destination);
        }
      } else {
        moves.push(destination);
      }
    }

    return { moves, captures };
  }
}

// ============================================================
// DEMON KING
// ============================================================

class DemonKing extends Piece {
  constructor(sizeRatio, team = null) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    drawPieceRobe(p);

    // Head.
    fill(p.body);
    stroke(p.outline);
    strokeWeight(2.4);
    ellipse(0, -16, 29, 32);

    // Horned crown.
    fill(p.trim);

    piecePolygon([
      [-20, -37],
      [-16, -18],
      [16, -18],
      [20, -37],
      [9, -29],
      [0, -46],
      [-9, -29],
    ]);

    // Face plate.
    fill(p.dark);
    rect(-11, -14, 22, 8, 2);

    // Eyes.
    noStroke();
    fill(p.trim);
    ellipse(-6, -10, 3, 3);
    ellipse(6, -10, 3, 3);

    drawPieceJewel(p, 0, 10, 6);
    drawPieceBase(p);

    pop();
  }

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
        } else if (enemy instanceof DemonKing) {
          if (enemy.getattacks(source).includes(target)) {
            return true;
          }
        } else {
          // The target contains this king during the safety test,
          // so an enemy attack appears in its capture list.
          const { captures } = enemy.getmoves(source);

          if (captures.includes(target)) {
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

      if (occupant && occupant.team === this.team) continue;
      if (occupant instanceof DemonKing) continue;

      const originalPiece = tile.piece;
      let unsafe;

      tile.piece = null;
      destination.piece = this;

      try {
        unsafe = this.isAttacked(destination);
      } finally {
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

// ============================================================
// DIAGONAL BASE CLASS
// ============================================================

class DiPiece extends Piece {
  constructor(sizeRatio, canjump, team = null, range = Infinity) {
    super(sizeRatio, canjump, team);
    this.range = range;
  }

  getmoves(tile) {
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    const boardRange = Math.max(
      tiles.length,
      ...tiles.map((row) => row.length),
    );

    const range = Number.isFinite(this.range) ? this.range : boardRange;

    return getRayMoves(this, tile, directions, range);
  }
}

// ============================================================
// ANGEL
// ============================================================

class Angel extends DiPiece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    // Feathered wings.
    for (const side of [-1, 1]) {
      push();
      scale(side, 1);

      fill(p.light);
      stroke(p.outline);
      strokeWeight(2);

      piecePolygon([
        [8, -12],
        [24, -33],
        [44, -43],
        [39, -16],
        [34, 0],
        [26, 16],
        [15, 23],
      ]);

      stroke(p.trim);
      strokeWeight(1.4);
      line(17, 5, 36, -28);
      line(21, 12, 36, -12);

      pop();
    }

    drawPieceRobe(p);

    // Head.
    fill(p.body);
    stroke(p.outline);
    strokeWeight(2.4);
    ellipse(0, -21, 23, 27);

    // Halo.
    noFill();
    stroke(p.trim);
    strokeWeight(3);
    ellipse(0, -39, 29, 9);

    drawPieceJewel(p, 0, 6, 6);
    drawPieceBase(p);

    pop();
  }
}

// ============================================================
// FALLEN ANGEL
// ============================================================

class FallenAngel extends Piece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    // Jagged wings.
    for (const side of [-1, 1]) {
      push();
      scale(side, 1);

      fill(p.dark);
      stroke(p.outline);
      strokeWeight(2);

      piecePolygon([
        [8, -13],
        [27, -36],
        [44, -44],
        [39, -12],
        [46, 8],
        [31, 0],
        [35, 22],
        [19, 11],
        [13, 24],
      ]);

      stroke(p.light);
      strokeWeight(1.5);
      line(15, -8, 35, -31);

      pop();
    }

    drawPieceRobe(p);

    // Head.
    fill(p.body);
    stroke(p.outline);
    strokeWeight(2.4);
    ellipse(0, -21, 25, 28);

    // Broken crown.
    fill(p.trim);

    piecePolygon([
      [-14, -30],
      [-17, -43],
      [-5, -35],
      [1, -46],
      [6, -34],
      [17, -40],
      [13, -28],
    ]);

    // Eyes.
    stroke(p.trim);
    strokeWeight(2);
    line(-7, -18, -2, -16);
    line(7, -18, 2, -16);

    drawPieceJewel(p, 0, 7, 6);
    drawPieceBase(p);

    pop();
  }

  getmoves(tile) {
    const directions = [
      [1, 1],
      [1, 0],
      [1, -1],
      [0, 1],
      [0, -1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ];

    return getRayMoves(this, tile, directions, 4);
  }
}

// ============================================================
// GRIM REAPER
// ============================================================

class GrimReaper extends DiPiece {
  constructor(sizeRatio, team) {
    super(sizeRatio, true, team, 2);
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    // Scythe handle.
    stroke(p.trim);
    strokeWeight(3.5);
    line(26, -37, 20, 33);

    // Scythe blade.
    fill(p.light);
    stroke(p.outline);
    strokeWeight(2);

    piecePolygon([
      [25, -38],
      [9, -46],
      [-13, -44],
      [-30, -31],
      [-13, -36],
      [7, -35],
      [25, -28],
    ]);

    drawPieceRobe(p);

    // Hood.
    fill(p.dark);
    stroke(p.outline);
    strokeWeight(2.4);
    ellipse(0, -20, 33, 37);

    // Face opening.
    fill("#11131d");
    noStroke();
    ellipse(0, -17, 21, 25);

    // Glowing eyes.
    fill(p.trim);
    ellipse(-5, -19, 4, 3);
    ellipse(5, -19, 4, 3);

    // Robe folds.
    stroke(p.light);
    strokeWeight(2);
    line(-8, 1, -16, 26);
    line(8, 1, 15, 26);

    drawPieceBase(p);

    pop();
  }
}

// ============================================================
// INQUISITOR
// ============================================================

class Inquisitor extends Piece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    drawPieceRobe(p);

    // Ceremonial helmet.
    fill(p.body);
    stroke(p.outline);
    strokeWeight(2.4);

    piecePolygon([
      [-14, -10],
      [-16, -28],
      [0, -46],
      [16, -28],
      [14, -10],
    ]);

    // Helmet ornament.
    stroke(p.trim);
    strokeWeight(2);
    line(0, -38, 0, -12);
    line(-8, -25, 8, -25);

    // Staff.
    stroke(p.trim);
    strokeWeight(3);
    line(28, -22, 28, 31);
    line(20, -15, 36, -15);

    drawPieceJewel(p, 28, -27, 6);
    drawPieceJewel(p, 0, 8, 6);
    drawPieceBase(p);

    pop();
  }

  getmoves(tile) {
    const directions = [
      [1, 0],
      [0, 1],
      [0, -1],
      [-1, 0],
    ];

    return getRayMoves(this, tile, directions, 6);
  }
}

// ============================================================
// STAR DEVOURER
// ============================================================

class StarDevourer extends Piece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
    this.range = 4;
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    drawPieceRobe(p);

    // Eight-pointed star.
    fill(p.trim);
    stroke(p.outline);
    strokeWeight(2);

    beginShape();

    for (let i = 0; i < 16; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 8;
      const radius = i % 2 === 0 ? 29 : 17;

      vertex(Math.cos(angle) * radius, -15 + Math.sin(angle) * radius);
    }

    endShape(CLOSE);

    // Dark central orb.
    fill(p.dark);
    ellipse(0, -15, 35, 35);

    fill("#10121e");
    stroke(p.light);
    strokeWeight(2);
    ellipse(0, -15, 21, 25);

    // Orb reflection.
    noStroke();
    fill(p.light);
    ellipse(-5, -21, 5, 7);

    drawPieceJewel(p, 0, 21, 5);
    drawPieceBase(p);

    pop();
  }

  getmoves(tile) {
    const moves = [];
    const captures = [];

    const checkTile = (row, col) => {
      if (row < 0 || row >= tiles.length) return false;
      if (col < 0 || col >= tiles[row].length) return false;

      const destination = tiles[row][col];

      if (destination.piece) {
        if (destination.piece.team !== this.team) {
          captures.push(destination);
        }

        return false;
      }

      moves.push(destination);
      return true;
    };

    // One square directly above or below.
    checkTile(tile.row - 1, tile.col);
    checkTile(tile.row + 1, tile.col);

    // Three horizontal paths in each direction.
    for (const dr of [-1, 0, 1]) {
      for (const direction of [-1, 1]) {
        for (let distance = 1; distance <= this.range; distance++) {
          const row = tile.row + dr;
          const col = tile.col + distance * direction;

          if (!checkTile(row, col)) break;
        }
      }
    }

    return { moves, captures };
  }
}

// ============================================================
// DRAGON KING
// ============================================================

class DragonKing extends Piece {
  constructor(sizeRatio, team) {
    super(sizeRatio, false, team);
    this.range = 4;
  }

  draw(tile) {
    const p = beginPieceDrawing(this, tile);

    // Coiled dragon body: outline, body, then highlight.
    noFill();

    stroke(p.outline);
    strokeWeight(18);
    bezier(-18, 31, 35, 20, -34, -2, 13, -17);

    stroke(p.body);
    strokeWeight(13);
    bezier(-18, 31, 35, 20, -34, -2, 13, -17);

    stroke(p.trim);
    strokeWeight(2);
    bezier(-18, 31, 25, 18, -27, 0, 13, -17);

    // Dragon head and horns.
    fill(p.body);
    stroke(p.outline);
    strokeWeight(2.4);

    piecePolygon([
      [-4, -12],
      [-13, -27],
      [-23, -41],
      [-7, -35],
      [1, -46],
      [7, -34],
      [23, -39],
      [17, -26],
      [29, -19],
      [19, -10],
      [5, -8],
    ]);

    // Eye.
    noStroke();
    fill(p.trim);
    ellipse(10, -26, 5, 4);

    drawPieceJewel(p, 0, -36, 4);
    drawPieceBase(p);

    pop();
  }

  getmoves(tile) {
    const moves = [];
    const captures = [];

    const checkTile = (row, col) => {
      if (row < 0 || row >= tiles.length) return false;
      if (col < 0 || col >= tiles[row].length) return false;

      const destination = tiles[row][col];

      if (destination.piece) {
        if (destination.piece.team !== this.team) {
          captures.push(destination);
        }

        return false;
      }

      moves.push(destination);
      return true;
    };

    // One square directly left or right.
    checkTile(tile.row, tile.col - 1);
    checkTile(tile.row, tile.col + 1);

    // Three vertical paths in each direction.
    for (const dc of [-1, 0, 1]) {
      for (const direction of [-1, 1]) {
        for (let distance = 1; distance <= this.range; distance++) {
          const row = tile.row + distance * direction;
          const col = tile.col + dc;

          if (!checkTile(row, col)) break;
        }
      }
    }

    return { moves, captures };
  }
}

// ============================================================
// BOARD LAYOUT
// ============================================================

// Thickness of the ornamental frame, in tiles (the artwork is drawn for 2).
const FRAME = 2;

function layout(range = pieceMap.length) {
  const board = min(width, height) * 0.97;
  const tile = board / (range + FRAME * 2);
  const grid = tile * range;

  return {
    range,
    tile,
    bx: (width - board) / 2,
    by: (height - board) / 2,
    gx: (width - grid) / 2,
    gy: (height - grid) / 2,
  };
}

// ============================================================
// BOARD CREATION
// ============================================================

function createBoard(range) {
  const L = layout(range);
  const board = [];

  for (let row = 0; row < range; row++) {
    const rowarray = [];

    for (let col = 0; col < range; col++) {
      rowarray.push({
        row,
        col,
        x: L.gx + col * L.tile,
        y: L.gy + row * L.tile,
        size: L.tile,
        color: theme.cell,
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

// ============================================================
// BOARD DRAWING
// The static artwork (backdrop, frame, grid) is drawn once and cached;
// only the selection highlight is drawn every frame.
// ============================================================

let boardLayer = null;

function drawBoard(board) {
  if (boardLayer) {
    drawingContext.drawImage(boardLayer, 0, 0, width, height);
  } else {
    const L = layout(board.length);

    drawBackdrop();
    drawFrame(L);
    drawGrid(L, board);

    const source = drawingContext.canvas;

    boardLayer = document.createElement("canvas");
    boardLayer.width = source.width;
    boardLayer.height = source.height;
    boardLayer.getContext("2d").drawImage(source, 0, 0);
  }

  if (piececlicked) {
    push();
    rectMode(CORNER);
    fill(255, 226, 140, 50);
    stroke(255, 228, 150);
    strokeWeight(3);

    // Inset the border so it stays within the tile.
    square(piececlicked.x + 1.5, piececlicked.y + 1.5, piececlicked.size - 3);

    pop();
  }
}

function drawBackdrop() {
  const cx = width / 2;
  const cy = height / 2;

  fillGradient(
    radialGradient(cx, cy, 0, max(width, height) * 0.75, [
      [0, "#43182c"],
      [0.5, "#1d0a16"],
      [1, "#050207"],
    ]),
    (ctx) => ctx.rect(0, 0, width, height),
  );
}

// Frame artwork is drawn in tile units: 1 unit = 1 tile.
function drawFrame(L) {
  const n = L.range;
  const S = n + FRAME * 2;
  const { gold, goldDim } = theme;

  push();
  translate(L.bx, L.by);
  scale(L.tile);
  rectMode(CORNER);
  noFill();

  // Lavender edge glow.
  for (const [weight, alpha] of [
    [0.6, 16],
    [0.34, 32],
    [0.14, 120],
  ]) {
    stroke(190, 162, 255, alpha);
    strokeWeight(weight);
    rect(0, 0, S, S, 0.35);
  }

  // Crimson base.
  const base = drawingContext.createLinearGradient(0, 0, S, S);

  base.addColorStop(0, "#8c2434");
  base.addColorStop(0.5, "#601424");
  base.addColorStop(1, "#400b18");
  fillGradient(base, roundRectPath(0, 0, S, S, 0.35));

  // Outer gold rims with a bead chain between them.
  stroke(gold);
  strokeWeight(0.06);
  rect(0.14, 0.14, S - 0.28, S - 0.28, 0.26);

  stroke(goldDim);
  strokeWeight(0.03);
  rect(0.3, 0.3, S - 0.6, S - 0.6, 0.16);

  noStroke();
  fill(gold);

  for (let i = 0; i < n; i++) {
    const u = FRAME + i + 0.5;

    circle(u, 0.22, 0.07);
    circle(u, S - 0.22, 0.07);
    circle(0.22, u, 0.07);
    circle(S - 0.22, u, 0.07);
  }

  // Rosette band, then the inner step around the grid.
  stroke(gold);
  strokeWeight(0.035);
  fill("#6b1626");
  rect(0.5, 0.5, S - 1, S - 1);

  stroke(goldDim);
  strokeWeight(0.03);
  fill("#4a0d1b");
  rect(1.5, 1.5, S - 3, S - 3);

  noFill();
  stroke(gold);
  strokeWeight(0.05);
  rect(1.8, 1.8, S - 3.6, S - 3.6);

  // Rosettes, with a ruby every fourth tile (largest at the center).
  const middle = Math.floor(n / 2);

  for (let i = 0; i < n; i++) {
    const u = FRAME + i + 0.5;

    for (const [x, y] of [
      [u, 1],
      [u, S - 1],
      [1, u],
      [S - 1, u],
    ]) {
      if (i % 4 === 0) drawGem(x, y, i === middle ? 0.3 : 0.19);
      else drawRosette(x, y);
    }
  }

  // Corner medallions with planet symbols.
  const c = FRAME / 2;

  [
    [c, c],
    [S - c, c],
    [c, S - c],
    [S - c, S - c],
  ].forEach(([x, y], kind) => {
    push();
    translate(x, y);

    fill("#2a0610");
    stroke(gold);
    strokeWeight(0.07);
    circle(0, 0, 1.84);

    noFill();
    stroke(goldDim);
    strokeWeight(0.025);
    circle(0, 0, 1.5);

    noStroke();
    fill(gold);

    for (let j = 0; j < 16; j++) {
      rotate(TWO_PI / 16);
      circle(0, -0.8, 0.04);
    }

    drawSymbol(kind);
    pop();
  });

  pop();
}

function drawRosette(x, y) {
  push();
  translate(x, y);

  noFill();
  stroke(220, 176, 104, 90);
  strokeWeight(0.02);
  rect(-0.46, -0.46, 0.92, 0.92, 0.05);

  fill("#3d0a17");
  stroke(theme.gold);
  strokeWeight(0.035);
  quad(0, -0.36, 0.36, 0, 0, 0.36, -0.36, 0);

  noStroke();
  fill(theme.gold);

  for (let k = 0; k < 4; k++) {
    rotate(HALF_PI);
    ellipse(0, -0.18, 0.11, 0.2);
  }

  fill("#e0344a");
  circle(0, 0, 0.1);

  pop();
}

function drawGem(x, y, r) {
  push();
  translate(x, y);

  fill(theme.gold);
  stroke(theme.goldDim);
  strokeWeight(0.03);
  circle(0, 0, r * 2.6);

  fillGradient(
    radialGradient(
      0,
      0,
      r * 0.1,
      r * 1.05,
      [
        [0, "#ff8c98"],
        [0.45, "#d4203b"],
        [1, "#6e0a1b"],
      ],
      -r * 0.3,
      -r * 0.3,
    ),
    (ctx) => ctx.arc(0, 0, r, 0, TWO_PI),
  );

  noStroke();
  fill(255, 255, 255, 170);
  ellipse(-r * 0.32, -r * 0.38, r * 0.5, r * 0.3);

  pop();
}

// Corner glyphs: orbit, sun, ringed planet, spiral.
function drawSymbol(kind) {
  const { gold, copper } = theme;

  noFill();
  stroke(gold);
  strokeWeight(0.05);

  if (kind === 0) {
    push();
    rotate(-0.5);
    ellipse(0, 0, 1.2, 0.5);
    noStroke();
    fill(gold);
    circle(0.6 * cos(0.9), 0.25 * sin(0.9), 0.13);
    pop();

    fill(copper);
    stroke(gold);
    strokeWeight(0.04);
    circle(0, 0, 0.3);
  } else if (kind === 1) {
    for (let j = 0; j < 8; j++) {
      const a = j * QUARTER_PI;
      const r = j % 2 ? 0.46 : 0.58;

      line(cos(a) * 0.3, sin(a) * 0.3, cos(a) * r, sin(a) * r);
    }

    fill(copper);
    circle(0, 0, 0.4);
  } else if (kind === 2) {
    push();
    rotate(-0.45);
    ellipse(0, 0, 1.3, 0.34);
    fill(copper);
    circle(0, 0, 0.52);
    noFill();
    arc(0, 0, 1.3, 0.34, 0, PI);
    pop();
  } else {
    for (let arm = 0; arm < 2; arm++) {
      beginShape();

      for (let t = 0; t <= 1.001; t += 0.05) {
        const a = arm * PI + t * 4.2;
        const r = 0.08 + t * 0.52;

        vertex(cos(a) * r, sin(a) * r);
      }

      endShape();
    }

    noStroke();
    fill(gold);
    circle(0, 0, 0.14);
  }
}

function drawGrid(L, board) {
  const n = L.range;
  const c = n / 2;

  push();
  translate(L.gx, L.gy);
  scale(L.tile);
  rectMode(CORNER);
  noStroke();

  for (const row of board) {
    for (const tile of row) {
      fill(tile.color);
      square(tile.col, tile.row, 1);
    }
  }

  // Vignette: lighter plum in the middle, darker toward the frame.
  fillGradient(
    radialGradient(c, c, 0, n * 0.78, [
      [0, "rgba(150, 70, 120, 0.18)"],
      [0.55, "rgba(0, 0, 0, 0)"],
      [1, "rgba(0, 0, 0, 0.5)"],
    ]),
    (ctx) => ctx.rect(0, 0, n, n),
  );

  // Copper grid lines.
  stroke(178, 106, 84, 140);
  strokeWeight(0.03);

  for (let i = 1; i < n; i++) {
    line(i, 0, i, n);
    line(0, i, n, i);
  }

  noFill();
  stroke(212, 158, 100);
  strokeWeight(0.07);
  rect(0, 0, n, n);

  // Center sparkle.
  fillGradient(
    radialGradient(c, c, 0, 0.9, [
      [0, "rgba(255, 205, 225, 0.4)"],
      [1, "rgba(255, 205, 225, 0)"],
    ]),
    (ctx) => ctx.arc(c, c, 0.9, 0, TWO_PI),
  );

  noStroke();
  fill(255, 238, 244);
  beginShape();

  for (let j = 0; j < 8; j++) {
    const angle = (j * PI) / 4 - HALF_PI;
    const radius = j % 2 === 0 ? 0.34 : 0.075;

    vertex(c + cos(angle) * radius, c + sin(angle) * radius);
  }

  endShape(CLOSE);

  pop();
}

function drawPieces(board) {
  for (const row of board) {
    for (const tile of row) {
      if (tile.piece !== null) {
        tile.piece.draw(tile);
      }
    }
  }
}

function boardSizeChanged(range) {
  const L = layout(range);

  for (let row = 0; row < range; row++) {
    for (let col = 0; col < range; col++) {
      const tile = tiles[row][col];

      tile.x = L.gx + col * L.tile;
      tile.y = L.gy + row * L.tile;
      tile.size = L.tile;
    }
  }

  // Redraw the cached board artwork at the new size.
  boardLayer = null;
}

// ============================================================
// STARTING PIECE MAP — SAME 17 × 17 LAYOUT
// ============================================================

const pieceMap = [
  [
    [],
    [],
    [],
    [],
    [],
    [],
    [Angel],
    [DragonKing],
    [DemonKing],
    [FallenAngel],
    [Angel],
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
    [Inquisitor],
    [],
    [GrimReaper],
    [],
    [],
    [],
    [GrimReaper],
    [],
    [Inquisitor],
    [],
    [Knight],
    [],
    [],
  ],
  [
    [Beliver],
    [Beliver],
    [Beliver],
    [StarDevourer],
    [],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [],
    [StarDevourer],
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
    [StarDevourer],
    [],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [Beliver],
    [],
    [StarDevourer],
    [Beliver],
    [Beliver],
    [Beliver],
  ],
  [
    [],
    [],
    [Knight],
    [],
    [Inquisitor],
    [],
    [GrimReaper],
    [],
    [],
    [],
    [GrimReaper],
    [],
    [Inquisitor],
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
    [Angel],
    [DragonKing],
    [DemonKing],
    [FallenAngel],
    [Angel],
    [],
    [],
    [],
    [],
    [],
    [],
  ],
];

// ============================================================
// SETTINGS AND STATE
// ============================================================

const settings = {
  teamOne: "gold",
  teamTwo: "silver",
};

// Colors taken from the manhwa: gold army vs. silver-blue army,
// dark plum board with copper lines, crimson-and-gold frame.
const theme = {
  teams: {
    gold: {
      body: "#d4aa50",
      dark: "#2e2316",
      light: "#f7e8b4",
      trim: "#ffe28f",
      gem: "#e0344a",
      outline: "#17110a",
      glow: "#ffc94d",
    },
    silver: {
      body: "#a9b6cc",
      dark: "#1d2846",
      light: "#eaf2ff",
      trim: "#d6e6fb",
      gem: "#3f86ff",
      outline: "#080c19",
      glow: "#8cc4ff",
    },
  },
  cell: "#2b1628",
  gold: "#dcb86e",
  goldDim: "#93703a",
  copper: "#b9784a",
};

let tiles = [];
let piececlicked = null;
let turn = settings.teamOne;

let savior_points = 0;

let pointsheet = {
  Beliver: "1",
};

// ============================================================
// P5 SETUP AND EVENTS
// ============================================================

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
  const L = layout();

  const col = floor((mouseX - L.gx) / L.tile);
  const row = floor((mouseY - L.gy) / L.tile);

  if (row < 0 || row >= tiles.length) return;
  if (col < 0 || col >= tiles[row].length) return;

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

        turn = turn === settings.teamOne ? settings.teamTwo : settings.teamOne;
      }
    }
  } else if (tile.piece && tile.piece.team === turn) {
    piececlicked = tile;
  }
}

// ============================================================
// MAIN DRAW LOOP
// ============================================================

function draw() {
  drawBoard(tiles);

  // Draw move markers beneath the artwork.
  if (piececlicked && piececlicked.piece) {
    piececlicked.piece.drawmove(piececlicked);
  }

  // Calls each piece's own draw(tile) method.
  drawPieces(tiles);
}
