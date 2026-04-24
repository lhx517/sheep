// 遊戲狀態定義
const GameState = {
  WAITING: 'WAITING',
  PLAYING: 'PLAYING',
  FAILED: 'FAILED',
  SUCCESS: 'SUCCESS'
};

let currentState = GameState.WAITING;
let upperPath = [];
let lowerPath = [];
let flowers = []; // 儲存小花位置與顏色

let shakeAmount = 0; // 震動強度

// 軌道參數
const pathConfig = {
  xStep: 20,
  gapHeight: 70,    // 安全通道高度
  noiseScale: 0.005,
  yOffsetRange: 150 // 隨機震盪幅度
};

// 開始按鈕參數
let startBtn = { x: 50, y: 0, r: 20 };

function setup() {
  createCanvas(windowWidth, windowHeight);
  startBtn.y = height / 2;
  generatePath();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePath(); // 視窗大小改變時重新生成軌道以符合寬度
}

function draw() {
  background('#4CAF50'); // 草地綠色

  // 繪製背景裝飾（小花）
  drawFlowers();

  // 處理畫面震動
  if (shakeAmount > 0) {
    push();
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.85; // 震動隨時間遞減
  }

  // 畫在草地上睡覺的野狼
  drawWolf(width * 0.2, height * 0.15, currentState === GameState.FAILED);
  drawWolf(width * 0.7, height * 0.8, currentState === GameState.FAILED);

  // 繪製軌道
  drawTrack();

  // 根據狀態處理邏輯
  switch (currentState) {
    case GameState.WAITING:
      drawStartScreen();
      break;

    case GameState.PLAYING:
      noCursor(); // 遊戲中隱藏原始鼠標
      checkInteraction();
      drawLamb(mouseX, mouseY); // 繪製小羊鼠標
      drawStatusMessage("噓... 小心別吵醒大野狼！", "#ffffff");
      break;

    case GameState.FAILED:
      drawGameOverScreen("野狼被吵醒了！小羊快跑！", "#ff4b2b");
      break;

    case GameState.SUCCESS:
      drawGameOverScreen("小羊安全回到家了！", "#ffffff");
      break;
  }

  if (shakeAmount > 0) {
    pop();
  }
}

function generatePath() {
  upperPath = [];
  lowerPath = [];
  let noiseSeedValue = random(1000);
  
  for (let x = 0; x <= width; x += pathConfig.xStep) {
    let n = noise(x * pathConfig.noiseScale, noiseSeedValue);
    let centerY = map(n, 0, 1, height/2 - pathConfig.yOffsetRange, height/2 + pathConfig.yOffsetRange);
    
    upperPath.push({ x: x, y: centerY - pathConfig.gapHeight / 2 });
    lowerPath.push({ x: x, y: centerY + pathConfig.gapHeight / 2 });
  }

  // 隨機生成小花
  flowers = [];
  for (let i = 0; i < 40; i++) {
    flowers.push({
      x: random(width),
      y: random(height),
      color: random(['#FFEB3B', '#FF4081', '#E91E63', '#FFFFFF', '#9C27B0']),
      size: random(4, 8)
    });
  }

  // 確保開始按鈕對齊路徑開口中心，防止一開始就碰到圍欄
  if (upperPath.length > 0) {
    startBtn.y = (upperPath[0].y + lowerPath[0].y) / 2;
  }
}

function drawTrack() {
  push();
  noFill();
  strokeWeight(6);
  
  if (currentState === GameState.FAILED) {
    // 失敗時的閃爍效果 (紅/白交替)
    let flashColor = frameCount % 6 < 3 ? '#ff4b2b' : '#ffffff';
    stroke(flashColor);
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = '#ff4b2b';
  } else {
    // 正常狀態的木頭圍欄顏色
    stroke('#795548');
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(0,0,0,0.3)';
  }

  renderCurve(upperPath);
  renderCurve(lowerPath);

  // 增加圍欄的垂直木樁視覺效果
  strokeWeight(2);
  for (let i = 0; i < upperPath.length; i += 2) {
    line(upperPath[i].x, upperPath[i].y - 5, upperPath[i].x, upperPath[i].y + 5);
    line(lowerPath[i].x, lowerPath[i].y - 5, lowerPath[i].x, lowerPath[i].y + 5);
  }
  pop();

  // 終點區
  fill(255, 255, 255, 100);
  noStroke();
  rect(width - 40, 0, 40, height);
  fill(255);
  textAlign(CENTER, CENTER);
  text("羊圈", width - 20, height / 2);
}

function renderCurve(points) {
  beginShape();
  curveVertex(points[0].x, points[0].y);
  for (let p of points) {
    curveVertex(p.x, p.y);
  }
  curveVertex(points[points.length - 1].x, points[points.length - 1].y);
  endShape();
}

function checkInteraction() {
  let index = floor(mouseX / pathConfig.xStep);
  
  if (index >= 0 && index < upperPath.length - 1) {
    let p1 = upperPath[index];
    let p2 = upperPath[index + 1];
    let pct = (mouseX - p1.x) / (p2.x - p1.x);
    
    let currentUpperY = lerp(p1.y, p2.y, pct);
    let currentLowerY = lerp(lowerPath[index].y, lowerPath[index + 1].y, pct);

    if (mouseY < currentUpperY || mouseY > currentLowerY) {
      currentState = GameState.FAILED;
      shakeAmount = 25; // 觸發震動
    }
  }

  if (mouseX >= width - 15) {
    currentState = GameState.SUCCESS;
  }
}

/**
 * 繪製隨機散佈的小花
 */
function drawFlowers() {
  push();
  noStroke();
  for (let f of flowers) {
    fill(f.color);
    // 畫花瓣
    circle(f.x - f.size/2, f.y, f.size);
    circle(f.x + f.size/2, f.y, f.size);
    circle(f.x, f.y - f.size/2, f.size);
    circle(f.x, f.y + f.size/2, f.size);
    // 畫花蕊
    fill('#F44336');
    circle(f.x, f.y, f.size);
  }
  pop();
}

/**
 * 繪製小羊 (替代鼠標)
 */
function drawLamb(x, y) {
  push();
  translate(x, y);
  noStroke();
  // 身體 (羊毛)
  fill(255);
  ellipse(0, 0, 30, 25);
  ellipse(-8, -5, 15, 15);
  ellipse(8, -5, 15, 15);
  // 頭部
  fill(50);
  ellipse(12, 0, 15, 12);
  // 耳朵
  ellipse(12, -5, 5, 8);
  // 眼睛
  fill(255);
  ellipse(15, -1, 3, 3);
  pop();
}

/**
 * 繪製野狼 (趴在草地上)
 */
function drawWolf(x, y, isAwake) {
  push();
  translate(x, y);
  noStroke();
  // 身體
  fill(100);
  ellipse(0, 0, 60, 30); // 趴著的身體
  // 頭部
  if (isAwake) {
    // 醒來的頭 (向上看)
    rect(-45, -25, 20, 15, 5);
    fill(255, 0, 0); // 憤怒的紅眼睛
    circle(-40, -20, 4);
  } else {
    // 睡覺的頭 (靠在地上)
    fill(100);
    rect(-45, -5, 20, 10, 5);
    fill(0);
    line(-40, -2, -35, -2); // 閉上的眼睛
  }
  // 尾巴
  fill(80);
  triangle(30, 0, 50, 10, 30, 15);
  pop();
}

function drawStartScreen() {
  cursor(ARROW);
  fill(255, 255, 255, 200);
  textAlign(CENTER, CENTER);
  textSize(20);
  text("點擊 START 開始遊戲", width / 2, height / 2 - 50);
  
  fill(dist(mouseX, mouseY, startBtn.x, startBtn.y) < startBtn.r ? '#00ff87' : '#00f2ff');
  circle(startBtn.x, startBtn.y, startBtn.r * 2);
  fill(0);
  text("S", startBtn.x, startBtn.y); // 按鈕變小了，文字改用縮寫更精緻
}

/**
 * UI: 顯示遊戲中的狀態文字
 */
function drawStatusMessage(msg, col) {
  push();
  fill(col);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(20);
  text(msg, 20, 20);
  pop();
}

function drawGameOverScreen(msg, col) {
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  fill(col);
  textAlign(CENTER, CENTER);
  textSize(48);
  text(msg, width / 2, height / 2);
  textSize(20);
  text("點擊任何地方重新開始", width / 2, height / 2 + 60);
}

function mousePressed() {
  if (currentState === GameState.WAITING && dist(mouseX, mouseY, startBtn.x, startBtn.y) < startBtn.r) {
    currentState = GameState.PLAYING;
  } else if (currentState === GameState.FAILED || currentState === GameState.SUCCESS) {
    generatePath();
    currentState = GameState.WAITING;
  }
}
