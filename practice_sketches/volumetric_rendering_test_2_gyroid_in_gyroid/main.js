
import * as THREE from "https://cdn.skypack.dev/three@0.128.0/build/three.module.js";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js";
import {ImprovedNoise} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/math/ImprovedNoise.js";
import {WEBGL} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/WebGL.js"
import {EffectComposer} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import {BokehPass} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/BokehPass.js';
import {SMAAPass} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/SMAAPass.js';


function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

// basically a copy and paste of https://github.com/mrdoob/three.js/blob/master/examples/webgl2_volume_perlin.html
function main(){

// P5 SKETCH
	let p5texture;
	let p5Font;
	let p5Canvas;
	const p5Sketch = (sketch) => {

		let textSize = 130;
		let mainFont;
		let stringNum = 8;
		let p5Shader;
		let texImage;

        sketch.setup = () => {
        	
			sketch.createCanvas(window.innerWidth, window.innerHeight, sketch.WEBGL);
			sketch.textSize(textSize);

			p5Shader = sketch.loadShader('p5VertShader.vert', 'p5FragShader.frag', sketch.getShader);

		
			sketch.textureWrap(sketch.REPEAT);
			
		}
		sketch.draw = () => {
			try{
				p5Shader.setUniform('resolution', [sketch.width, sketch.height]);
                p5Shader.setUniform('time', sketch.frameCount * 0.03);

				p5Shader.setUniform('mouse', [sketch.mouseX/sketch.width, sketch.mouseY/sketch.height]);
                sketch.shader(p5Shader);
				sketch.quad(-1, -1, 1, -1, 1, 1, -1, 1);

				
           	} catch{}
			if (p5texture) p5texture.needsUpdate = true;
		}

		sketch.windowResized = () => {
			sketch.resizeCanvas(window.width, window.height);
			sketch.createCanvas(window.innerWidth, window.innerHeight);
			 p5texture.needsUpdate = true;
		}

		// use callbacks instead of async functions to load assets.

		sketch.drawText = (f) => {
			sketch.textFont(f, textSize);
		}

		sketch.getShader = (s) => {
			sketch.shader(s);
		}

		sketch.getImage = (i) =>{
			sketch.image(i, 0, 0);
		}
    };

    p5Canvas = new p5(p5Sketch);
    p5texture = new THREE.CanvasTexture(p5Canvas.canvas);
    p5texture.needsUpdate = true;
	p5texture.wrapS = THREE.RepeatWrapping;
	p5texture.wrapT = THREE.RepeatWrapping;
	// this hides the p5 canvas
	try{
		p5Canvas.canvas.style.display = "none";
	} catch{}


	const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});
    //renderer.antialias = true;
    //renderer.setPixelRatio(window.innerWidth, window.innerHeight);

    let stats;
    //initStats();
//CAMERA
	const fov = 60;
	const aspect = window.innerWidth / window.innerHeight; // display aspect of the canvas
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	camera.position.set(0, 0, 2);
	camera.lookAt(0, 0, 0);

	new OrbitControls(camera, renderer.domElement);

	const scene = new THREE.Scene();
	scene.background = p5texture;
    renderer.render(scene, camera);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
// TEXTURE

    let size = 32;
    let data = new Uint8Array(size * size * size); // 3 dimensional array flattened
    let dataPrev = new Uint8Array(size * size * size);
    let i = 0;
    let perlin = new ImprovedNoise();
    let vector = new THREE.Vector3();

    // filling the data array with values
    for (let z = 0; z < size; z++){
        for (let y = 0; y < size; y++){
            for (let x = 0; x < size; x++){
                vector.set(x, y, z).divideScalar(size);
                let d = perlin.noise(vector.x * 6.5, vector.y * 6.5, vector.z * 6.5);
                data[i++] = d * 128 + 128;
                dataPrev[i++] = 0;
            }
        }
    }

    let texture = new THREE.DataTexture3D(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1; // 4 b y default.

    let texturePrev = new THREE.DataTexture3D(data, size, size, size);
    texturePrev.format = THREE.RedFormat;
    texturePrev.minFilter = THREE.LinearFilter;
	texturePrev.magFilter = THREE.LinearFilter;
    texturePrev.unpackAlignment = 1; // 4 b y default.

    
// MATERIAL

    // your run of the mill vert shader. 
    const vertexShader = `
        in vec3 position;
        uniform mat4 modelMatrix;
		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;
        uniform vec3 cameraPos;
        
        // view origin (camera position) and view direction must be sent to the fragment shader.
		out vec3 vOrigin;
		out vec3 vDirection;
		void main() {
			vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
			vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
			vDirection = position - vOrigin;
			gl_Position = projectionMatrix * mvPosition;
		}


    `;

    const fragmentShader = `
        precision highp float;
		precision highp sampler3D;
		uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        
        // sent from the vert shader with appropriate matrix multiplications
		in vec3 vOrigin;
        in vec3 vDirection;
        
        out vec4 color;
        
        // 3d texture sent from 'const texture = new THREE.DataTexture3D(data, size, size, size);''
        uniform sampler3D map;
		uniform sampler3D mapPrev;
		uniform sampler2D tex;
		uniform vec3 lightDir;
        
       
		uniform float threshold;
        uniform float steps;
        
        vec2 hitBox( vec3 orig, vec3 dir ) {
        	const float range = 0.5;
			const vec3 box_min = vec3( -range ); // lower bound
			const vec3 box_max = vec3(range); // upper bound


			vec3 inv_dir = 1.0 / dir; // inverse of ray direction
			
			vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
			vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
			
			vec3 tmin = min( tmin_tmp, tmax_tmp );
			vec3 tmax = max( tmin_tmp, tmax_tmp );


			float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
			float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
			
			return vec2( t0, t1 );
		}

		// return the r value of the texture at position p
		float sample1( vec3 p ) {
			return texture( map, p ).r;
		}

		#define epsilon .00001
		
		vec3 normal( vec3 coord ) {
			if ( coord.x < epsilon ) return vec3( 1.0, 0.0, 0.0 );
			if ( coord.y < epsilon ) return vec3( 0.0, 1.0, 0.0 );
			if ( coord.z < epsilon ) return vec3( 0.0, 0.0, 1.0 );
			
			if ( coord.x > 1.0 - epsilon ) return vec3( - 1.0, 0.0, 0.0 );
			if ( coord.y > 1.0 - epsilon ) return vec3( 0.0, - 1.0, 0.0 );
			if ( coord.z > 1.0 - epsilon ) return vec3( 0.0, 0.0, - 1.0 );
			
			float step = 0.01;
			
			float x = sample1( coord + vec3( - step, 0.0, 0.0 ) ) - sample1( coord + vec3( step, 0.0, 0.0 ) );
			float y = sample1( coord + vec3( 0.0, - step, 0.0 ) ) - sample1( coord + vec3( 0.0, step, 0.0 ) );
			float z = sample1( coord + vec3( 0.0, 0.0, - step ) ) - sample1( coord + vec3( 0.0, 0.0, step ) );

			return normalize( vec3( x, y, z ) );
		}
		void main(){

			vec3 lightDir = vec3(.0, .0, -1.0);
			lightDir = vec3( inverse( viewMatrix ) * vec4( lightDir, 1.0 ) ).xyz; // undo the viewMatrix
			lightDir += 0.5; // translate to match p
			vec3 vDirectionMod = vec3(vDirection.x, vDirection.y , vDirection.z);
			vec3 vOriginMod = vec3(vOrigin.x, vOrigin.y, vOrigin.z);

			vec3 rayDir = normalize( vDirection );
			vec3 rayDirOrig = rayDir;
			//rayDir.y /= 5.0; // stretch 5x along the y axis. correct.
			vec2 bounds = hitBox( vOrigin, rayDirOrig ); // use the original ray direction for hit detection. correct.
			
			if ( bounds.x > bounds.y ) discard;
			
			bounds.x = max( bounds.x, 0.0 );
			
			vec3 p = vOriginMod + bounds.x * rayDir; // vOrigin -> vOriginMod

			vec3 pcopy = p;
			
			vec3 inc = 1.0 / abs( rayDir );
			
			float delta = min( inc.x, min( inc.y, inc.z ) );
			
			
			delta /= steps;
			
			for ( float t = bounds.x; t < bounds.y; t += delta ) {
				
				float d = sample1( p + 0.5 );
				if ( d > threshold ) {
					//color.rgb = normal( p + 0.5 ) * 0.5 + ( p * 1.5 + 0.25 );
					//color.rgb = normal(p + 0.5);
					vec3 n = normal(p + 0.5);
					float fs = acos(dot(n, vDirection));
					float fs2 = dot(n, 1.0 - normalize(vDirection));
					

					vec3 lm = lightDir - (p + 0.5);
					vec3 rm = 2.0 * (dot(lm, n)) * n - lm;
					//color.rgb = vec3(normal(p + 0.5));
					
					//color.rgb = vec3(1.0 - fs2); 
					//color.rgb = rm;
					color.rgb = vec3(dot(lm, n) + pow(dot(-rm , normalize(vDirection)), 1.0));

					/*
					vec3 light = vec3(dot(lm, n) + pow(dot(rm , normalize(vDirection)), 1.0)) + vec3(1.0);
					color.rgb = light * 0.5;

					*/
					
					//color.rgb += vec3(0.5);
					//color.rgb *= texture(tex, abs(p.xy )).rgb;
					color.rgb = 1.0 - color.rgb;
					vec3 ref = refract(-vDirection, n, 1.0 / 0.91);
					color.rgb -= texture(tex, p.xy * 0.1 + ref.xy).rgb;
   					//color.rgb -= p * 0.25;
					color.a = 1.;
					break;
				}
				p += rayDir * delta;

			}
			
			color.rgb = 1.0 - color.rgb;

			/*

			//color.rgb = 1.0 - normal(p + 0.5);
			float gs = color.r + color.g + color.b;
			float gc = 10.0;
			float gyroid = sin(color.r * gc) * cos(color.g * gc) + sin(color.g * gc) * cos(color.b * gc) + sin(color.b * gc) * cos(color.r * gc);
			color.rgb = vec3(gyroid);
			color.rgb = vec3(gs);

			float v = texture(map, pcopy + 0.5).r;
			v = pow(2.0 * v, 2.0);
			//v = step (0.9, v);
			//color.rgb = vec3(v);
			//color.a = 0.1;
			*/
			if ( color.a == .0 ) discard;
		}
    `;

    let material = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms:{
            map: {value: texture},
            mapPrev: {value: texturePrev},
            cameraPos: {value: new THREE.Vector3()},
            threshold: {value: 0.6},
            steps: {value: 200}
        },
        vertexShader,
        fragmentShader,
        //side: THREE.BackSide,
        
    });
    

    let geometry = new THREE.BoxGeometry(1, 5, 1);
    

    let testMat = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});
    let mesh = new THREE.Mesh(geometry,material);
    let helperMesh = new THREE.Mesh(geometry, testMat);
    helperMesh.position.set(0, 0, 0);
    mesh.position.set(0, 0, 0);
    mesh.name = 'volumeMesh';
    scene.add(mesh);
    //scene.add(helperMesh);


//GUI
	let testParams = {
		sliceRadius: 0.2,
		zFreq: 0.01,
		sliceSpeedCoef: 0.0,
	}
	const gui = new dat.GUI();
	const controls = new function(){
		
		this.threshold = 0.6;
		
	}

	gui.add(controls, 'threshold', 0, 1).onChange(function (e){
		controls.threshold = e;
		material.uniforms.threshold.value = controls.threshold;
	});
	

// POST PROCESSING
	let textureImage = new THREE.TextureLoader().load("test.png");
	let renderPass = new RenderPass(scene, camera);
	let bokehPass = new BokehPass(scene, camera, {
		focus: 1.0,
		aperture: 0.025,
		maxblur: 0.005,

		width: window.innerWidth,
		height: window.innerHeight
	});

	controls.focus = bokehPass.uniforms.focus.value;
	controls.aperture = bokehPass.uniforms.aperture.value;
	controls.maxblur = bokehPass.uniforms.maxblur.value;
	console.log(controls);
	gui.add(controls, 'focus', 0.0, 2.0).step(0.01).onChange(function(e){
		bokehPass.uniforms.focus.value = e;
	})
	gui.add(controls, 'aperture', 0.0, 1.0).step(0.001).onChange(function(e){
		bokehPass.uniforms.aperture.value = e;
	})
	gui.add(controls, 'maxblur', 0.0, 0.01).step(0.001).onChange(function(e){
		bokehPass.uniforms.maxblur.value = e;
	})
	let smaaPass = new SMAAPass(window.innderWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());

	smaaPass.renderToScreen = true;
	smaaPass.unbiased = true;
	let composer = new EffectComposer(renderer);
	composer.setSize(window.innerWidth, window.innerHeight);
	composer.addPass(renderPass);
	
	composer.addPass(bokehPass);
	composer.addPass(smaaPass);
	console.log(smaaPass);
	
	
	controls.toggleBokeh = false;
	controls.toggleAntiAlias = true;

	gui.add(controls, 'toggleBokeh', false).listen().onChange(function(e){
		if (e){
			smaaPass.enabled = false;
			bokehPass.enabled = true;
			controls.toggleAntiAlias = false;
		}
	});
	gui.add(controls, 'toggleAntiAlias', true).listen().onChange(function(e){
		if (e){
			smaaPass.enabled = true;
			bokehPass.enabled = false;
			controls.toggleBokeh = false;
		}
	});;

	let testFunc1 = (x, y, z) => {
		let dx = 0.5 + testParams.sliceRadius * Math.sin(z * testParams.zFreq + step * testParams.sliceSpeedCoef);
    	let dy = 0.5 + testParams.sliceRadius * Math.cos(z * testParams.zFreq + step * testParams.sliceSpeedCoef);
    	let dz = 0.5;
    	            
    	let mx = (x - dx);
    	let my = (y - dy);
    	let mz = (z - dz);


    	let d = Math.sqrt(mx * mx + my * my + mz * mz);
    	//d = Math.sin(d * 0.1 + step * 0.001);
    	return d;
	};


	let gDensity = 10;
	let gInnerDensity = 1;

	const testFunc4 = (x, y, z) => {

		let c = gDensity;
		let ms = step * 0.02; // morph speed
    	let g =  Math.sin(x * c + ms) * Math.cos(y * c + ms) + 
    	Math.sin(y * c + ms) * Math.cos(z * c + ms) + 
    	Math.sin(z * c + ms) * Math.cos(x * c + ms);
		

		let dist = Math.sqrt(x*x + y*y + z*z);
		let r = 0.5;
		//if (dist > r) g = 999;

/*
		if (x < 0.25 && x > -0.25 &&
		 y < 0.25 && y > -0.25 &&
		 z < 0.25 && z > -0.25) g = 999;
		 */

		if (mapLinear(g, -3, 3, 0, 1) > material.uniforms.threshold.value){
			g =  Math.sin(x * gInnerDensity + ms) * Math.cos(y * gInnerDensity + ms) + 
    			Math.sin(y * gInnerDensity + ms) * Math.cos(z * gInnerDensity + ms) + 
    			Math.sin(z * gInnerDensity + ms) * Math.cos(x * gInnerDensity + ms);
		}
		return g;
	}

	
	controls.gDensity = gDensity;
	controls.gInnerDensity = gDensity;
	controls.gEqualize = function(){
		controls.gInnerDensity = controls.gDensity;
		gInnerDensity = gDensity;
	}
	gui.add(controls,'gDensity', 1, 20).listen().onChange(e => {
		gDensity = controls.gDensity;
	});
	gui.add(controls,'gInnerDensity', 1, 100).listen().onChange(e => {
		gInnerDensity = controls.gInnerDensity;
	});
	gui.add(controls, 'gEqualize');
	
	let octaves = 10;
	let noiseHeight = 100;
	const terrainTest = (x, y, z) => {

		let c1 = 20.0;
		let nc = 0.0035;
		let nc2 = 0.006;
		let v = 0.01;

		
		let noiseSum = 0;
		for (let i = 0; i < octaves; i++){
			noiseSum += noise.simplex2(x * i * 0.01 + step * v , z * i * 0.01 + step * v );
		}
		noiseSum /= octaves;


		
		let val = y - c1 * noiseSum;

		val += noiseHeight * noise.simplex3(x * nc2 + step * v , y * nc2 + step * v , z * nc2 + step * v );
		//val += 10 * noise.simplex3(val * nc2 * x, val * nc2 * y, val * nc2 * z);
		//val = Math.floor(2.0 * val);
		let m = mapLinear(val, -240 - c1, 240 + c1, -1, 1);
		return m;
	}
	
	controls.dataSize = 48;
	gui.add(controls, 'dataSize', 8, 256);
	function updateTexture(){

		/*
		// filling previous values
		dataPrev = new Uint8Array(size * size * size);
		let i = 0;
    	for (let z = 0; z < size; z++){
    	    for (let y = 0; y < size; y++){
    	        for (let x = 0; x < size; x++){
    	        	dataPrev[i] = data[i];
    	        	i++;    
    	        }
    	    }
    	}
    	*/

		scene.remove(scene.getObjectByName("volumeMesh"));
    	size = controls.dataSize;
    	data = new Uint8Array(size * size * size); // 3 dimensional array flattened
    	
    	i = 0;
    	
    	//console.log(dataPrev[63543]);
    	i = 0;
    	// filling the data array with values
    	for (let z = 0; z < size; z++){
    	    for (let y = 0; y < size; y++){
    	        for (let x = 0; x < size; x++){
    	            vector.set(x, y, z).divideScalar(size);
    	            // set 0, 0, 0 to center
    	            vector.x -= 0.5;
    	            vector.y -= 0.5;
    	            vector.z -= 0.5;
    	            let d = testFunc4(vector.x, vector.y, vector.z);
    	            

    	            data[i++] = mapLinear(d, -3, 3, 0, 256); // map to a value between 0 and 256
    	        }
    	    }
    	}

    	//console.log(dataPrev[63543] + " " + data[63543]);

    	texture = new THREE.DataTexture3D(data, size, size, size);
    	texture.format = THREE.RedFormat;
    	texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
    	texture.unpackAlignment = 1; // 4 b y default. 

    	texturePrev = new THREE.DataTexture3D(data, size, size, size);
    	texturePrev.format = THREE.RedFormat;
    	texturePrev.minFilter = THREE.LinearFilter;
		texturePrev.magFilter = THREE.LinearFilter;
    	texturePrev.unpackAlignment = 1; // 4 b y default. 

    	let material = new THREE.RawShaderMaterial({
    	    glslVersion: THREE.GLSL3,
    	    uniforms:{
    	        map: {value: texture},
    	        mapPrev: {value: texturePrev},
    	        cameraPos: {value: new THREE.Vector3()},
    	        threshold: {value: controls.threshold},
    	        steps: {value: 300},
    	        tex: {value: textureImage}
    	    },
    	    vertexShader,
    	    fragmentShader,
    	    side: THREE.BackSide,
    	    
    	});

    

    	let geometry = new THREE.BoxGeometry(1, 5, 1);
    

    	let testMat = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});
    	let mesh = new THREE.Mesh(geometry,material);
    	
    	mesh.position.set(0, 0, 0);
    	mesh.name = 'volumeMesh';
    	scene.add(mesh);


	}

	let step = 0;

	function render(time){
		bokehPass.renderToScreen = true;
		//console.log(composer);
		//stats.update();
		step++;
		//bokehPass.focus = camera.position.x - near;
		scene.rotation.set(0, step * 0.005, 0);
		time *= 0.001;
		updateTexture();
		scene.getObjectByName("volumeMesh").material.uniforms.cameraPos.value.copy( camera.position );
		
		if (resizeRenderToDisplaySize(renderer)){
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();

		}
		//renderer.render(scene, camera);
		composer.render();

		requestAnimationFrame(render);
	}

	function initStats(){
		stats = new Stats();
	  	stats.setMode(0);
	  	stats.domElement.style.position = 'absolute';
	  	stats.domElement.style.left = '0px';
	  	stats.domElement.style.top = '0px';
	  	document.body.appendChild(stats.domElement);
	  	return stats;
	}

	function resizeRenderToDisplaySize(renderer){
		composer.setSize(window.innerWidth, window.innerHeight);
		const canvas = renderer.domElement;
		const pixelRatio = window.devicePixelRatio;
		const width = canvas.clientWidth * pixelRatio | 0; // or 0
		const height = canvas.clientHeight * pixelRatio | 0; // 0
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize){
			console.log("RESIZE");
			renderer.setSize(width, height, false);
			
		}
		return needResize;
	}

	function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize, false);
	requestAnimationFrame(render);
}

window.onload = main;
