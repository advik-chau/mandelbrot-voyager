function main() {
    /* locate the canvas element */
    var canvas_element = document.getElementById("mainCanvas");

    canvas_element.width = window.innerWidth;
    canvas_element.height = window.innerHeight;
    
    /* obtain a webgl rendering context */
    var gl = canvas_element.getContext("webgl");
  
    /* get shader code from the <script> tags */
    var vertexShaderCode = `
    precision highp float;
    attribute vec2 a_Position;
    void main() {
      gl_Position = vec4(a_Position.x, a_Position.y, 0.0, 1.0);
    }`;

    var fragmentShaderCode = `
    precision highp float;
    uniform vec2 u_zoomCenter;
    uniform float u_zoomSize;
    uniform int u_maxIterations;
    
    vec2 nextTerm(vec2 z, vec2 c) {
      return mat2(z,-z.y,z.x)*z*1.3 + c;
    }
    vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
        return a + b*cos(6.28318*(c*t+d));
    }
    vec3 hsvTOrgb(vec3 c)
    {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / vec2(800.0, 800.0);
      vec2 c = u_zoomCenter + (uv * 4.0 - vec2(5.0, 2.3)) * (u_zoomSize / 4.0);
      vec2 z = vec2(0.0);   
      bool outsideSet = false;
      int iterations = 0;    

      for (int i = 0; i < 10000; i++) {
        if (i > u_maxIterations) break;
        
        z = nextTerm(z, c);

        if (z.x*z.x + z.y*z.y > 4.0) {
            outsideSet = true;
          break;
        }
        iterations++;
      }
      float blowupiness = float(iterations)/float(40);

      gl_FragColor = outsideSet ? vec4(hsvTOrgb(vec3(blowupiness, 1.0, 1.0)), 1.0) : vec4(0, 0, 0, 0);

    }`;

    /* OG SHADER: #vec4(palette(float(iterations)/float(u_maxIterations), vec3(0.0),vec3(0.59,0.55,0.75),vec3(0.1, 0.2, 0.3),vec3(0.75)),1.0) : vec4(vec3(0.85, 0.99, 1.0), 1.0); */
    /* compile and link shaders */
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);
    
    var mandelbrot_program = gl.createProgram();
    gl.attachShader(mandelbrot_program, vertexShader);
    gl.attachShader(mandelbrot_program, fragmentShader);
    gl.linkProgram(mandelbrot_program);
    gl.useProgram(mandelbrot_program);
  
    /* create a vertex buffer for a full-screen triangle */
    var vertex_buf = gl.createBuffer(gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    
    /* set up the position attribute */
    var position_attrib_location = gl.getAttribLocation(mandelbrot_program, "a_Position");
    gl.enableVertexAttribArray(position_attrib_location);
    gl.vertexAttribPointer(position_attrib_location, 2, gl.FLOAT, false, 0, 0);
  
    /* find uniform locations */
    var zoom_center_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomCenter");
    var zoom_size_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomSize");
    var max_iterations_uniform = gl.getUniformLocation(mandelbrot_program, "u_maxIterations");
    
    /* these hold the state of zoom operation */
    var zoom_center = [0.0, 0.0];
    var target_zoom_center = [0.0, 0.0];
    var zoom_size = 2.0;
    var stop_zooming = true;
    var zoom_factor = 1.0;
    var max_iterations = 300;
      
    var renderFrame = function () {
      /* bind inputs & render frame */
      gl.uniform2f(zoom_center_uniform, zoom_center[0], zoom_center[1]);
      gl.uniform1f(zoom_size_uniform, zoom_size);
      gl.uniform1i(max_iterations_uniform, max_iterations);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      
      /* handle zoom */
      if (!stop_zooming) { /* zooming in progress */
        /* gradually decrease number of iterations, reducing detail, to speed up rendering */
        //max_iterations -= 10;
        if (max_iterations < 50) max_iterations = 50;
        
        /* zoom in */
        zoom_size *= zoom_factor;
        
        /* move zoom center towards target */
        zoom_center[0] += 0.1 * (target_zoom_center[0] - zoom_center[0]);
        zoom_center[1] += 0.1 * ( target_zoom_center[1] - zoom_center[1]);
  
        window.requestAnimationFrame(renderFrame);
      } else if (max_iterations < 500) {
          /* once zoom operation is complete, bounce back to normal detail level */
          //max_iterations += 100;
          window.requestAnimationFrame(renderFrame);
      }
    }

    document.addEventListener('wheel', function(e) {
        var x_part = e.deltaX / canvas_element.width;
        var y_part = e.deltaY / canvas_element.height;
        //target_zoom_center = 
        //target_zoom_center[0] = //zoom_center[0] - zoom_size / 2.0 + x_part * zoom_size;
        //target_zoom_center[1] = //zoom_center[1] + zoom_size / 2.0 - y_part * zoom_size;
        stop_zooming = false;
        zoom_factor = e.deltaY > 0 ? 0.99 : 1.01;
        renderFrame();
        timer = setTimeout(function() {
            stop_zooming = true;
       }, 150);
  
        return true;
      });

      canvas_element.oncontextmenu = function(e){return false;}
      canvas_element.onmouseup = function(e) { stop_zooming = true; }
      
      document.onmousemove = function(e) {
        var x_part = e.pageX / canvas_element.width;
        var y_part = e.pageY / canvas_element.height;
        
        target_zoom_center[0] = zoom_center[0] - zoom_size / 2.0 + x_part * zoom_size;
        target_zoom_center[1] = zoom_center[1] + zoom_size / 2.0 - y_part * zoom_size;
      }

      window.onresize = function(){ location.reload(); }

      
     
    /* input handling 
    canvas_element.onmousedown = function(e) {
      var x_part = e.offsetX / canvas_element.width;
      var y_part = e.offsetY / canvas_element.height;
      target_zoom_center[0] = zoom_center[0] - zoom_size / 2.0 + x_part * zoom_size;
      target_zoom_center[1] = zoom_center[1] + zoom_size / 2.0 - y_part * zoom_size;
      stop_zooming = false;
      zoom_factor = e.buttons & 1 ? 0.99 : 1.01;
      renderFrame();
      return true;
    }
    canvas_element.oncontextmenu = function(e){return false;}
    canvas_element.onmouseup = function(e) { stop_zooming = true; }*/
    
    /* display initial frame */
    renderFrame(); 
  }

  function getSettingData() {
    var colourSensitivity = document.getElementById("colourSensitivity").value;
    var it = document.getElementById("it").value *50;
    var it2 = document.getElementById("it2").value;

    var canvas_element = document.getElementById("mainCanvas");

    document.getElementById("colourSensitivityVal").innerHTML = colourSensitivity;
    document.getElementById("itVal").innerHTML = document.getElementById("it").value;
    document.getElementById("it2Val").innerHTML = document.getElementById("it2").value;

    canvas_element.width = window.innerWidth;
    canvas_element.height = window.innerHeight;
    
    /* obtain a webgl rendering context */
    var gl = canvas_element.getContext("webgl");
  
    /* get shader code from the <script> tags */
    var vertexShaderCode = `
    precision highp float;
    attribute vec2 a_Position;
    void main() {
      gl_Position = vec4(a_Position.x, a_Position.y, 0.0, 1.0);
    }`;

    var fragmentShaderCode = `
    precision highp float;
    uniform vec2 u_zoomCenter;
    uniform float u_zoomSize;
    uniform int u_maxIterations;
    
    vec2 nextTerm(vec2 z, vec2 c) {
      return mat2(z,-z.y,z.x)*z*1.3${it} + c;
    }
    vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
        return a + b*cos(6.28318*(c*t+d));
    }
    vec3 hsvTOrgb(vec3 c)
    {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / vec2(800.0, 800.0);
      vec2 c = u_zoomCenter + (uv * 4.0 - vec2(5.0, 2.3)) * (u_zoomSize / 4.0);
      vec2 z = vec2(0.0 + float(${it2}));   
      bool outsideSet = false;
      int iterations = 0;    

      for (int i = 0; i < 10000; i++) {
        if (i > u_maxIterations) break;
        
        z = nextTerm(z, c);

        if (z.x*z.x + z.y*z.y > 4.0) {
            outsideSet = true;
          break;
        }
        iterations++;
      }
      float blowupiness = float(${colourSensitivity})*float(iterations)/float(40);

      gl_FragColor = outsideSet ? vec4(hsvTOrgb(vec3(blowupiness, 1.0, 1.0)), 1.0) : vec4(0, 0, 0, 0);

    }`;

    /* OG SHADER: #vec4(palette(float(iterations)/float(u_maxIterations), vec3(0.0),vec3(0.59,0.55,0.75),vec3(0.1, 0.2, 0.3),vec3(0.75)),1.0) : vec4(vec3(0.85, 0.99, 1.0), 1.0); */
    /* compile and link shaders */
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);
    
    var mandelbrot_program = gl.createProgram();
    gl.attachShader(mandelbrot_program, vertexShader);
    gl.attachShader(mandelbrot_program, fragmentShader);
    gl.linkProgram(mandelbrot_program);
    gl.useProgram(mandelbrot_program);
  
    /* create a vertex buffer for a full-screen triangle */
    var vertex_buf = gl.createBuffer(gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    
    /* set up the position attribute */
    var position_attrib_location = gl.getAttribLocation(mandelbrot_program, "a_Position");
    gl.enableVertexAttribArray(position_attrib_location);
    gl.vertexAttribPointer(position_attrib_location, 2, gl.FLOAT, false, 0, 0);
  
    /* find uniform locations */
    var zoom_center_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomCenter");
    var zoom_size_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomSize");
    var max_iterations_uniform = gl.getUniformLocation(mandelbrot_program, "u_maxIterations");
    
    /* these hold the state of zoom operation */
    var zoom_center = [0.0, 0.0];
    var target_zoom_center = [0.0, 0.0];
    var zoom_size = 2.0;
    var stop_zooming = true;
    var zoom_factor = 1.0;
    var max_iterations = 300;
      
    var renderFrame = function () {
      /* bind inputs & render frame */
      gl.uniform2f(zoom_center_uniform, zoom_center[0], zoom_center[1]);
      gl.uniform1f(zoom_size_uniform, zoom_size);
      gl.uniform1i(max_iterations_uniform, max_iterations);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      
      /* handle zoom */
      if (!stop_zooming) { /* zooming in progress */
        /* gradually decrease number of iterations, reducing detail, to speed up rendering */
        //max_iterations -= 10;
        if (max_iterations < 50) max_iterations = 50;
        
        /* zoom in */
        zoom_size *= zoom_factor;
        
        /* move zoom center towards target */
        zoom_center[0] += 0.1 * (target_zoom_center[0] - zoom_center[0]);
        zoom_center[1] += 0.1 * ( target_zoom_center[1] - zoom_center[1]);
  
        window.requestAnimationFrame(renderFrame);
      } else if (max_iterations < 500) {
          /* once zoom operation is complete, bounce back to normal detail level */
          //max_iterations += 100;
          window.requestAnimationFrame(renderFrame);
      }
    }

    document.addEventListener('wheel', function(e) {
        var x_part = e.deltaX / canvas_element.width;
        var y_part = e.deltaY / canvas_element.height;
        //target_zoom_center = 
        //target_zoom_center[0] = //zoom_center[0] - zoom_size / 2.0 + x_part * zoom_size;
        //target_zoom_center[1] = //zoom_center[1] + zoom_size / 2.0 - y_part * zoom_size;
        stop_zooming = false;
        zoom_factor = e.deltaY > 0 ? 0.99 : 1.01;
        renderFrame();
        timer = setTimeout(function() {
            stop_zooming = true;
       }, 150);
  
        return true;
      });

      canvas_element.oncontextmenu = function(e){return false;}
      canvas_element.onmouseup = function(e) { stop_zooming = true; }
      
      document.onmousemove = function(e) {
        var x_part = e.pageX / canvas_element.width;
        var y_part = e.pageY / canvas_element.height;
        
        target_zoom_center[0] = zoom_center[0] - zoom_size / 2.0 + x_part * zoom_size;
        target_zoom_center[1] = zoom_center[1] + zoom_size / 2.0 - y_part * zoom_size;
      }

      window.onresize = function(){ location.reload(); }

      
     
    /* input handling 
    canvas_element.onmousedown = function(e) {
      var x_part = e.offsetX / canvas_element.width;
      var y_part = e.offsetY / canvas_element.height;
      target_zoom_center[0] = zoom_center[0] - zoom_size / 2.0 + x_part * zoom_size;
      target_zoom_center[1] = zoom_center[1] + zoom_size / 2.0 - y_part * zoom_size;
      stop_zooming = false;
      zoom_factor = e.buttons & 1 ? 0.99 : 1.01;
      renderFrame();
      return true;
    }
    canvas_element.oncontextmenu = function(e){return false;}
    canvas_element.onmouseup = function(e) { stop_zooming = true; }*/
    
    /* display initial frame */
    renderFrame(); 
  }

  
 main()