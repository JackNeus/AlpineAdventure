var guiEnabled = true;

if (guiEnabled) {
  // GUI properties
  guiControls = new (function() {
    this.snow = snow;
    this.clouds = clouds;
    this.stars = stars;
  })();

  // GUI elements
  gui = new dat.GUI();

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
