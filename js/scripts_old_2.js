var canvas = document.getElementById('mainCanvas')
var ctx = canvas.getContext('2d')

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var ImageHeight = canvas.height;
var ImageWidth = canvas.width;

let MinRe = -2.0;
let MaxRe = 1.0;
let MinIm = -1.2;
let MaxIm = MinIm+(MaxRe-MinRe)*ImageHeight/ImageWidth;
let Re_factor = (MaxRe-MinRe)/(ImageWidth-1);
let Im_factor = (MaxIm-MinIm)/(ImageHeight-1);
let MaxIterations = 30;

const out = ctx.createImageData(ImageWidth, ImageHeight);
var pixelCount = 0;

for(let y=0; y<ImageHeight; y+=4)
{
    let c_im = MaxIm - y*Im_factor;
    for(let x=0; x<ImageWidth; x+=4)
    {
        let c_re = MinRe + x*Re_factor;

        let Z_re = c_re, Z_im = c_im;
        var isInside = true;
        for(let n=0; n<MaxIterations; ++n)
        {
            let Z_re2 = Z_re*Z_re;
            let Z_im2 = Z_im*Z_im;
            
            if(Z_re2 + Z_im2 > 4)
            {
                isInside = false;
                break;
            }
            Z_im = 2*Z_re*Z_im + c_im;
            Z_re = Z_re2 - Z_im2 + c_re;
        }
        if(isInside) {
                out.data[pixelCount + 0] = 255;        // R value
                out.data[pixelCount + 1] = 123;        // G value
                out.data[pixelCount + 2] = 234;  // B value
                out.data[pixelCount + 3] = 1.0;      // A value

                console.log("INSET")
            }
            
        pixelCount+=4;
    }
}

ctx.putImageData(out, 0, 0);