var guiEnabled = true;

if (guiEnabled) {
  // GUI properties
  guiControls = new (function() {
    this.snow = snow;
    this.clouds = clouds;
    this.stars = stars;
    this.sunSimulation = sunSimulation;
    this.sunElevation = sunAngle;
    this.sunAzimuth = sunAzimuth;
    this.size = size;
    this.scale = scale;
    this.width = mountainWidth;
  })();

  // GUI elements
  gui = new dat.GUI();

  let sunControl = gui
    .add(guiControls, "sunSimulation")
    .name("Sun Simulation")
    .onChange(function(value) {
      sunSimulation = value;
    });

  let sunElevation = gui
    .add(guiControls, "sunElevation", 0, 360)
    .step(10)
    .name("Elevation")
    .onChange(function(value) {
      sunAngle = value;
      updateSunElevationAngle();
    });

  let sunAzimuthControl = gui
    .add(guiControls, "sunAzimuth", 0, 360)
    .step(10)
    .name("Azimuth")
    .onChange(function(value) {
      sunAzimuth = value;
      updateSunAzimuthAngle();
    });

  let interactionControls = gui.addFolder("Weather");

  interactionControls
    .add(guiControls, "snow")
    .name("Snow")
    .onChange(function(value) {
      snow = value;
      addSnow();
    });
  interactionControls
    .add(guiControls, "clouds")
    .name("Clouds")
    .onChange(function(value) {
      clouds = value;
      addClouds();
    });
  interactionControls
    .add(guiControls, "stars")
    .name("Stars")
    .onChange(function(value) {
      stars = value;
      addStars();
    });

  let terrainControls = gui.addFolder("Terrain");

  terrainControls
    .add(guiControls, "size", 0, 10).step(1)
    .name("size")
    .onChange(function(value) {
      update_terrain_size(value);
    });  

  terrainControls
    .add(guiControls, "scale", 0, 10).step(1)
    .name("scale")
    .onChange(function(value) {
      update_terrain_scale(value);
    });

  terrainControls
    .add(guiControls, "width", 0, 4096).step(256)
    .name("width")
    .onChange(function(value) {
      update_terrain_width(value);
    });
}
