window.onload = function() {
  init();
}

function init() {
  init_scene();
}

function init_scene() {    
  container = document.getElementById('container');
  
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
  let light, materials;
  scene.add(new THREE.AmbientLight(0x666666));
  light = new THREE.DirectionalLight(0xdfebff, 1.75);
  light.position.set(50, 200, 100);
  light.position.multiplyScalar(1.3);
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

  // sphere
  // sphere geometry
  let sphereGeo = new THREE.SphereGeometry(125, 20, 20);
  // sphere material
  sphereMaterial = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.01,
  });
  // sphere mesh
  sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere); // add sphere to scene

  renderer.render(scene, camera); // render the scene
}