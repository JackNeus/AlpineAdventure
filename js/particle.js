function Particle(x, y, z, mass) {
  this.position = new THREE.Vector3(); // position
  this.previous = new THREE.Vector3(); // previous
  this.original = new THREE.Vector3(); // original
  initParameterizedPosition(x, y, this.position);
  initParameterizedPosition(x, y, this.previous);
  initParameterizedPosition(x, y, this.original);

  this.netForce = new THREE.Vector3(); // net force acting on particle
  this.mass = mass; // mass of the particle
}

Particle.prototype.lockToOriginal = function() {
  this.position.copy(this.original);
  this.previous.copy(this.original);
};

Particle.prototype.lock = function() {
  this.position.copy(this.previous);
  this.previous.copy(this.previous);
};

Particle.prototype.addForce = function(force) {
  // ----------- STUDENT CODE BEGIN ------------
  // Add the given force to the particle's total netForce.
  this.netForce.add(force);
  // ----------- STUDENT CODE END ------------
};

Particle.prototype.integrate = function(deltaT) {
  // ----------- STUDENT CODE BEGIN ------------
  // Perform Verlet integration on this particle with the provided
  // timestep deltaT.
  //
  // You need to:
  // (1) Save the old (i.e. current) position into this.previous.
  // (2) Compute the new position of this particle using Verlet integration,
  //     and store it into this.position.
  // (3) Reset the net force acting on the particle (i.e. make it (0, 0, 0) again).
  // ----------- Our reference solution uses 13 lines of code.
  let new_position = this.position.clone();
  new_position.add(new THREE.Vector3().subVectors(this.position, this.previous).multiplyScalar(1 - DAMPING));
  new_position.add(this.netForce.clone().multiplyScalar(deltaT * deltaT / MASS));
  this.previous = this.position.clone();
  this.position = new_position;
  this.netForce = new THREE.Vector3(0, 0, 0);
  // ----------- STUDENT CODE END ------------
};

Particle.prototype.handleFloorCollision = function() {
  // ----------- STUDENT CODE BEGIN ------------
  // Handle collision of this particle with the floor.
  if (this.position.y < GROUND_Y) this.position.y = GROUND_Y;
  // ----------- STUDENT CODE END ------------
};

Particle.prototype.handleSphereCollision = function() {
  if (sphere.visible) {
    // ----------- STUDENT CODE BEGIN ------------
    // Handle collision of this particle with the sphere.
    let posFriction = new THREE.Vector3();
    let posNoFriction = new THREE.Vector3();
    
    let radialVec = new THREE.Vector3().subVectors(this.position, spherePosition);

    if (radialVec.length() > sphereSize) return; // Particle not in sphere.
    posNoFriction = new THREE.Vector3().addVectors(spherePosition, radialVec.clone().setLength(sphereSize));
    
    let oldRadialVec = new THREE.Vector3().subVectors(this.previous, prevSpherePosition);   
    if (oldRadialVec.length() > sphereSize) {
      let sphereMovement = new THREE.Vector3().subVectors(spherePosition, prevSpherePosition);
      posFriction = this.previous.clone().add(sphereMovement);

      this.position = new THREE.Vector3().addVectors(
        posFriction.clone().multiplyScalar(friction), 
        posNoFriction.clone().multiplyScalar(1 - friction));
    } else {
      this.position = posNoFriction.clone();
    }
    // ----------- STUDENT CODE END ------------
  }
};

Particle.prototype.handleBoxCollision = function() {
  if (box.visible) {
    // ----------- STUDENT CODE BEGIN ------------
    // Handle collision of this particle with the axis-aligned box.
    let posFriction = new THREE.Vector3();
    let posNoFriction = new THREE.Vector3();
    
    if (!boundingBox.containsPoint(this.position)) return; // Point not in box.

    let bestDist = Math.max(Math.max(boundingBox.max.x - boundingBox.min.x, 
      boundingBox.max.y - boundingBox.min.y), boundingBox.max.z - boundingBox.min.z);

    // To project the point onto the box, check all six faces and pick the one
    // with minimal distance to the original point.
    for (let i = 0; i < 6; i++) {
      let potProjPoint;
      if (i == 0)  potProjPoint = this.position.clone().setComponent(0, boundingBox.min.x);
      if (i == 1)  potProjPoint = this.position.clone().setComponent(1, boundingBox.min.y);
      if (i == 2)  potProjPoint = this.position.clone().setComponent(2, boundingBox.min.z);
      if (i == 3)  potProjPoint = this.position.clone().setComponent(0, boundingBox.max.x);
      if (i == 4)  potProjPoint = this.position.clone().setComponent(1, boundingBox.max.y);
      if (i == 5)  potProjPoint = this.position.clone().setComponent(2, boundingBox.max.z);
      
      let dist = new THREE.Vector3().subVectors(potProjPoint, this.position).length();
      if (dist < bestDist) {
        bestDist = dist;
        posNoFriction = potProjPoint;
      }
    }

    if (!boundingBox.containsPoint(this.previous)) {
      posFriction = this.previous.clone();
      this.position = new THREE.Vector3().addVectors(posFriction.multiplyScalar(friction),
        posNoFriction.multiplyScalar(1 - friction));
    } else {
      this.position = posNoFriction;
    }
    // ----------- Our reference solution uses 61 lines of code.
    // ----------- STUDENT CODE END ------------
  }
};
