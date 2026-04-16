// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

 // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI
let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // Default color is white
let g_canvasColor = [0.0, 0.0, 0.0, 1.0]; // Default canvas color is black

function updateColorDisplay() {
  var r = Math.round(g_selectedColor[0] * 255);
  var g = Math.round(g_selectedColor[1] * 255);
  var b = Math.round(g_selectedColor[2] * 255);
  document.getElementById('colorDisplay').style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
}
let g_selectedSize = 5; // Default point size
let g_selectedType = POINT; // Default shape type is point
let g_selectedSegments = 10; // Default circle segments
let g_selectedAngle = 0; // Rotation angle in degrees
var g_mousePos = null; // Current mouse position in GL coordinates

function addActionsForHtmlUI() {
  // Add actions for buttons
  document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; updateColorDisplay(); }
  document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; updateColorDisplay(); }
  document.getElementById('blue').onclick = function() { g_selectedColor = [0.0, 0.0, 1.0, 1.0]; updateColorDisplay(); }
  document.getElementById('clearButton').onclick = function() { g_shapesList = [];  renderAllShapes(); }
  document.getElementById('setCanvasButton').onclick = function() {
    g_canvasColor = [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], 1.0];
    gl.clearColor(g_canvasColor[0], g_canvasColor[1], g_canvasColor[2], g_canvasColor[3]);
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT; }
  document.getElementById('triButton').onclick = function() { g_selectedType = TRIANGLE; }
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE; }
  document.getElementById('printButton').onclick = printPoints;
  document.getElementById('inverseButton').onclick = invertColors;
  document.getElementById('recreateButton').onclick = recreateImage;

  // Slider events
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value / 100; updateColorDisplay(); });
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value / 100; updateColorDisplay(); });
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value / 100; updateColorDisplay(); });

 // Size slider event
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; });

  // Segments slider event
  document.getElementById('segmentSlide').addEventListener('mouseup', function() { g_selectedSegments = this.value; });

}


function main() {

  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;

  canvas.onmousemove = function(ev) {
    g_mousePos = convertCoordinatesEventToGL(ev);
    if(ev.buttons == 1) { click(ev); }
    else { renderAllShapes(); }
  };

  canvas.onmouseleave = function() {
    g_mousePos = null;
    renderAllShapes();
  };

  canvas.addEventListener('wheel', function(ev) {
    ev.preventDefault();
    g_selectedAngle += ev.deltaY > 0 ? 5 : -5;
    renderAllShapes();
  }, { passive: false });

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = []; // The array for shapes drawn on the canvas

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];   // The array to store the size of a point

function click(ev) {
  // Get the coordinates of a mouse pointer
  let [x, y] = convertCoordinatesEventToGL(ev);

 // Create and store a new point
  let point;
  if(g_selectedType == POINT) {
    point = new Point();
  } else if(g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }


  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  point.angle = g_selectedAngle;
  if (point.type === 'circle') { point.segments = g_selectedSegments; }
  g_shapesList.push(point);



  // Draw every shape thats supposed to be drawn on the canvas
  renderAllShapes();
}

// Extract the coordinates of a mouse click and convert them to WebGL's coordinate system
function convertCoordinatesEventToGL(ev) { 
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return [x, y];
}

// Draw every shape thats supposed to be drawn on the canvas
function renderAllShapes() {

  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // var len = g_points.length;

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // Draw the ghost outline preview at the current mouse position
  if (g_mousePos) {
    renderGhostShape(g_mousePos[0], g_mousePos[1]);
  }

  var duration = performance.now() - startTime;
  sendTextToHTML('numdot: ' + len + 'ms: ' + Math.floor(duration) + 'fps: ' + Math.floor(10000/duration), 'numdot');
}


// Rotate an array of flat [x0,y0, x1,y1, ...] relative vertices by angleDeg around (cx, cy)
function buildRotatedVerts(relVerts, cx, cy, angleDeg) {
  var rad = angleDeg * Math.PI / 180;
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);
  var out = [];
  for (var i = 0; i < relVerts.length; i += 2) {
    var rx = relVerts[i], ry = relVerts[i + 1];
    out.push(cx + rx * cos - ry * sin);
    out.push(cy + rx * sin + ry * cos);
  }
  return out;
}

// Draw an outline preview of the selected shape at (x, y)
function renderGhostShape(x, y) {
  var d = g_selectedSize / 200.0;
  var c = g_selectedColor;
  gl.uniform4f(u_FragColor, c[0], c[1], c[2], 0.8);

  if (g_selectedType === POINT) {
    var s = g_selectedSize / 400.0;
    var relVerts = [-s, -s, s, -s, s, s, -s, s];
    drawLineLoop(buildRotatedVerts(relVerts, x, y, g_selectedAngle));
  } else if (g_selectedType === TRIANGLE) {
    drawLineLoop(buildRotatedVerts([0, 0, d, 0, 0, d], x, y, g_selectedAngle));
  } else { // CIRCLE
    var verts = [];
    var segments = parseInt(g_selectedSegments);
    var angleStep = (2 * Math.PI) / segments;
    var offsetRad = g_selectedAngle * Math.PI / 180;
    for (var i = 0; i < segments; i++) {
      var angle = i * angleStep + offsetRad;
      verts.push(x + Math.cos(angle) * d);
      verts.push(y + Math.sin(angle) * d);
    }
    drawLineLoop(verts);
  }
}

// Draw vertices as a LINE_LOOP (outline polygon)
function drawLineLoop(vertices) {
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.LINE_LOOP, 0, vertices.length / 2);
}

function recreateImage() {
  var sceneShapes = [
    {"index":0,"type":"circle","x":-0.705,"y":0.7,"r":1,"g":0.37,"b":0.3,"a":1,"size":"30","angle":0,"segments":10},
    {"index":1,"type":"triangle","x":-0.7,"y":0.955,"r":1,"g":0.73,"b":0.3,"a":1,"size":"16","angle":-135},
    {"index":2,"type":"triangle","x":-0.5,"y":0.86,"r":1,"g":0.73,"b":0.3,"a":1,"size":"16","angle":-185},
    {"index":3,"type":"triangle","x":-0.45,"y":0.695,"r":1,"g":0.73,"b":0.3,"a":1,"size":"16","angle":-225},
    {"index":4,"type":"triangle","x":-0.525,"y":0.52,"r":1,"g":0.73,"b":0.3,"a":1,"size":"16","angle":-270},
    {"index":5,"type":"triangle","x":-0.705,"y":0.45,"r":1,"g":0.73,"b":0.3,"a":1,"size":"16","angle":-315},
    {"index":6,"type":"triangle","x":-0.89,"y":0.53,"r":1,"g":0.73,"b":0.3,"a":1,"size":"16","angle":-365},
    {"index":7,"type":"triangle","x":-0.96,"y":0.715,"r":1,"g":0.73,"b":0.3,"a":1,"size":"16","angle":-405},
    {"index":8,"type":"triangle","x":-0.885,"y":0.9,"r":1,"g":0.73,"b":0.3,"a":1,"size":"16","angle":-450},
    {"index":9,"type":"triangle","x":-0.035,"y":-0.145,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"120","angle":-630},
    {"index":10,"type":"triangle","x":-0.325,"y":-0.44,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"120","angle":-630},
    {"index":11,"type":"triangle","x":-0.04,"y":-0.145,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"120","angle":-720},
    {"index":12,"type":"triangle","x":0.27,"y":-0.455,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"120","angle":-720},
    {"index":13,"type":"triangle","x":0.495,"y":-0.245,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"97","angle":-630},
    {"index":14,"type":"triangle","x":0.485,"y":-0.24,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"97","angle":-720},
    {"index":15,"type":"triangle","x":0.7,"y":-0.46,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"97","angle":-720},
    {"index":16,"type":"point","x":-0.09,"y":-0.195,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"97","angle":-720},
    {"index":17,"type":"point","x":0.37,"y":-0.205,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"97","angle":-720},
    {"index":18,"type":"point","x":0.665,"y":-0.25,"r":0.67,"g":0.63,"b":0.62,"a":1,"size":"53","angle":-735},
    {"index":19,"type":"point","x":-0.72,"y":-0.71,"r":0.45,"g":1,"b":0.49,"a":1,"size":"111","angle":-720},
    {"index":20,"type":"point","x":-0.2,"y":-0.71,"r":0.45,"g":1,"b":0.49,"a":1,"size":"111","angle":-720},
    {"index":21,"type":"point","x":0.31,"y":-0.71,"r":0.45,"g":1,"b":0.49,"a":1,"size":"111","angle":-720},
    {"index":22,"type":"point","x":0.775,"y":-0.705,"r":0.45,"g":1,"b":0.49,"a":1,"size":"111","angle":-720},
    {"index":23,"type":"point","x":-0.74,"y":-0.745,"r":0.53,"g":0.4,"b":0.15,"a":1,"size":"31","angle":-720},
    {"index":24,"type":"point","x":-0.74,"y":-0.625,"r":0.53,"g":0.4,"b":0.15,"a":1,"size":"31","angle":-720},
    {"index":25,"type":"point","x":0.535,"y":-0.665,"r":0.53,"g":0.4,"b":0.15,"a":1,"size":"33","angle":-720},
    {"index":26,"type":"point","x":0.535,"y":-0.575,"r":0.53,"g":0.4,"b":0.15,"a":1,"size":"33","angle":-720},
    {"index":27,"type":"triangle","x":-0.04,"y":0.225,"r":1,"g":1,"b":1,"a":1,"size":"47","angle":-720},
    {"index":28,"type":"triangle","x":-0.025,"y":0.225,"r":1,"g":1,"b":1,"a":1,"size":"47","angle":-630},
    {"index":29,"type":"triangle","x":0.495,"y":0.105,"r":1,"g":1,"b":1,"a":1,"size":"28","angle":-630},
    {"index":30,"type":"triangle","x":0.48,"y":0.105,"r":1,"g":1,"b":1,"a":1,"size":"28","angle":-720},
    {"index":31,"type":"triangle","x":-0.2,"y":0.165,"r":1,"g":1,"b":1,"a":1,"size":"18","angle":-675},
    {"index":32,"type":"triangle","x":-0.09,"y":0.17,"r":1,"g":1,"b":1,"a":1,"size":"18","angle":-675},
    {"index":33,"type":"triangle","x":0.02,"y":0.165,"r":1,"g":1,"b":1,"a":1,"size":"18","angle":-675},
    {"index":34,"type":"triangle","x":0.13,"y":0.17,"r":1,"g":1,"b":1,"a":1,"size":"18","angle":-675},
    {"index":35,"type":"triangle","x":0.4,"y":0.075,"r":1,"g":1,"b":1,"a":1,"size":"12","angle":-675},
    {"index":36,"type":"triangle","x":0.465,"y":0.075,"r":1,"g":1,"b":1,"a":1,"size":"12","angle":-675},
    {"index":37,"type":"triangle","x":0.53,"y":0.065,"r":1,"g":1,"b":1,"a":1,"size":"12","angle":-675},
    {"index":38,"type":"triangle","x":0.57,"y":0.065,"r":1,"g":1,"b":1,"a":1,"size":"12","angle":-675},
    {"index":39,"type":"triangle","x":-0.74,"y":-0.375,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"61","angle":-855},
    {"index":40,"type":"triangle","x":-0.74,"y":-0.215,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"61","angle":-855},
    {"index":41,"type":"triangle","x":-0.74,"y":-0.05,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"61","angle":-855},
    {"index":42,"type":"triangle","x":-0.74,"y":-0.445,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"61","angle":-855},
    {"index":43,"type":"triangle","x":0.535,"y":-0.35,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"72","angle":-855},
    {"index":44,"type":"triangle","x":0.545,"y":-0.205,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"72","angle":-855},
    {"index":45,"type":"triangle","x":0.555,"y":-0.08,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"72","angle":-855},
    {"index":46,"type":"triangle","x":-0.45,"y":0.155,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"41","angle":-855},
    {"index":47,"type":"triangle","x":-0.46,"y":0.035,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"41","angle":-855},
    {"index":48,"type":"triangle","x":-0.46,"y":-0.085,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"41","angle":-855},
    {"index":49,"type":"triangle","x":-0.46,"y":-0.205,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"41","angle":-855},
    {"index":50,"type":"triangle","x":-0.46,"y":-0.295,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"41","angle":-855},
    {"index":51,"type":"triangle","x":-0.455,"y":-0.36,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"41","angle":-855},
    {"index":52,"type":"triangle","x":-0.455,"y":-0.41,"r":0.36,"g":0.56,"b":0.22,"a":1,"size":"41","angle":-855},
    {"index":53,"type":"point","x":-0.46,"y":-0.6,"r":0.63,"g":0.44,"b":0.22,"a":1,"size":"18","angle":-810},
    {"index":54,"type":"triangle","x":-0.93,"y":-0.985,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"18","angle":-720},
    {"index":55,"type":"triangle","x":-0.9,"y":-0.985,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"18","angle":-720},
    {"index":56,"type":"triangle","x":-0.52,"y":-0.97,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"18","angle":-720},
    {"index":57,"type":"triangle","x":0.16,"y":-0.965,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"18","angle":-720},
    {"index":58,"type":"triangle","x":-0.825,"y":-0.985,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"18","angle":-630},
    {"index":59,"type":"triangle","x":-0.44,"y":-0.965,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"18","angle":-630},
    {"index":60,"type":"triangle","x":0.225,"y":-0.965,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"18","angle":-630},
    {"index":61,"type":"triangle","x":0.265,"y":-0.96,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"18","angle":-630},
    {"index":62,"type":"triangle","x":-0.07,"y":-0.905,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"12","angle":-595},
    {"index":63,"type":"triangle","x":0.835,"y":-0.91,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"23","angle":-610},
    {"index":64,"type":"triangle","x":0.715,"y":-0.925,"r":0.41,"g":0.78,"b":0.32,"a":1,"size":"23","angle":-735}
  ];

  // Set background color
  g_canvasColor = [184/255, 255/255, 255/255, 1.0];
  gl.clearColor(g_canvasColor[0], g_canvasColor[1], g_canvasColor[2], g_canvasColor[3]);

  // Build the shapes list
  g_shapesList = sceneShapes.map(function(d) {
    var shape;
    if (d.type === 'point') {
      shape = new Point();
    } else if (d.type === 'triangle') {
      shape = new Triangle();
    } else {
      shape = new Circle();
      shape.segments = d.segments !== undefined ? d.segments : 10;
    }
    shape.position = [d.x, d.y];
    shape.color = [d.r, d.g, d.b, d.a];
    shape.size = parseFloat(d.size);
    shape.angle = d.angle !== undefined ? d.angle : 0;
    return shape;
  });

  renderAllShapes();
}

function invertColors() {
  g_canvasColor = [1.0 - g_canvasColor[0], 1.0 - g_canvasColor[1], 1.0 - g_canvasColor[2], 1.0];
  gl.clearColor(g_canvasColor[0], g_canvasColor[1], g_canvasColor[2], g_canvasColor[3]);
  for (let shape of g_shapesList) {
    shape.color = [1.0 - shape.color[0], 1.0 - shape.color[1], 1.0 - shape.color[2], shape.color[3]];
  }
  renderAllShapes();
}

function printPoints() {
  var r = (g_canvasColor[0] * 255).toFixed(0);
  var g = (g_canvasColor[1] * 255).toFixed(0);
  var b = (g_canvasColor[2] * 255).toFixed(0);
  console.log('=== Scene Data ===' );
  console.log('background: rgb(' + r + ',' + g + ',' + b + ')');
  console.log('shapes (' + g_shapesList.length + '):');
  g_shapesList.forEach(function(shape, i) {
    var pos = shape.position;
    var col = shape.color;
    var entry = {
      index: i,
      type: shape.type,
      x: pos[0],
      y: pos[1],
      r: col[0],
      g: col[1],
      b: col[2],
      a: col[3],
      size: shape.size,
      angle: shape.angle !== undefined ? shape.angle : 0
    };
    if (shape.type === 'circle') {
      entry.segments = shape.segments;
    }
    console.log(JSON.stringify(entry));
  });
  console.log('=== End Scene Data ===');
}

// Send the text to the HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log('Failed to get ' + htmlID + ' from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}