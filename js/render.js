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
  for (var i = 0; i < heightMap.length; i++) {
    for (var j = 0; j < heightMap[i].length; j++) {
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

function generateHeightMap(length, width) {
  let noiseGen = new NoiseGenerator();

  var size = length * width;
  var data = new Array(length);
  for (var x = 0; x < length; x++) {
    data[x] = new Array(width);
    for (var y = 0; y < width; y++) {
      data[x][y] = noiseGen.generate(x, y, 0);
    }
  }
  return data;
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
  scene.add(new THREE.AmbientLight(0x666666));
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
  var groundTexture = loader.load( "textures/terrain/grasslight-big.jpg" );
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set( 25, 25 );
  groundTexture.anisotropy = 16;

  var displacementTexture = loader.load( "textures/terrain/backgrounddetailed6.jpg" );
  displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;
  displacementTexture.repeat.set( 25, 25 );
  displacementTexture.anisotropy = 16;

  //scene.background = new THREE.Color( 'skyblue' );

  // create a buffer with color data

  let groundWidth = 500;
  let groundHeight = 500;
  let groundResolution = 10;
  let groundWidthSegments = groundWidth / groundResolution;
  let groundHeightSegments = groundHeight / groundResolution / 2;

  let heightMap = generateHeightMap(groundWidthSegments,groundHeightSegments);
  var texture = heightMapToTexture(heightMap);

  // ground material
  groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x404761, //0x3c3c3c,
    specular: 0x404761, //0x3c3c3c//,
    side: THREE.DoubleSide,
    map: groundTexture,
    displacementMap: texture,
    displacementScale: 50
  });

  console.log(displacementTexture);

  // ground mesh
  let meshGeometry = new THREE.PlaneBufferGeometry(groundWidth, groundHeight,
    groundWidthSegments, groundHeightSegments);
  let mesh = new THREE.Mesh(meshGeometry, groundMaterial);
  mesh.position.y = GROUND_Y - 1;
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
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
  scene.add(ground); // add ground to scene

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
  scene.add(box);

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
