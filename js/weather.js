var snow = false;
var stars = false;
var clouds = false;
var night = false;
var cloudBackground = false;
var sunSimulation = false;
var sunAngle = 30;
var sunAzimuth = 180;

var cloudHeight = 250;
var cloudLayerWidth = 500;

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

var genPointInEllipsoid = function(a, b, c) {
  let h = 0, k = 0, j = 0;
  return function() {
    while(true) {
      let x = Math.random() * a * 2 - a;
      let y = Math.random() * b * 2 - b;
      let z = Math.random() * c * 2 - c;
      let r = Math.pow(x - h, 2) / Math.pow(a, 2)
        + Math.pow(y - k, 2) / Math.pow(b, 2) 
        + Math.pow(z - j, 2) / Math.pow(c, 2);
      if (r <= 1) return new THREE.Vector3(x, y, z);
    }
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
  scene.remove(cloudObject);
  if (clouds) {
    var cloudTexture = loader.load("textures/cloud.png");
    var cloudMaterial = new THREE.PointsMaterial({
      size: 200,
      map: cloudTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.1,
      depthWrite: false
    });

    var cloudSphereRadius = 4500;
    var cloudCount = 20000;
    var baseCloudSize = 100;
    var seeds = new Array(cloudCount);

    var getSeed = function() {
      return genSphere(0, cloudSphereRadius)()
        .setY(cloudHeight + Math.random() * cloudLayerWidth - cloudLayerWidth / 2);
    };
    for (let i = 0; i < seeds.length; i++) seeds[i] = getSeed();

    var seedNum = 0;
    var particlesInLastCloud = 0;
    var lastCloudSize = baseCloudSize;
    var calls = 0;
    var genCloud = function(radius) {
      return function(i) {
        if (particlesInLastCloud == lastCloudSize) {
          seedNum += 1;
          particlesInLastCloud = 0;
          lastCloudSize = Math.ceil(baseCloudSize * Math.random() * 2);
        }
        //if (Math.random() > 0.99) { seed = getSeed(); }
        var rx = (80 + Math.random() * 40);// * lastCloudSize / baseCloudSize;
        var ry = (40 + Math.random() * 10);// * lastCloudSize / baseCloudSize;
        var rz = (80 + Math.random() * 40);// * lastCloudSize / baseCloudSize;
        var d = genPointInEllipsoid(rx, ry, rz)();

        particlesInLastCloud += 1;
        return d.add(seeds[seedNum]);
      };
    }
    cloudObject = generateParticles(cloudCount, cloudMaterial, genCloud(cloudSphereRadius));
    scene.add(cloudObject);
  }
}

function addStars() {
  if (stars) {
    scene.remove(starObject);
    var starTexture = loader.load("textures/snowflake.png");
    var starMaterial = new THREE.PointsMaterial({
      size: 50,
      color: 0xffffff,
      transparent: true,
      depthWrite: false
    });
    starObject = generateParticles(20000, starMaterial, genSphere(SKY_RADIUS, SKY_RADIUS * 2));
    scene.add(starObject);
  }
  else {
    scene.remove(starObject);
  }
}

function updateParticles() {
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
    snowObject.geometry.verticesNeedUpdate = true;
    accuSnowObject.geometry.verticesNeedUpdate = true;
    //console.log(accuSnowObject.geometry.vertices.length);
  }
  if (stars) {
    starObject.rotation.z += 0.001;
  }
}

/* SUN SIMULATION */

function addCloudBackground() {
  if (cloudBackground) {
    sky.material.fragmentShader = cloudShader();
  }
  else {
    sky.material.fragmentShader = skyFragmentShader();
  }
  sky.material.needsUpdate = true;
}

function updateSunElevationAngle() {
  let angle = sunAngle/360 * 2 * Math.PI;
  var x = sunPosition.x;
  var y = SUN_RADIUS * Math.sin(angle);
  var z = SUN_RADIUS * Math.cos(angle);
  sunPosition.set(x, y, z);
  light.position.set(x, y, z);
  var uniforms = sky.material.uniforms;
  uniforms.uSunPos.value.set(x, y, z);
  sky.material.uniformsNeedUpdate = true;
}

function updateSunAzimuthAngle() {
  let angle = -sunAzimuth/360 * 2 * Math.PI;
  var y = sunPosition.y;
  var x = SUN_RADIUS * Math.sin(angle);
  var z = SUN_RADIUS * Math.cos(angle);
  sunPosition.set(x, y, z);
  light.position.set(x, y, z);
  var uniforms = sky.material.uniforms;
  uniforms.uSunPos.value.set(x, y, z);
  sky.material.uniformsNeedUpdate = true;
}

function updateSunSimulation() {
  if (sunSimulation) {
    let e = new THREE.Euler(-0.001, 0, 0, 'XYZ');
    sunAngle += -0.001 * 360/ (2 * Math.PI);
    sunPosition.applyEuler(e);

    var uniforms = sky.material.uniforms;
    uniforms.uSunPos.value.copy(sunPosition);
    sky.material.uniformsNeedUpdate = true;
    light.position.copy(sunPosition);
  }

  if (sunPosition.y < (GROUND_Y + 300) && !night) {
    stars = true;
    addStars();
    night = true;
    sky.material.opacity = 0.1;
    sky.material.needsUpdate = true;
  }
  else if (sunPosition.y > (GROUND_Y + 300) && night) {
    stars = false;
    addStars();
    night = false
    sky.material.opacity = 1;
    sky.material.needsUpdate = true;
  }
}
