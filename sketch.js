let size = () => min(width, height) * 0.9;
let range = 8;
let halfwidth;
let halfheight;
function setup() {
  createCanvas(windowWidth, windowHeight);
}
function createBoard() {
  push();
  noStroke();
  const boardSize = size();
  halfwidth = (width - boardSize) / 2;
  halfheight = (height - boardSize) / 2;
  const tilesize = boardSize / range;

  for (let i = 0; i < range; i++) {
    for (let h = 0; h < range; h++) {
      fill((i + h) % 2 === 0 ? "white" : "red");

      square(i * tilesize + halfwidth, h * tilesize + halfheight, tilesize);
    }
  }
  pop();
}

function draw() {
  background("black");
  createBoard();
}
