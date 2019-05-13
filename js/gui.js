var guiEnabled = true;

if (guiEnabled) {
  // GUI properties
  guiControls = new (function() {
    this.snow = snow;
    this.clouds = clouds;
    this.stars = stars;
    this.sunSimulation = sunSimulation;
  })();

  // GUI elements
  gui = new dat.GUI();

  let sunControl = gui
    .add(guiControls, "sunSimulation")
    .name("Sun Simulation")
    .onChange(function(value) {
      sunSimulation = value;
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
}
