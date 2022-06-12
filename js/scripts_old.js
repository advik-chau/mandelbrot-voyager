var canvas = document.getElementById('mainCanvas')
var ctx = canvas.getContext('2d')

function inSet(num) {
    var maxIter=40;
    var z = math.complex(0, 0);

    for (let a=0; a<maxIter; a++){
        z = math.add(math.multiply(z, z), num);
        
        if (math.add(math.multiply(math.re(z), math.re(z)), math.multiply(math.im(z), math.im(z))) > 4) {
            console.log("NOT IN")
            return false;
        }
    } 
    return true;
}

var pixelSkips = 1;
var maxIter = 10;
 
function drawPixel(r, g, b, x, y) {
    ctx.fillStyle = "rgba("+r+","+g+","+b+","+1+")";
    ctx.fillRect(x, y, 1, 1 );
}

var zoom = 1;
const zoom_increment = 0.05;

function drawSet() {
    for (y=0; y < window.innerHeight; y+=pixelSkips) {
        for (x=0; x < window.innerWidth; x+=pixelSkips) {
           // console.log(inSet(math.complex(x/window.innerWidth, y/window.innerHeight)));
            if (inSet(math.complex(x*zoom/window.innerWidth, y*zoom/window.innerHeight))) {
                drawPixel(255,134, 124, x, y);
                console.log("drawing..." + x + " " + y)
            }
            //console.log(x/window.innerWidth, y/window.innerHeight)
        }
    }  
}

document.addEventListener("wheel", function(e) {
    if (e.deltaY > 0) {
        zoom -= zoom_increment;
        drawSet();
    } else {
        zoom += zoom_increment
        drawSet();
    }
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    drawSet();
}

resizeCanvas();
