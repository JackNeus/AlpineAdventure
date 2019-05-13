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
var worldRadius = 5000;
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

function init() {

  container = document.createElement("div");
  document.body.appendChild(container);

  // scene (First thing you need to do is set up a scene)
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcce0ff, 10000, 10000);
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
  controls.maxDistance = 3000;

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

  init_terrain();
  scene.add(mountainMesh); // add ground to scene

  // needed for ground texture
  var grassTexture = loader.load( "textures/terrain/grasslight-thin.jpg" );
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set( 100, 100 );
  grassTexture.anisotropy = 16;

  var displacementTexture = loader.load( "textures/terrain/backgrounddetailed6.jpg" );
  displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;
  displacementTexture.repeat.set( 25, 25 );
  displacementTexture.anisotropy = 16;

  // ground mesh
  let groundGeometry = new THREE.PlaneBufferGeometry(20000, 20000);
  let ground = new THREE.Mesh(groundGeometry,
    new THREE.MeshPhongMaterial({
      color: 0x3030aa,
      side: THREE.DoubleSide,
      map: grassTexture,
      displacementMap: displacementTexture,
      displacementScale: 50,
      transparent: false
    }));
  ground.position.y = GROUND_Y - 1;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  //scene.add(ground); // add ground to scene

  skyGeometry = new THREE.SphereGeometry(worldRadius, 32, 32);
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
