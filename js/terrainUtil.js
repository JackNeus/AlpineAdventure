function heightMapToTexture(heightMap) {
  // create a buffer with color data
  var width = heightMap.length;
  var height = heightMap[0].length;
  var data = new Uint8Array(3 * width * height);

  var stride = 0;
  for (var j = 0; j < height; j++) {
    for (var i = 0; i < width; i++) {
      var rgbVal = heightMap[i][j] * 255;
      data[stride] = rgbVal;
      data[stride + 1] = rgbVal;
      data[stride + 2] = rgbVal;
      stride += 3;
    }
  }

  var texture = new THREE.DataTexture(data, width, height, THREE.RGBFormat);
  texture.needsUpdate = true;
  return texture;
}

function getRandomHeightMap(width, height) {
  var size = width * height;
  var data = new Array(width);
  for (var i = 0; i < width; i++) {
    data[i] = new Array(height);
    for (var j = 0; j < height; j++) {
      data[i][j] = Math.random();
    }
  }
  return data;
}

function logDecay(x, x_max) {
  return Math.max(0, Math.log(x_max - x)) / Math.log(x_max);
}

function sigmoidDecay(x) {
  // Convert x from [0, 1] to [-7, 0] (steep part of sigmoid).
  x = -7 + 7 * x;
  // Flip sigmoid.  
  x = -x;
  return Math.exp(x) / (Math.exp(x) + 1);
}

function inverseDecay(x, range_size) {
  // Convert x from [0, 1] to [1, 1 + range_size].
  // We start at 1 because 1 / x = 1 at x = 1.
  x = 1 + x * range_size; 
  return 1 / x;
}

function generateHeightMap(width, height, mountainWidth, mountainHeight) {
  return generateHeightMap(width, height, mountainWidth, mountainHeight, 5.)
}

function generateHeightMap(width, height, mountainWidth, mountainHeight, scale) {
  // Want mountains with square base.
  if (mountainWidth === undefined) mountainWidth = width;
  if (mountainHeight === undefined) mountainHeight = height;
  let noiseGen = new NoiseGenerator(Math.min(mountainWidth, mountainHeight), scale);

  let ellipseRadius = function(x, y) {
    let h = width / 2, k = height / 2;
    let a = mountainWidth / 2, b = mountainHeight / 2;
    let r = Math.pow(x - h, 2) / Math.pow(a, 2) + Math.pow(y - k, 2) / Math.pow(b, 2); 
    return r;
  }

  let getMargin = function(x, y) {
    return Math.min(Math.min(x, width - x) / width, Math.min(y, height - y) / height);
  }

  // Get radius of ellipse.
  let outerR = ellipseRadius(width, height);
  let innerR = ellipseRadius(width / 2, height / 2 + mountainHeight / 2);
  let talusR = 0.5 * innerR;

  // Base steep decay halfway through talus for good rock decay.
  let decayR = (talusR + innerR) / 2; 

  var size = width * height;
  var data = new Array(width);
  for (var x = 0; x < data.length; x++) {
    data[x] = new Array(height);
    for (var y = 0; y < data[x].length; y++) {
      data[x][y] = Math.max(0, noiseGen.generate(x, y + .01, 0));
      let r = ellipseRadius(x, y);
      if (r <= talusR) { // Mountain drops off more and more.
        data[x][y] *= sigmoidDecay(r / decayR);
      } 
      else if (r <= outerR) { // Beginning of talus. Slope should decrease with radius.
        let r_fraction = (r - talusR) / (outerR - talusR);
        let decay_factor;
        // Decay factor should increase as we near edges of plane.
        // This isn't as elegant as the other math, but we want to force the edges towards zero.
        let m_fraction = 1 - getMargin(x, y) / getMargin(width / 2, height / 2 + mountainHeight / 2);
        decay_factor = inverseDecay(r_fraction, 30 * m_fraction + 5);

        // Compute decay factor at beginning of talus.
        let boundary_decay_factor = sigmoidDecay(talusR / decayR);
        data[x][y] *= boundary_decay_factor * decay_factor;
      }
      else {
        data[x][y] = 0;
      }
    }
  }
  return data;
}

function ridgeify(heightMap) {
  let width = heightMap.length;
  let height = heightMap[0].length;

  let dx = [0, 0, 1, -1];
  let dy = [1, -1, 0, 0];

  // Find local maxima.
  let isPeak = new Array(width);
  for (let x = 0; x < width; x++) {
    isPeak[x] = new Array(height);
    for (let y = 0; y < height; y++) {
      // Don't look at edge points.
      if (x == 0 || y == 0 || x == width - 1 || y == width - 1) continue;

      isPeak[x][y] = true;
      for (let d = 0; d < 4; d++) {
        let nx = x + dx[d], ny = y + dy[d];
        if (heightMap[nx][ny] > heightMap[x][y]) isPeak[x][y] = false;
      }
    }
  }
  //console.log(isPeak);
  let str = "";
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      str += isPeak[x][y] ? "1" : "0";
    }
    str += "\n";
  }
  //console.log(str);
}