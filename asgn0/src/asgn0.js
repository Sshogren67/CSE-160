// DrawTriangle.js (c) 2012 matsuda
let canvas;
let ctx;

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return false;
  }

  // Get the rendering context for 2DCG
  ctx = canvas.getContext('2d');

  clearCanvas();

  var v1 = new Vector3([1, 1, 0]);
  drawVector(v1, 'red');
}

function clearCanvas() {
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(v, color) {
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height / 2);
  ctx.lineTo(
    canvas.width / 2 + v.elements[0] * 20,
    canvas.height / 2 - v.elements[1] * 20
  );
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function angleBetween(v1, v2) {
  const magnitudeProduct = v1.magnitude() * v2.magnitude();

  if (magnitudeProduct === 0) {
    console.log('Angle: undefined (one of the vectors has zero magnitude)');
    return;
  }

  const cosine = Vector3.dot(v1, v2) / magnitudeProduct;
  const clampedCosine = Math.min(1, Math.max(-1, cosine));
  const angle = Math.acos(clampedCosine) * (180 / Math.PI);

  console.log('Angle:', angle);
}

function areaTriangle(v1, v2) {
  const crossProduct = Vector3.cross(v1, v2);
  const area = crossProduct.magnitude() / 2;

  console.log('Area of the triangle:', area);
}

function handleDrawEvent() {
  const x1 = parseFloat(document.getElementById('x1').value) || 0;
  const y1 = parseFloat(document.getElementById('y1').value) || 0;
  const x2 = parseFloat(document.getElementById('x2').value) || 0;
  const y2 = parseFloat(document.getElementById('y2').value) || 0;

  clearCanvas();

  const v1 = new Vector3([x1, y1, 0]);
  const v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, 'red');
  drawVector(v2, 'blue');
}

function handleDrawOperationEvent() {
  const x1 = parseFloat(document.getElementById('x1').value) || 0;
  const y1 = parseFloat(document.getElementById('y1').value) || 0;
  const x2 = parseFloat(document.getElementById('x2').value) || 0;
  const y2 = parseFloat(document.getElementById('y2').value) || 0;
  const scalar = parseFloat(document.getElementById('scalar').value) || 0;
  const operation = document.getElementById('operation').value;

  clearCanvas();

  const v1 = new Vector3([x1, y1, 0]);
  const v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, 'red');
  drawVector(v2, 'blue');

  if (operation === 'add') {
    const v3 = new Vector3([x1, y1, 0]);
    v3.add(v2);
    drawVector(v3, 'green');
  } else if (operation === 'sub') {
    const v3 = new Vector3([x1, y1, 0]);
    v3.sub(v2);
    drawVector(v3, 'green');
  } else if (operation === 'mul') {
    const v3 = new Vector3([x1, y1, 0]);
    const v4 = new Vector3([x2, y2, 0]);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (operation === 'div') {
    if (scalar === 0) {
      console.log('Cannot divide by zero.');
      return;
    }

    const v3 = new Vector3([x1, y1, 0]);
    const v4 = new Vector3([x2, y2, 0]);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (operation === 'magnitude') {
    console.log('Magnitude of v1:', v1.magnitude());
    console.log('Magnitude of v2:', v2.magnitude());
  } else if (operation === 'normalize') {
    const v3 = new Vector3([x1, y1, 0]);
    const v4 = new Vector3([x2, y2, 0]);
    v3.normalize();
    v4.normalize();
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (operation === 'angle') {
    angleBetween(v1, v2);
  } else if (operation === 'area') {
    areaTriangle(v1, v2);
  }
}
