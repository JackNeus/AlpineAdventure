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
var sphere;
var box;
var boundingBox;
var sky;

var skyGeometry;

var gui;
var guiControls;

var night = false;
var sunSimulation = false;

// Property of the ground floor in the scene
var GROUND_Y = -249;
var sunPosition = new THREE.Vector3(0, 500, 0);

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
  // Want mountains with square base.
  if (mountainWidth === undefined) mountainWidth = width;
  if (mountainHeight === undefined) mountainHeight = height;
  let noiseGen = new NoiseGenerator(Math.min(mountainWidth, mountainHeight));

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
      data[x][y] = noiseGen.generate(x, y + .01, 0);
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

function init() {

  container = document.createElement("div");
  document.body.appendChild(container);

  // scene (First thing you need to do is set up a scene)
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);
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

  // create a buffer with color data

  // TODO: Shouldn't be two copies of the mountain for 1024x512
  let groundWidth = 1024;//512;
  let groundHeight = 1024;//512;
  let groundResolution = 4;
  let groundWidthSegments = groundWidth / groundResolution;
  let groundHeightSegments = groundHeight / groundResolution;

  let heightMap = generateHeightMap(groundWidthSegments,groundHeightSegments,
    groundWidthSegments-50,groundHeightSegments/2-30);
  ridgeify(heightMap);
  var texture = heightMapToTexture(heightMap);

  // ground material
  groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x404761, //0x3c3c3c,
    specular: 0x000000, //0x3c3c3c//,
    side: THREE.DoubleSide,
    map: groundTexture,
    displacementMap: texture,
    displacementScale: 500
  });


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
      side: THREE.DoubleSide,
      transparent: false
    }));
  ground.position.y = GROUND_Y - 1;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground); // add ground to scene

  skyGeometry = new THREE.SphereGeometry(7000, 32, 32);
  let skyMaterial =  new THREE.ShaderMaterial({
    uniforms: {
      uSunPos: {type: 'vec3', value: sunPosition}
    },
    fragmentShader: skyFragmentShader(),
    vertexShader: skyVertexShader(),
    side: THREE.DoubleSide
  });

  sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.position.set(0, GROUND_Y, 0);
  scene.add(sky);

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

  if (sunSimulation) {
    let e = new THREE.Euler(-0.005, 0, 0, 'XYZ');
    sunPosition.applyEuler(e);

    var uniforms = sky.material.uniforms;
    uniforms.uSunPos.value.copy(sunPosition);
    sky.material.uniformsNeedUpdate = true;

    if (sunPosition.y < (GROUND_Y + 300) && !night) {
      stars = true;
      addStars();
      night = true;
    }
    else if (sunPosition.y > (GROUND_Y + 300) && night) {
      stars = false;
      addStars();
      night = false;
    }
  }

  camera.lookAt(scene.position);

  updateParticles();

  renderer.render(scene, camera); // render the scene
}
