function main() {
    var canvas_element = document.getElementById("mainCanvas");

    canvas_element.width = window.innerWidth;
    canvas_element.height = window.innerHeight;

    var gl = canvas_element.getContext("webgl");

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
    vec3 hsvTOrgb(vec3 c) {
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

    var vertex_buf = gl.createBuffer(gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    var position_attrib_location = gl.getAttribLocation(mandelbrot_program, "a_Position");
    gl.enableVertexAttribArray(position_attrib_location);
    gl.vertexAttribPointer(position_attrib_location, 2, gl.FLOAT, false, 0, 0);

    var zoom_center_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomCenter");
    var zoom_size_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomSize");
    var max_iterations_uniform = gl.getUniformLocation(mandelbrot_program, "u_maxIterations");

    var zoom_center = [0.0, 0.0];
    var target_zoom_center = [0.0, 0.0];
    var zoom_size = 2.0;

    // === Auto zoom configuration ===
    var stop_zooming = false;     // Start auto zooming
    var zoom_factor = 0.998;       // Zoom speed
    var max_iterations = 300;

    document.addEventListener("keydown", function (e) {
        if (e.code === "Space") {
            stop_zooming = !stop_zooming;
        }
    });

    var renderFrame = function () {
        gl.uniform2f(zoom_center_uniform, zoom_center[0], zoom_center[1]);
        gl.uniform1f(zoom_size_uniform, zoom_size);
        gl.uniform1i(max_iterations_uniform, max_iterations);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (!stop_zooming) {
            if (max_iterations < 50) max_iterations = 50;

            if (zoom_size < 1e-5) {
                stop_zooming = true;
                var warning = document.getElementById('zoom-warning');
                warning.style.display = 'block'
            }


            zoom_size *= zoom_factor;

            zoom_center[0] += 0.1 * (target_zoom_center[0] - zoom_center[0]);
            zoom_center[1] += 0.1 * (target_zoom_center[1] - zoom_center[1]);

            window.requestAnimationFrame(renderFrame);
        } else {
            window.requestAnimationFrame(renderFrame);
        }
    }

    // Optional: Keep target zoom center under mouse
    document.onmousemove = function(e) {
        var x_part = e.pageX / canvas_element.width;
        var y_part = e.pageY / canvas_element.height;

        var sensitivity = 0.25;  // Reduce to make movement slower (try 0.1–0.5)

        target_zoom_center[0] = zoom_center[0] - (zoom_size / 2.0) * sensitivity + x_part * zoom_size * sensitivity;
        target_zoom_center[1] = zoom_center[1] + (zoom_size / 2.0) * sensitivity - y_part * zoom_size * sensitivity;

    }

    // Resize reload
    window.onresize = function () { location.reload(); }

    renderFrame();
}
main();