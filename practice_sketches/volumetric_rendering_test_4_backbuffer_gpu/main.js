
import * as THREE from "https://cdn.skypack.dev/three@0.128.0/build/three.module.js";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js";
import {ImprovedNoise} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/math/ImprovedNoise.js";
import {WEBGL} from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/WebGL.js"



function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

// basically a copy and paste of https://github.com/mrdoob/three.js/blob/master/examples/webgl2_volume_perlin.html
function main(){




	const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});
    //renderer.antialias = true;
    //renderer.setPixelRatio(window.innerWidth, window.innerHeight);

    let stats;
    initStats();
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
	scene.background = new THREE.Color(0x000000);
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
                dataPrev[i++] = 0; // initialize previous textue
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
					vec3 ref = refract(-vDirection, n, 1.0 / 0.91);
					//color.rgb -= texture(tex, p.xy * 0.1 + ref.xy).rgb;
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

	gui.add(controls, 'threshold', 0, 1).onChange(function (e){
		controls.threshold = e;
		material.uniforms.threshold.value = controls.threshold;
	});
	



	let testFunc1 = (x, y, z) => {
		let dx = 0.5;
    	let dy = 0.5;
    	let dz = 0.5;
    	            
    	let mx = (x - dx);
    	let my = (y - dy);
    	let mz = (z - dz);


    	let d = Math.sqrt(mx * mx + my * my + mz * mz);
    	//d = Math.sin(d * 0.1 + step * 0.001);
    	return d;
	};


	
	
	controls.dataSize = 32;
	gui.add(controls, 'dataSize', 8, 256);

	function getFlatIndex(x, y, z, size){
		return x + size * (y + size * z);
	}
	
	function mod(n, m) {
  		return ((n % m) + m) % m;
	}

	let adjacentIndices = [];
	let aPrevValues = [];
	let bPrevValues = [];
	let aNextValues = [];
	let bNextValues = [];
	for (let i = 0; i < 26; i++) adjacentIndices.push(0);
	for (let i = 0; i < Math.pow(size, 3); i++){
		aPrevValues.push(1);
		bPrevValues.push(0);
		aNextValues.push(1);
		bNextValues.push(0);
	}
	// i: current index

	controls.enableBoundary = false;
	gui.add(controls, 'enableBoundary', false);
	let isBoundary = false;


	function getLeftIndex(i, s){
		return i % s != 0 ? i - 1 : i - 1 + s;
	}

	function getRightIndex(i, s){
		return (i + 1) % s != 0 ? i + 1 : i + 1 - s;
	}

	function getDownIndex(i, ss, tms){
		return i < tms ? i + ss : i - tms;
	}

	function getUpIndex(i, ss, tms){
		return i >= ss ? i - ss : i + tms;
	}

	function getBackIndex(i, s, ss){
		let bf = Math.floor(i / ss) * ss;
		return (i < bf) || (i >= bf + s) ?
				i - s : 
				i - s + ss ;
	}

	function getFrontIndex(i, s, ss){
		let ff = Math.floor((i + s) / ss) * ss;
		return (i < ff - s) || (i >= ff) ? 
				i + s :
				i - ss + s;
	}
	function calcNeighborIndices(i, size){
		let sizeSquared = Math.pow(size, 2);
        let sizeTripled = Math.pow(size, 3);
        let tms = sizeTripled - sizeSquared;
        //let ff = Math.floor((i + size) / sizeSquared) * sizeSquared; // front floored
        //let bf = Math.floor(i / sizeSquared) * sizeSquared; // back floored
		// NEEDS MAJOR FIXING UP
		// face sharing
		adjacentIndices[0] = getLeftIndex(i, size);//i % size != 0 ? i - 1 : i - 1 + size; // l
		adjacentIndices[1] = getRightIndex(i, size);//(i + 1) % size != 0 ? i + 1 : i + 1 - size; // r
		adjacentIndices[2] = getDownIndex(i, sizeSquared, tms);//i < tms ? i + sizeSquared : i - tms; // d
		adjacentIndices[3] = getUpIndex(i, sizeSquared, tms);//i >= sizeSquared ? i - sizeSquared : i + tms; // u
		adjacentIndices[4] = getBackIndex(i, size, sizeSquared);
							//(i < bf) || (i >= bf + size) ?
							//i - size : 
							//i - size + sizeSquared ; // b
		adjacentIndices[5] = getFrontIndex(i, size, sizeSquared);
							//(i < ff - size) || (i >= ff) ? 
							//i + size :
							//i - sizeSquared + size; // f

		// side sharing
		adjacentIndices[6] = getLeftIndex(adjacentIndices[5], size);//mod(adjacentIndices[5] - 1, size); // fl = f - 1 // f's left
		adjacentIndices[7] = getRightIndex(adjacentIndices[5], size);//mod(adjacentIndices[5] + 1, size); // fr = f + 1 // f's right
		adjacentIndices[8] = getDownIndex(adjacentIndices[5], sizeSquared, tms);//mod(adjacentIndices[2] + size, sizeSquared); // fd = d + size // f's down
		adjacentIndices[9] = getUpIndex(adjacentIndices[5], sizeSquared, tms);//mod(adjacentIndices[3] + size, sizeSquared); // fu = u + size // f's up
		
		
		adjacentIndices[10] = getLeftIndex(adjacentIndices[4], size);//mod(adjacentIndices[4] - 1, size); // bl = b - 1 // b's left
		adjacentIndices[11] = getRightIndex(adjacentIndices[4], size);//mod(adjacentIndices[4] + 1, size); // br = b + 1 // b's right
		adjacentIndices[12] = getDownIndex(adjacentIndices[4], sizeSquared, tms);//mod(adjacentIndices[2] - size, sizeSquared); //  bd = d - size // b's down
		adjacentIndices[13] = getUpIndex(adjacentIndices[4], sizeSquared, tms);//mod(adjacentIndices[3] - size, sizeSquared); // bu = u - size // b's up

		
		adjacentIndices[14] = getLeftIndex(adjacentIndices[3], size);//mod(adjacentIndices[3] - 1, size); // ul = u - 1 // u's left
		adjacentIndices[15] = getRightIndex(adjacentIndices[3], size);//mod(adjacentIndices[3] + 1, size); // ur = u + 1 // u's right
		adjacentIndices[16] = getLeftIndex(adjacentIndices[2], size);//mod(adjacentIndices[2] - 1, size); // dl = d - 1 // d's left
		adjacentIndices[17] = getRightIndex(adjacentIndices[2], size);//mod(adjacentIndices[2] + 1, size); // dr = d + 1 // d's right

		// vertex sharing
		adjacentIndices[18] = getLeftIndex(adjacentIndices[9], size);//mod(adjacentIndices[9] - 1, size); // ful = fu - 1 // fu's left
		adjacentIndices[19] = getRightIndex(adjacentIndices[9], size);//mod(adjacentIndices[9] + 1, size); // fur = fu + 1 // fu's right
		adjacentIndices[20] = getLeftIndex(adjacentIndices[8], size);//mod(adjacentIndices[8] - 1, size); // fdl = fd - 1 // fd's left
		adjacentIndices[21] = getRightIndex(adjacentIndices[8], size);//mod(adjacentIndices[8] + 1, size); // fdr = fd + 1`// fd's right

		adjacentIndices[22] = getLeftIndex(adjacentIndices[13], size);//mod(adjacentIndices[17] - 1, size); // bul = bu - 1 // bu's left
		adjacentIndices[23] = getRightIndex(adjacentIndices[13], size);//mod(adjacentIndices[17] + 1, size); // bur = bu + 1 // bu's right
		adjacentIndices[24] = getLeftIndex(adjacentIndices[12], size);//mod(adjacentIndices[16] - 1, size); // bdl = bd - 1 // bd's left
		adjacentIndices[25] = getRightIndex(adjacentIndices[12], size);//mod(adjacentIndices[16] + 1, size); // bdr = bd + 1 // bd's right
		
	}





	let RD_PARAMS = {
		da: 0.6,
		db: 0.2,
		dt: 1.0,
		feed: 0.03,
		kill: 0.06,
		faceNeighborCoef: 1.0 / 26.0,
		sideNeighborCoef: 1.0 / 26.0,
		vertNeighborCoef: 1.0 / 26.0,

	}

	let paramFolder = gui.addFolder('RD_PARAMS');

	paramFolder.add(RD_PARAMS, 'da', 0.0, 1.5);
	paramFolder.add(RD_PARAMS, 'db', 0.0, 1.5);
	paramFolder.add(RD_PARAMS, 'dt', 0.0, 10.0);
	paramFolder.add(RD_PARAMS, 'feed', 0.0, 0.1).step(0.001);
	paramFolder.add(RD_PARAMS, 'kill', 0.0, 0.1).step(0.001);
	paramFolder.add(RD_PARAMS, 'faceNeighborCoef', 0.0, 0.25).step(0.001);
	paramFolder.add(RD_PARAMS, 'sideNeighborCoef', 0.0, 0.25).step(0.001);
	paramFolder.add(RD_PARAMS, 'vertNeighborCoef', 0.0, 0.25).step(0.001);


	

	function distSquared(x0, y0, z0, x1, y1, z1){
		let ds = Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2) + Math.pow(z1 - z0, 2);
		return ds;
	}
	function clamp(x, min, max){
		return Math.min(Math.max(x, min), max);
	}

	// index : current index
 	let ss = 0;
 	let addValue = false;
 	controls.continuousFeed = false;
	gui.add(controls, 'continuousFeed', false);
	function getNewValue(index, x, y, z){
		ss++;
		let asum = 0.0;
		let bsum = 0.0;
		let fc = RD_PARAMS.faceNeighborCoef;
		let sc = RD_PARAMS.sideNeighborCoef;
		let vc = RD_PARAMS.vertNeighborCoef;
		let da = RD_PARAMS.da;
		let db = RD_PARAMS.db;
		let dt = RD_PARAMS.dt;
		let feed = RD_PARAMS.feed;
		let kill = RD_PARAMS.kill;

		adjacentIndices.forEach(function(adjIndex, i){
			if (i < 8){
				asum += aPrevValues[adjIndex] * fc;
				bsum += bPrevValues[adjIndex] * fc;
			}

			else if (i < 12){
				asum += aPrevValues[adjIndex] * sc;
				bsum += bPrevValues[adjIndex] * sc;
			}

			else if (i < 26){
				asum += aPrevValues[adjIndex] * vc;
				bsum += bPrevValues[adjIndex] * vc;
			}
		})

		asum -= aPrevValues[index];
		bsum -= bPrevValues[index];

		let a = aPrevValues[index];
		let b = bPrevValues[index];

		let abb = a * b * b;

		if (addValue || controls.continuousFeed){
			// return sphere
			let dist = Math.sqrt(distSquared(x, y, z, 0, 0, 0));
			let r = 0.1;
			dist = dist > r ? 0.0 : 1.0;
			b += dist;

		}

		a += (da * asum - abb + feed * (1.0 - a)) * dt;
		b += (db * bsum + abb - (feed + kill) * b) * dt;
		a = clamp(a, 0.0, 1.0);
		b = clamp(b, 0.0, 1.0);

		aNextValues[index] = a;
		bNextValues[index] = b;

		return 1.0 - Math.abs(a - b) ;
	}

	controls.addValue = function(){
		addValue = true;
	}
	gui.add(controls, 'addValue');



	function swapValues(){

		aNextValues.forEach(function(v, i){
			aPrevValues[i] = v;
		})
		bNextValues.forEach(function(v, i){
			bPrevValues[i] = v;
		})
	}

	controls.debug = function(){
		console.log(currentIndex);
		console.log(adjacentIndices);
	}
	gui.add(controls, 'debug');

	controls.reset = function(){
		aPrevValues = [];
		aNextValues = [];
		bNextValues = [];
		bPrevValues = [];

		for (let i = 0; i < Math.pow(size, 3); i++){
			aPrevValues.push(1);
			bPrevValues.push(0);
			aNextValues.push(1);
			bNextValues.push(0);
		}
	}
	gui.add(controls, 'reset');
	controls.scaleCoef = 1.0;
	gui.add(controls, 'scaleCoef', 0.0, 2.0);
	let currentIndex;
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

    	            data[i++] = mapLinear(d, 0, 1, 0, 256); // map to a value between 0 and 256
    	        }
    	    }
    	}
    	if (addValue) addValue = false;

    	swapValues();

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
    	        steps: {value: 300},
    	        //tex: {value: textureImage}
    	    },
    	    vertexShader,
    	    fragmentShader,
    	    side: THREE.BackSide,
    	    
    	});

    

    	let geometry = new THREE.BoxGeometry(1, 1, 1);
    

    	let testMat = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});
    	let mesh = new THREE.Mesh(geometry,material);
    	
    	mesh.position.set(0, 0, 0);
    	mesh.name = 'volumeMesh';
    	scene.add(mesh);


	}

	let step = 0;

	function render(time){
		

		stats.update();
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
		renderer.render(scene, camera);
		

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
        
    }

    window.addEventListener('resize', onResize, false);
	requestAnimationFrame(render);
}

window.onload = main;
