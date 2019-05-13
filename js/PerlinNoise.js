// Inspired by https://thebookofshaders.com/13/
// and by Planet 426.
var NoiseGenerator = function(domain) {
  return NoiseGenerator(domain, 5.);
}

var NoiseGenerator = function(domain, scale) {
  // Properties
  this.octaves = 16;
  this.lacunarity = 1.7;
  this.gain = 0.5;
  
  // Initial values
  this.amplitude = 0.5;
  this.frequency = 1 / (domain / scale);

  this.noiseObj = new ImprovedNoise();

  // Generates 1-D noise value for vec3.
  this.generate = function(x, y, z) {
    let frequency = this.frequency;
    let amplitude = this.amplitude;
    let noise = 0;
    // Loop of octaves
    for (var i = 0; i < this.octaves; i++) {
      noise += amplitude * this.noiseObj.noise(x*frequency, y*frequency, z*frequency);
      frequency *= this.lacunarity;
      amplitude *= this.gain;
    } 
    return noise + this.amplitude;
  }
}

var ModPerlinGenerator = function(quality, steps, factor, scale) {
  // Parameters
  this.perlin = new ImprovedNoise();
  this.quality = quality;
  this.steps = steps;
  this.factor = factor;
  this.scale = scale;

  // Generate displacement
  this.generate = function (x, y, z, normalize) {
    var q = 1, d = 0;
    for (var i = steps; i > 0; i--, q *= quality) {
      d += Math.abs(this.perlin.noise(x/q, y/q, z/q)*q*factor);
    }
    return Math.pow(d, scale);
  }
}