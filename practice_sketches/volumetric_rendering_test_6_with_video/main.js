
import * as THREE from "https://cdn.skypack.dev/three@0.128.0/build/three.module.js";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js";
import {ImprovedNoise} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/math/ImprovedNoise.js";
import {WEBGL} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/WebGL.js"
import {EffectComposer} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import {SMAAPass} from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/SMAAPass.js';


function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}


let p5Texture;
let p5Canvas;
let videoWidth;
let videoHeight;
let videoPixelArr;
// basically a copy and paste of https://github.com/mrdoob/three.js/blob/master/examples/webgl2_volume_perlin.html
function main(){
// P5 SKETCH
	const p5Sketch = (sketch) => {

		
		let video;

        sketch.setup = () => {

        	
        	
        	video = sketch.createVideo('video1.mp4');
			video.play();
			video.loop();


			
			videoWidth = video.width;
			videoHeight = video.height;
			
			sketch.createCanvas(648, 450);
		}
		sketch.draw = () => {
			//console.log(videoWidth, videoHeight);
			video.loadPixels();
           	videoPixelArr = video.pixels;

           	//sketch.background(150 + 100 * Math.sin(step), 0, 0);
           	sketch.image(video, 0, 0);
			if (p5Texture) p5Texture.needsUpdate = true;
		}

		
    };

    p5Canvas = new p5(p5Sketch);
	p5Texture = new THREE.CanvasTexture(p5Canvas.canvas);
	p5Texture.wrapS = THREE.RepeatWrapping;
	p5Texture.wrapT = THREE.RepeatWrapping;
	p5Texture.needsUpdate = true;
	p5Canvas.canvas.style.display = "none";



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
	//const camera = new THREE.OrthographicCamera();

	camera.position.set(0, 0, 2);
	camera.lookAt(0, 0, 0);

	new OrbitControls(camera, renderer.domElement);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
    renderer.render(scene, camera);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
// TEXTURE

    let size = 32;
    let data = new Uint8Array(size * size * size); // 3 dimensional array flattened
   
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
               
            }
        }
    }

    let texture = new THREE.DataTexture3D(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1; // 4 b y default.

    let videoData = [];

    

    let videoDataTexture = new THREE.DataTexture(
    	Uint8Array.from(videoData),
    	size,
    	size,
    	THREE.RGBAFormat,
    	THREE.UnsignedByteType,
    	THREE.UVMapping
    );

    videoDataTexture.needsUpdate = true;

	
    
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

		uniform sampler2D videoTex;
		uniform sampler2D videoDataTex;
		
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

		vec3 get(float x, float y, float z, vec3 p){
			return texture(mapPrev, vec3(p.x + x, p.y + y, p.z + z)).rgb;
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

			vec3 texCol = vec3(texture(videoTex, p.xy + 0.5).rgb);

			vec3 vdCol = vec3(texture(videoDataTex, p.xy  + 0.5).rgb);
			
			for ( float t = bounds.x; t < bounds.y; t += delta ) {
				
				float d = sample1( p + 0.5 );
				if ( d > threshold ) {
					color.rgb = normal( p + 0.5 ) * 0.5 + ( p * 1.5 + 0.25 );
					//color.rgb = normal(p + 0.5);
					vec3 n = normal(p + 0.5);
					float fs = acos(dot(n, vDirection));
					float fs2 = dot(n, 1.0 - normalize(vDirection));
					
					vec3 lm = lightDir - (p + 0.5);
					vec3 rm = 2.0 * (dot(lm, n)) * n - lm;
					//color.rgb = vec3(normal(p + 0.5));
					
					//color.rgb = vec3(1.0 - fs2); 
					//color.rgb = rm;
					
					/*
					vec3 light = vec3(dot(lm, n) + pow(dot(rm , normalize(vDirection)), 1.0)) + vec3(1.0);
					color.rgb = light * 0.5;
					*/
					
					//color.rgb += vec3(0.5);
					//color.rgb *= texture(tex, abs(p.xy )).rgb;

					/*
					// ORIGINAL COLOR
					color.rgb = vec3(dot(lm, n) + pow(dot(-rm , normalize(vDirection)), 1.0));
					color.rgb = 1.0 - color.rgb;
					*/
					//vec3 ref = refract(-vDirection, n, 1.0 / 0.91);
					//color.rgb += texture(videoTex, p.xy * 0.1 + ref.xy).rgb;
   					//color.rgb -= p * 0.25;
					color.a = 1.;
					color.rgb = vdCol;
					break;
				}
				p += rayDir * delta;

			}
			
			//color.rgb = 1.0 - color.rgb;

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
            //mapPrev: {value: texturePrev},
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
	
	const gui = new dat.GUI();
	const controls = new function(){
		
		this.threshold = 0.16;
		
	}

	gui.add(controls, 'threshold', 0, 1).listen().onChange(function (e){
		controls.threshold = e;
		material.uniforms.threshold.value = controls.threshold;
	});
	
	
	controls.dataSize = 150;
	gui.add(controls, 'dataSize', 8, 256);

	controls.shift = 0;
	gui.add(controls, 'shift', 0, 1000);

	function getFlatIndex(x, y, z, size){
		return x + size * (y + size * z);
	}
	
	function mod(n, m) {
  		return ((n % m) + m) % m;
	}

	

	
	

	function distSquared(x0, y0, z0, x1, y1, z1){
		let ds = Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2) + Math.pow(z1 - z0, 2);
		return ds;
	}
	function clamp(x, min, max){
		return Math.min(Math.max(x, min), max);
	}

	

	controls.debug = function(){
		console.log(videoPixelArr);

	}
	gui.add(controls, 'debug');

	let currentIndex;



	let debugMat = new THREE.MeshBasicMaterial({map: p5Texture, opacity: 0.7});
	let debugGeom = new THREE.BoxGeometry(2, 2, 2);
	let debugCube = new THREE.Mesh(debugGeom, debugMat);
	//scene.add(debugCube);
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
		//scene.remove(scene.getObjectByName("volumeMesh2"));
    	size = controls.dataSize;
    	data = new Uint8Array(size * size * size); // 3 dimensional array flattened
    	
    	i = 0;
    	
    	//console.log(dataPrev[63543]);
    	i = 0;
    	// filling the data array with values
    	for (let z = 0; z < size; z++){
    	    for (let y = 0; y < size; y++){

    	    	// width: 648
    	    	// height: 450
    	    	// map row of slice to the video's height
    	    	// map col of slice to the video's width
    	    	// get flat index in videoPixelArr using the mapped coordinates
    	    	// get the color values in vidoePixelArr at the index above

    	    	let rs = Math.floor(mapLinear(y, 0, size, 0, 450));
    	        for (let x = 0; x < size; x++){
    	        	
    	        	/*
    	            vector.set(x, y, z).divideScalar(size * controls.scaleCoef);
    	            // set 0, 0, 0 to center
    	            vector.x -= 0.5	/ controls.scaleCoef;
    	            vector.y -= 0.5	/ controls.scaleCoef;
    	            vector.z -= 0.5	/ controls.scaleCoef;
    	            //let d = testFunc1(vector.x, vector.y, vector.z);
    	            let idx = getFlatIndex(x, y, z, size);
    	            currentIndex = idx;
    	            
    	            calcNeighborIndices(idx, size);
    	            //console.log(idx + " " + adjacentIndices);
    	            let d = getNewValue(idx, vector.x, vector.y, vector.z);
					*/

					let cs = Math.floor(mapLinear(x, 0, size, 0, 648));

					let fi = rs * 648 + cs; // flat index

					let offset = 4 * (fi + controls.shift);
					offset %= videoPixelArr.length;
					let d = videoPixelArr[offset];
					//d /= 3;
					d = 256 - d;
    	            data[i++] = mapLinear(d, 0, 256, 0, 256); // map to a value between 0 and 256
    	        }
    	    }
    	}

    	videoData = [];

    	for (let y = 0; y < size; y++){
    		let rs = Math.floor(mapLinear(y, 0, size, 0, 450));
    		for (let x = 0; x < size; x++){
    			let cs = Math.floor(mapLinear(x, 0, size, 0, 648));

				let fi = rs * 648 + cs; // flat index

				let offset = 4 * (fi + controls.shift);
				offset %= videoPixelArr.length;
				

    			videoData.push(videoPixelArr[offset], videoPixelArr[offset + 1], 
    						videoPixelArr[offset + 2], videoPixelArr[offset + 3]);
    		}
    	}

    	videoDataTexture = new THREE.DataTexture(
    		Uint8Array.from(videoData),
    		size,
    		size
    		//THREE.RGBAFormat,
    		//THREE.UnsignedByteType,
    		//THREE.UVMapping
    	);

    	videoDataTexture.needsUpdate = true;
    	

    	

    	//console.log(dataPrev[63543] + " " + data[63543]);

    	texture = new THREE.DataTexture3D(data, size, size, size);
    	texture.format = THREE.RedFormat;
    	texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
    	texture.unpackAlignment = 1; // 4 b y default. 

    	/*
    	texturePrev = new THREE.DataTexture3D(data, size, size, size);
    	texturePrev.format = THREE.RedFormat;
    	texturePrev.minFilter = THREE.LinearFilter;
		texturePrev.magFilter = THREE.LinearFilter;
    	texturePrev.unpackAlignment = 1; // 4 b y default. 
		*/
    	let material = new THREE.RawShaderMaterial({
    	    glslVersion: THREE.GLSL3,
    	    uniforms:{
    	        map: {value: texture},
    	        //mapPrev: {value: texturePrev},
    	        cameraPos: {value: new THREE.Vector3()},
    	        threshold: {value: controls.threshold},
    	        steps: {value: 500},
    	       	videoTex: {value: p5Texture},
    	       	videoDataTex: {value: videoDataTexture}
    	    },
    	    vertexShader,
    	    fragmentShader,
    	    side: THREE.BackSide,
    	    
    	});

    

    	let geometry = new THREE.BoxGeometry(1, 1, 1);
    

    	//let testMat = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});
    	let mesh = new THREE.Mesh(geometry,material);
    	
    	//let mesh2 = new THREE.Mesh(geometry, material);
    	//mesh2.position.set(0, 10, -1);
    	mesh.position.set(0, 0, 0);
    	mesh.name = 'volumeMesh';
    	//mesh2.name = 'volumeMesh2';
    	scene.add(mesh);
    	//scene.add(mesh2);

    	material.dispose();
	}

// POST PROCESSING
	let renderPass = new RenderPass(scene, camera);
	let smaaPass = new SMAAPass(window.innderWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
	let composer = new EffectComposer(renderer);

	composer.setSize(window.innerWidth, window.innerHeight);
	composer.addPass(renderPass);
	composer.addPass(smaaPass);

// PRESETS
	

	let step = 0;

	function render(time){
		

		//stats.update();
		step++;
		
		//scene.rotation.set(0, step * 0.005, 0);
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

		const canvas = renderer.domElement;
		const pixelRatio = window.devicePixelRatio;
		const width = canvas.clientWidth * pixelRatio | 0; // or 0
		const height = canvas.clientHeight * pixelRatio | 0; // 0
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize){

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
