var snow = false;
var stars = false;
var clouds = false;

var snowObject;
var accuSnowObject;
var starObject;
var cloudObject;

function generateParticles(n, material, gen_point) {
  // Add n random points to geometry
  var geometry = new THREE.Geometry();
  for (i = 0; i < n; i++) {
    var point = gen_point(i);
    geometry.vertices.push(point);
  }
  return new THREE.Points(geometry, material);
}

var genSphere = function(minR, maxR, maxY) {
  return function() {
    var u = Math.random() * 2 - 1;
    var theta = Math.random() * 2 * Math.PI;
    var sq = Math.sqrt(1 - u * u);
    var vec = new THREE.Vector3(sq * Math.cos(theta), sq * Math.sin(theta), u);
    if (maxY) vec.setY(Math.max(maxY, vec.y));
    var length = Math.pow(Math.random(), 1/3) * (maxR - minR) + minR;
    return vec.setLength(length);
  };
};

function addSnow() {
  if (snow) {
    var snowTexture = loader.load( "textures/snowflake.png" );
    var snowMaterial = new THREE.PointsMaterial({
      size: 20,
      map: snowTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    snowObject = generateParticles(20000, snowMaterial, genSphere(0, 2000, GROUND_Y));
    accuSnowObject = generateParticles(0, snowMaterial, genSphere(0, 2000));
    scene.add(snowObject);
    scene.add(accuSnowObject);
  }
  else {
    scene.remove(snowObject);
    scene.remove(accuSnowObject);
  }
}

function addClouds() {
  if (clouds) {
    var cloudTexture = loader.load("textures/cloud.png");
    var cloudMaterial = new THREE.PointsMaterial({
      size: 100,
      map: cloudTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.1,
      depthWrite: false
    });
    var cloudHeight = 400;
    var genCloud = function(radius) {
      var getSeed = function() {
        return genSphere(0, radius)()
              .setY(cloudHeight + Math.random() * 50);
      };
      var seed = getSeed();
      return function(i) {
        if (Math.random() > 0.99) { seed = getSeed(); }
        var r = 40 + Math.random() * 10;
        var d = genSphere(0, r)();
        return d.add(seed);
      };
    }
    cloudObject = generateParticles(200000, cloudMaterial, genCloud(10000));
    scene.add(cloudObject);
  }
  else scene.remove(cloudObject);
}

function addStars() {
  if (stars) {
    scene.remove(starObject);
    var starTexture = loader.load("textures/snowflake.png");
    var starMaterial = new THREE.PointsMaterial({
      size: 30,
      color: 0xffffff,
      transparent: true,
      depthWrite: false
    });
    starObject = generateParticles(100000, starMaterial, genSphere(5000, 10000));
    scene.add(starObject);
    scene.background = new THREE.Color(0x000000);
  }
  else {
    scene.remove(starObject);
    scene.background = scene.fog.color;
  }
}

function updateParticles() {
  //console.log(snowObject);
  if (snow) {
    //snowObject.rotation.y += 0.01;
    let particles = snowObject.geometry.vertices;
    var length = particles.length;
    let genFunc = genSphere(0, 2000, GROUND_Y + 1);

    for (var i = 0; i < length; i++) {
      if (particles[i].y < GROUND_Y) {
        accuSnowObject.geometry.vertices.push(particles[i].clone().setY(GROUND_Y + 1));
        particles[i] = genFunc();
      }
      else particles[i].add(new THREE.Vector3(0, -1, 0));
    }
    accuSnowObject.geometry.verticesNeedUpdate = true;
    snowObject.geometry.verticesNeedUpdate = true;
    //console.log(accuSnowObject.geometry.vertices.length);
  }
  if (stars) {
    starObject.rotation.z += 0.001;
  }
}
