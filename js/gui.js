var guiEnabled = true;

if (guiEnabled) {
  // GUI properties
  guiControls = new (function() {
    this.snow = snow;
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
}
