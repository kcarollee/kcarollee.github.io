THREE.CustomShader = {

    uniforms: {

        "tDiffuse": {type: "t", value: null},
        "texDiv": {type: "f", value: 170.0},
        "colorMode": {type: "f", value: 0.0}


    },

    // 0.2126 R + 0.7152 G + 0.0722 B
    // vertexshader is always the same for postprocessing steps
    vertexShader: [
    `
        varying vec2 vUv;

        void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    
        }
    `
    ].join("\n"),

    fragmentShader: [
    `
        #ifdef GL_ES
        precision highp float;
        #endif
        // pass in our custom uniforms
        uniform float texDiv;
        uniform float colorMode;

        // pass in the image/texture we'll be modifying
        uniform sampler2D tDiffuse;

        // used to determine the correct texel we're working on
        varying vec2 vUv;
        //https://gist.github.com/companje/29408948f1e8be54dd5733a74ca49bb9
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        float circle(vec2 uv,float gval){
            float greyStep = 10.0;
           // gval = float(floor(gval * greyStep))  / greyStep;
            gval *= 0.5;
            if (gval < 0.01) return 0.0;

            float c = smoothstep(gval - 0.1, gval + 0.1, length(uv - vec2(0.5, 0.5)));
            return 1.0 - c;
            //return 1.0 - step(gval, length(uv - vec2(0.5, 0.5)));
        }
        

        // gval: value between 0 and 0,1

        float lines(vec2 uv, float gval, float gap){
            float greyStep = 10.0;
            gval = floor(map(gval, .0, 1.0, 0.0, 10.0));
            if (gval < 1.0) return 0.0;
           // if (gval > 8.0) gval = 8.0;
            vec2 uvcopy = uv;
            vec2 uvm1 = mod(uv, 1.0 / gval);
            vec2 uvm2 = mod(1.0 - uv, 1.0 / gval);
            float v1 = 1.0 - smoothstep(gap - 0.01, gap + 0.01, abs(uvm1.x - uvm1.y));
            float v2 = 1.0 - smoothstep(gap - 0.01, gap + 0.01, abs(uvm1.x - uvm2.y));
            return  v1 + v2;
        }

        float boxes(vec2 uv, float num){
            num = floor(map(num, 0.0, 1.0, 0.0, 10.0));
            if (num < 0.01) return 0.0;
            vec2 div = vec2(num);
            float val = floor(uv.x * num) + floor(uv.y  * num);
            return mod(val, 2.0) == 0.0 ? 1.0 : 0.0;
        }
        
       
        void main() {

        

        vec2 uvo = vUv; // original uv coords
        vec3 outCol = vec3(.0);

        vec3 outColr = vec3(.0);
        vec3 outColg = vec3(.0);
        vec3 outColb = vec3(.0);

        float m = 0.1; // pixelate coef
        float divNum = texDiv;
        float gridDim = 1.0 / divNum;
        uvo.x = float(floor(uvo.x * divNum)) * gridDim;
        uvo.y = float(floor(uvo.y * divNum)) * gridDim;

        // get the pixel from the texture we're working with (called a texel)
        vec4 texel = texture2D( tDiffuse, uvo );
        vec4 texel2 = texture2D( tDiffuse, vec2(uvo.x + 1.0, uvo.y));

        float mGreyVal = (texel.r + texel.g + texel.b) / 3.0;

        float greyVal = texel.r;
        vec2 uvm = (vUv - uvo) * divNum; // modified uv coord.

        vec2 uv2 = vUv;

        float divNum2 = 20.0;
        float gridDim2 = 1.0 / divNum2;
        uv2.x = float(floor(uv2.x * divNum2)) * gridDim2;
        uv2.y = float(floor(uv2.y * divNum2)) * gridDim2;
        vec2 uvm2 = (vUv - uv2) * divNum2;

        if (uv2.y == 0.9 && uv2.x < 0.5 && uv2.x > 0.025) {
                outCol = vec3(.0);
                float testUvx = (1.0 - uv2.x * 2.0);
                float testGap = 0.025;
                if (uvm2.x < testGap || uvm2.x > 1.0 - testGap) outCol += vec3(1.0);
                if (uvm2.y < testGap || uvm2.y > 1.0 - testGap) outCol += vec3(1.0);
                
                if (colorMode == 0.0) outCol += circle(uvm2, testUvx);
                else if (colorMode == 1.0) outCol += lines(uvm2, testUvx, 0.03);
        }
        else if (uv2.y < 0.6 && uv2.y > 0.4) outCol.r += texel.r;
        else {
            if (colorMode == 0.0) outCol += circle(uvm, mGreyVal);
            else if (colorMode == 1.0) outCol += lines(uvm2, mGreyVal, 0.03);
        }
        
        //else outCol += lines(uvm, mGreyVal, 0.01)* texel.rgb;
        // outCol.r += circle(vec2(uvm.x - 0.5, uvm.y), mGreyVal);
        // outCol.bg += circle(vec2(uvm.x + 0.5, uvm.y + 0.5), mGreyVal * 0.5);
        // return this new color


        gl_FragColor = vec4( outCol , 1.0 );

        }
    `
    ].join("\n")

};