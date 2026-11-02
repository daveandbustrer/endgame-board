let size = () => {
  return min(width, height) * 0.8;
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode("center");
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
function draw() {
  background("black");
  square(width / 2, height / 2, size());
}
