var rawHeightMap;
var mountainHeightMap;
var mountainTexture;
var mountainMaterial;
var mountainMesh;

var size = 5.0;
var defaultDisplacementScale = 500;

var scale = 4.0;

var regionResolution = 4;
var mountainWidth = 1536;
var mountainHeight = 512;
var mountainWidthSegments;
var mountainHeightSegments;
var regionWidth = mountainWidth + 512 * 3;//512;
var regionHeight = mountainHeight + 512 * 3;//512;
var regionWidthSegments; 
var regionHeightSegments;

function calculate_segments() {
  regionWidthSegments = regionWidth / regionResolution;
  regionHeightSegments = regionHeight / regionResolution;
  mountainWidthSegments = mountainWidth / regionResolution;
  mountainHeightSegments = mountainHeight / regionResolution;
}
calculate_segments();

function init_terrain() {
  // needed for mountain texture
  mountainTexture = loader.load( "textures/terrain/rockmap.jpg" );
  console.log(mountainTexture);
  mountainTexture.wrapS = mountainTexture.wrapT = THREE.RepeatWrapping;
  mountainTexture.repeat.set( 6,4 );
  mountainTexture.anisotropy = 16;

  // create a buffer with color data

  rawHeightMap = generateHeightMap(regionWidthSegments,regionHeightSegments,
    mountainWidthSegments, mountainHeightSegments, scale);
  ridgeify(rawHeightMap);
  mountainHeightMap = heightMapToTexture(rawHeightMap);

  // mountain
  mountainMaterial = new THREE.MeshPhongMaterial({
    color: 0x404761, //0x3c3c3c,
    specular: 0x000000, //0x3c3c3c//,
    side: THREE.DoubleSide,
    map: mountainTexture,
    displacementMap: mountainHeightMap,
    displacementScale: defaultDisplacementScale
  });

  // mountain mesh
  let meshGeometry = new THREE.PlaneBufferGeometry(regionWidth, regionHeight,
    regionWidthSegments, regionHeightSegments);
  mountainMesh = new THREE.Mesh(meshGeometry, mountainMaterial);

  mountainMesh.position.y = GROUND_Y - 1;
  mountainMesh.rotation.x = -Math.PI / 2;
  mountainMesh.receiveShadow = true;
  mountainMesh.wireframe = true;
}

function update_terrain_size(new_size) {
  size = new_size
  mountainMesh.material.displacementScale = size / 5. * defaultDisplacementScale;
}

function update_terrain_scale(new_scale) {
  scale = new_scale;
  let newMountainTexture = heightMapToTexture(
    generateHeightMap(regionWidthSegments,regionHeightSegments,
    mountainWidthSegments, mountainHeightSegments, scale));
  mountainMesh.material.displacementMap = newMountainTexture;
}

function update_terrain_width(new_width) {
  mountainWidth = new_width;
  regionWidth = new_width + 256;
  calculate_segments();

  let newMountainTexture = heightMapToTexture(
    generateHeightMap(regionWidthSegments,regionHeightSegments,
    mountainWidthSegments, mountainHeightSegments, scale));
  mountainMesh.material.displacementMap = newMountainTexture;
}

function update_texture() {
  let newMountainTexture = heightMapToTexture(getRandomHeightMap(regionWidth, regionHeight));
  //mountainMesh.material.displacementMap = newMountainTexture;
}