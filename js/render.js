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

var snow = false;

// Property of the ground floor in the scene
var GROUND_Y = -249;
var sunPosition = new THREE.Vector3(100, 400, 1500);

init();
animate();

function generateParticles(n, size, texture) {
  // Add n random points to geometry
  var geometry = new THREE.Geometry();
  var range = 2000;
  for (i = 0; i < n; i++) {
    var x = Math.random() * 2 * range - range;
    var y = Math.random() * 2 * range - range;
    var z = Math.random() * 2 * range - range;
    var point = new THREE.Vector3(x, y, z);
    geometry.vertices.push(point);
  }
  // Map points to texture
  var material = new THREE.PointsMaterial({
    size: size,
    map: texture,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  return new THREE.Points(geometry, material);
}

function init() {

  container = document.createElement("div");
  document.body.appendChild(container);

  // scene (First thing you need to do is set up a scene)
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);

  // camera (Second thing you need to do is set up the camera)
  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.y = 450;
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
  var width = 30; height = 30;
  var size = width * height;
  var data = new Uint8Array( 3 * size );

  for (var i = 0; i < size; i ++) {
  	var stride = i * 3;
  	data[ stride ] = Math.random() * 255;
  	data[ stride + 1 ] = Math.random() * 255;
  	data[ stride + 2 ] = Math.random() * 255;
  }

  var texture = new THREE.DataTexture( data, width, height, THREE.RGBFormat );
  texture.needsUpdate = true

  // ground material
  groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x404761, //0x3c3c3c,
    specular: 0x404761, //0x3c3c3c//,
    map: groundTexture,
    displacementMap: texture,
    displacementScale: 50
  });

  console.log(displacementTexture);

  // ground mesh
  let meshGeometry =new THREE.PlaneBufferGeometry(20000, 500, 100, 100);
  let mesh = new THREE.Mesh(meshGeometry, groundMaterial);
  mesh.position.y = GROUND_Y - 1;
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh); // add ground to scene

  let sphereGeo = new THREE.SphereGeometry(5, 20, 20);
  // sphere material
  sphereMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
  });


  // sphere mesh
  sun = new THREE.Mesh(sphereGeo, sphereMaterial);
  sun.castShadow = true;
  sun.receiveShadow = false;
  sun.position.copy(sunPosition);
  scene.add(sun); // add sphere to scene

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

function addSnow() {
  var snowTexture = loader.load( "textures/snowflake.png" );
  var snowObject = generateParticles(20000, 20, snowTexture);
  snowObject.rotation.x = Math.random() * 6;
  scene.add(snowObject);
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
  //let e = new THREE.Euler(-0.01, 0, 0, 'XYZ');
  //light.position.applyEuler(e);
  //sun.position.applyEuler(e);

  camera.lookAt(scene.position);

  for (i = 0; i < scene.children.length; i++) {
    if (scene.children[i] instanceof THREE.Points) {
      scene.children[i].rotation.y += 0.01;
    }
  }
  renderer.render(scene, camera); // render the scene
}
