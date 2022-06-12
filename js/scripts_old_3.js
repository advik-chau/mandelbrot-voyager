function Complex(re, im) {
    this.re = re;
    this.im = im;
  }

  Complex.prototype.add = function(other) {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  Complex.prototype.mul = function(other) {
    return new Complex(this.re * other.re - this.im * other.im, this.re * other.im + this.im * other.re);
  }

  Complex.prototype.abs = function() {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  function belongs(re, im, iterations) {
    var z = new Complex(0, 0);
    var c = new Complex(re, im);
    var i = 0;
    while (z.abs() < 2 && i < iterations) {
      z = z.mul(z).add(c);
      i++;
    }
    return i;
  }

  var canvas = document.getElementById('mainCanvas');
  var ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  function pixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  function draw(width, height, maxIterations) {
    var xcord = -2.5;
    var ycord = 1;
    var m = 0;
    var n = 0;

    var width_increment = 3.5 / width;
    var height_increment = 2 / height;

    while (m <= (width + 1)) {
        var x = 0;
        var y = 0;
        var iteration = 0;
        var max_iteration = maxIterations;
        var xtemp;
        var colour;
 
        while (x < 2 && y < 2 && iteration < max_iteration) {
            xtemp = (x * x) - (y * y) + xcord;
            y = (2 * x * y) + ycord;
            x = xtemp;
            iteration = iteration + 1;
        }
 
        if (iteration === max_iteration) {
            colour = "rgb(0,0,0)";
        } else {
            colour = "rgb(" + (iteration) + "," + (iteration) + ",255)";
        }
 
        ctx.fillStyle = colour;
        ctx.fillRect(m, n, 4, 4);
 
        ycord = ycord - height_increment;
        n = n + 1;
 
        if (n === height) {
            xcord = xcord + width_increment;
            ycord = 1;
            m = m + 1;
            n = 0;
        }
    }
  }

  var iterations = [30, 40, 50];
  var i = 0;
  var interval = setInterval(function() {
    //draw(450, 300, iterations[i]);
    drawOLD(canvas.width, canvas.height, iterations[i]);
    
    i++
    if (i >= iterations.length) {
      clearInterval(interval);
    }
  }, 5);


  function drawOLD(width, height, maxIterations) {
    var minRe = -2, maxRe = 1, minIm = -1, maxIm = 1;
    var reStep = (maxRe - minRe) / width, imStep = (maxIm - minIm) / height;
    var re = minRe;
    while (re < maxRe) {
      var im = minIm;
      while (im < maxIm) {
        var result = belongs(re, im, maxIterations);
        var x = (re - minRe) / reStep, y = (im - minIm) / imStep;
        if (result == maxIterations) {
          pixel(x, y, 'black');
        } else {
          var h = 30 + Math.round(120 * result * 1.0 / maxIterations);
          var color = 'hsl(' + h + ', 100%, 50%)';
          pixel(x, y, color);
        }
        im += imStep;
      }
      re += reStep;
    }
  }