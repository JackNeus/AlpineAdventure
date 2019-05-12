if (!Detector.webgl) Detector.addGetWebGLMessage();

var container;
var stats;
var controls;
var camera, scene, renderer;
var loader;
var time;

var groundMaterial;
var light;

// Objects in the scene
var sun;
var box;
var boundingBox;

var gui;
var guiControls;

// Property of the ground floor in the scene
var GROUND_Y = -249;
var sunPosition = new THREE.Vector3(100, 0, 1500);

init();
animate();

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

function getRandomHeightMap() {
  var width = 1000, height = 1000;
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
  // Convert x from [0, 1] to [-7, 7].
  x = -7 + 14 * x;
  // Flip sigmoid.  
  //x = -x;
  return Math.exp(x) / (Math.exp(x) + 1);
}

function inverseDecay(x, range_size) {
  // Convert x from [0, 1] to [1, 1 + range_size].
  // We start at 1 because 1 / x = 1 at x = 1.
  x = 1 + x * range_size; 
  return 1 / x;
}

function generateHeightMap(length, width) {
  // Want mountains with square base.
  let mountainWidth = Math.min(length, width);
  let noiseGen = new NoiseGenerator(mountainWidth);

  let outerR = Math.sqrt(mountainWidth * mountainWidth / 2);
  let innerR = mountainWidth / 2;
  console.log(length, width, mountainWidth);
  let talusR = innerR - 10;
  // Base logarithmic decay halfway through talus for good rock decay.
  let logDecayR = (talusR + innerR) / 2;
  
  var size = mountainWidth * mountainWidth;
  var data = new Array(mountainWidth);
  for (var x = 0; x < mountainWidth; x++) {
    data[x] = new Array(mountainWidth);
    for (var y = 0; y < mountainWidth; y++) {
      data[x][y] = noiseGen.generate(x, y + .01, 0);
      let rx = Math.abs(x - mountainWidth / 2);
      let ry = Math.abs(y - mountainWidth / 2);
      let r = Math.sqrt(rx * rx + ry * ry);
      if (r <= talusR) { // Mountain drops off more and more.
        let r_fraction = (logDecayR - r) / logDecayR;
        data[x][y] *= logDecay(r, logDecayR);
      } 
      else if (r <= outerR) { // Beginning of talus. Slope should decrease with radius.
        let r_fraction = (r - talusR) / (outerR - talusR);
        let decay_factor = inverseDecay(r_fraction, 3)
        // Compute decay factor at beginning of talus.
        let boundary_decay_factor = logDecay(talusR, logDecayR);
        data[x][y] *= boundary_decay_factor * decay_factor;
      } 
      else {
        data[x][y] = 0;
      }
    }
  }

  console.log(data);

  // Center square mountain in rectangular height map.
  var padded_data = new Array(length);
  for (var x = 0; x < padded_data.length; x++) 
    padded_data[x] = new Array(width);

  let x_start = Math.floor((length - mountainWidth) / 2);
  let y_start = Math.floor((width - mountainWidth) / 2);
  //x_start = 0; y_start = 0;
  for (var x = 0; x < mountainWidth; x++) {  
    for (var y = 0; y < mountainWidth; y++) {
      padded_data[x + x_start][y + y_start] = data[y][x];
    }
  }
/*
  for (var x = 0; x < length; x++) {
    for (var y = 0; y < width; y++) {
      if (x < width) padded_data[x][y] = 1;
      else padded_data[x][y] = 0;
    }
  }
*/
  console.log(padded_data);
  return padded_data;
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

function init() {

  container = document.createElement("div");
  document.body.appendChild(container);

  // scene (First thing you need to do is set up a scene)
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcce0ff, 500, 20000);
  scene.background = scene.fog.color;

  // camera (Second thing you need to do is set up the camera)
  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.y = 750;
  camera.position.z = 1500;
  scene.add(camera);

  // renderer (Third thing you need is a renderer)
  renderer = new THREE.WebGLRenderer({ antialias: true, devicePixelRatio: 1 });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(scene.fog.color);

  // Loader for textures
  loader = new THREE.TextureLoader();

  container.appendChild(renderer.domElement);
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;

  // This gives us stats on how well the simulation is running
  stats = new Stats();
  container.appendChild(stats.domElement);

  // mouse controls
  controls = new THREE.TrackballControls(camera, renderer.domElement);

  // lights (fourth thing you need is lights)
  scene.add(new THREE.AmbientLight(0xffffff));
  light = new THREE.DirectionalLight(0xdfebff, 1.75);
  light.position.copy(sunPosition);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  let d = 300;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.far = 1000;

  scene.add(light);

  // ground

  // needed for ground texture
  var groundTexture = loader.load( "textures/terrain/rockmap.jpg" );
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set( 25, 25 );
  groundTexture.anisotropy = 16;

  var displacementTexture = loader.load( "textures/terrain/backgrounddetailed6.jpg" );
  displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;
  displacementTexture.repeat.set( 25, 25 );
  displacementTexture.anisotropy = 16;

  //scene.background = new THREE.Color( 'skyblue' );

  // create a buffer with color data

  // TODO: Shouldn't be two copies of the mountain for 1024x512
  let groundWidth = 1024;//512;
  let groundHeight = 512;//512;
  let groundResolution = 4;
  let groundWidthSegments = groundWidth / groundResolution;
  let groundHeightSegments = groundHeight / groundResolution;

  let heightMap = generateHeightMap(groundWidthSegments,groundHeightSegments);
  ridgeify(heightMap);
  var texture = heightMapToTexture(heightMap);
  
  // ground material
  groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x404761, //0x3c3c3c,
    specular: 0x404761, //0x3c3c3c//,
    side: THREE.DoubleSide,
    map: groundTexture,
    displacementMap: texture,
    displacementScale: 500
  });

  console.log(displacementTexture);

  // ground mesh
  let meshGeometry = new THREE.PlaneBufferGeometry(groundWidth, groundHeight,
    groundWidthSegments, groundHeightSegments);
  let mesh = new THREE.Mesh(meshGeometry, groundMaterial);
  mesh.position.y = GROUND_Y - 1;
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.wireframe = true;
  scene.add(mesh); // add ground to scene

  // ground mesh
  let groundGeometry = new THREE.PlaneBufferGeometry(20000, 20000);
  let ground = new THREE.Mesh(groundGeometry,
    new THREE.MeshPhongMaterial({
      color: 0x3030aa,
      side: THREE.DoubleSide
    }));
  ground.position.y = GROUND_Y - 1;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  //scene.add(ground); // add ground to scene

  /*let sphereGeo = new THREE.SphereGeometry(2000, 20, 20);
  // sphere material
  sphereMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    reflectivity: 0
  });

  let sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
  sphere.position.set(0, 0, 0);
  scene.add(sphere);

  sun = new THREE.PointLight(0xffffff, 1);
  sun.position.copy(sunPosition);
  scene.add(sun);*/

  // create a box mesh
  let boxGeo = new THREE.BoxGeometry(250, 100, 250);
  boxMaterial = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
  });
  box = new THREE.Mesh(boxGeo, boxMaterial);
  box.position.x = 0;
  box.position.y = 0;
  box.position.z = 0;
  box.receiveShadow = true;
  box.castShadow = true;
  //scene.add(box);

  boxGeo.computeBoundingBox();
  boundingBox = box.geometry.boundingBox.clone();

  // event listeners
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  time = Date.now();

  render(); // update position of cloth, compute normals, rotate camera, render the scene
  stats.update();
  controls.update();
}

// the rendering happens here
function render() {
  let timer = Date.now() * 0.0002;

  //console.log(light.position);
  let e = new THREE.Euler(-0.01, 0, 0, 'XYZ');
  //light.position.applyEuler(e);
  //sun.position.applyEuler(e);

  camera.lookAt(scene.position);

  updateParticles();

  renderer.render(scene, camera); // render the scene
}
