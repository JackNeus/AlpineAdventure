var snow = false;
var stars = false;
var clouds = false;

var snowObject;
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

var genSphere = function(radius) {
  return function() {
    return new THREE.Vector3(
      Math.random() * 2 * radius - radius,
      Math.random() * 2 * radius - radius,
      Math.random() * 2 * radius - radius
    );
  };
};

var genOutsideSphere = function(minR, maxR) {
  return function() {
    var u = Math.random() * 2 - 1;
    var theta = Math.random() * 2 * Math.PI;
    var sq = Math.sqrt(1 - u * u);
    var vec = new THREE.Vector3(sq * Math.cos(theta), sq * Math.sin(theta), u);
    var length = Math.random() * (maxR - minR) + minR;
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
    snowObject = generateParticles(20000, snowMaterial, genSphere(2000));
    scene.add(snowObject);
  }
  else scene.remove(snowObject);
}

function addClouds() {
  if (clouds) {
    var cloudTexture = loader.load("textures/cloud.png");
    var cloudMaterial = new THREE.PointsMaterial({
      size: 50,
      map: cloudTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.1,
      depthWrite: false
    });
    var cloudHeight = 500;
    var genCloud = function(radius) {
      var getSeed = function() {
        return new THREE.Vector3(
          Math.random() * 2 * radius - radius,
          Math.random() * 50 + cloudHeight,
          Math.random() * 2 * radius - radius
        );
      };
      var seed = getSeed();
      return function(i) {
        if (Math.random() > 0.99) { seed = getSeed(); }
        var r = 30 + Math.random() * 5;
        return new THREE.Vector3(
          seed.x + Math.random() * r,
          seed.y + Math.random() * r,
          seed.z + Math.random() * r
        );
      };
    }
    cloudObject = generateParticles(20000, cloudMaterial, genCloud(1000));
    scene.add(cloudObject);
  }
  else scene.remove(cloudObject);
}

function addStars() {
  if (stars) {
    var starTexture = loader.load("textures/snowflake.png");
    var starMaterial = new THREE.PointsMaterial({
      size: 20,
      color: 0xffffff,
      transparent: true,
      depthWrite: false
    });
    starObject = generateParticles(20000, starMaterial, genOutsideSphere(5000, 20000));
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

    for (var i = 0; i < particles.length; i++) {
      if (particles[i].y < GROUND_Y) particles[i].y = Math.random() * 2000;
      else particles[i].add(new THREE.Vector3(0, -1, 0));
    }
    snowObject.geometry.verticesNeedUpdate = true;
  }
  if (stars) {
    starObject.rotation.z += 0.001;
  }
}
