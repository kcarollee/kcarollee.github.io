
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
	scene.background = new THREE.Color(0xCCCCCC);
    renderer.render(scene, camera);
    
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
        
        // sent from the vert shader with appropriate matrix multiplications
		in vec3 vOrigin;
        in vec3 vDirection;
        
        out vec4 color;
        
        // 3d texture sent from 'const texture = new THREE.DataTexture3D(data, size, size, size);''
        uniform sampler3D map;
        
       
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
			vec3 rayDir = normalize( vDirection );
			
			vec2 bounds = hitBox( vOrigin, rayDir );
			
			if ( bounds.x > bounds.y ) discard;
			
			bounds.x = max( bounds.x, 0.0 );
			
			vec3 p = vOrigin + bounds.x * rayDir;
			
			vec3 inc = 1.0 / abs( rayDir );
			
			float delta = min( inc.x, min( inc.y, inc.z ) );
			
			delta /= steps;
			
			for ( float t = bounds.x; t < bounds.y; t += delta ) {
				
				float d = sample1( p + 0.5 );
				if ( d > threshold ) {
					//color.rgb = normal( p + 0.5 ) * 0.5 + ( p * 1.5 + 0.25 );
					color.rgb = normal(p + 0.5) + p;

					color.a = 1.;
					break;
				}
				p += rayDir * delta;

			}

			float gs = (color.r + color.g + color.b) / 2.0;

			color.rgb = 1.0 - normal(p + 0.5);
			color.rgb *= 0.75;
			if ( color.a == 0.0 ) discard;
		}
    `;

    let material = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms:{
            map: {value: texture},
            cameraPos: {value: new THREE.Vector3()},
            threshold: {value: 0.6},
            steps: {value: 200}
        },
        vertexShader,
        fragmentShader,
        //side: THREE.BackSide,
        
    });
    

    let geometry = new THREE.BoxGeometry(1, 1, 1);
    

    let testMat = new THREE.MeshBasicMaterial({color: 0xFF0000});
    let mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);

	
//GUI
	let testParams = {
		sliceRadius: 5,
		zFreq: 0.01,
		sliceSpeedCoef: 0.01,
	}
	const gui = new dat.GUI();
	const controls = new function(){
		this.update = function(){
			updateTexture();
		};

		this.threshold = 0.6;
		this.sliceRadius = testParams.sliceRadius;
		this.zFreq = testParams.zFreq;
		this.sliceSpeedCoef = testParams.sliceSpeedCoef;
		
	}
	gui.add(controls, 'update');
	gui.add(controls, 'threshold', 0, 1).onChange(function (e){
		controls.threshold = e;
		material.uniforms.threshold.value = controls.threshold;
		console.log(material.uniforms.threshold.value);
	});
	gui.add(controls, 'sliceRadius', 0, 16).onChange(function(e){
		testParams.sliceRadius = controls.sliceRadius;
	})
	gui.add(controls, 'zFreq', 0, 100).onChange(function(e){
		testParams.zFreq = controls.zFreq;
	})
	gui.add(controls, 'sliceSpeedCoef', 0, 1.0).onChange(function(e){
		testParams.sliceSpeedCoef = controls.sliceSpeedCoef;
	})
	
	
	
	function updateTexture(){

		scene.clear();
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
    	            let d = perlin.noise(vector.x *  6.5 + step * 0.01, vector.y *  6.5 + step * 0.01, vector.z *  6.5 + step * 0.01);
    	            
    	            let dx = 16 + testParams.sliceRadius * Math.sin(z * testParams.zFreq + step * testParams.sliceSpeedCoef);
    	            let dy = 16 + testParams.sliceRadius * Math.cos(z * testParams.zFreq + step * testParams.sliceSpeedCoef);
    	            let dz = 16;
    	            
    	            let mx = (x - dx);
    	            let my = (y - dy);
    	            let mz = (z - dz);


    	            d = Math.sqrt(mx * mx + my * my + mz * mz);
    	            
    	            //if (d < 16) d = 0.0;

    	            d = Math.sin(d * 0.1 + step * 0.05);
    	            

    	            data[i++] = mapLinear(d, -1, 1, 0, 256); // map to a value between 0 and 256
    	        }
    	    }
    	}

    	let texture = new THREE.DataTexture3D(data, size, size, size);
    	texture.format = THREE.RedFormat;
    	texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
    	texture.unpackAlignment = 1; // 4 b y default. 

    	let material = new THREE.RawShaderMaterial({
    	    glslVersion: THREE.GLSL3,
    	    uniforms:{
    	        map: {value: texture},
    	        cameraPos: {value: new THREE.Vector3()},
    	        threshold: {value: controls.threshold},
    	        steps: {value: 300}
    	    },
    	    vertexShader,
    	    fragmentShader,
    	    side: THREE.BackSide,
    	    
    	});
    

    	let geometry = new THREE.BoxGeometry(1, 1, 1);
    

    	let testMat = new THREE.MeshBasicMaterial({color: 0xFF0000});
    	let mesh = new THREE.Mesh(geometry,material);
    	mesh.position.set(0, 0, 0);
    	scene.add(mesh);


	}

	let step = 0;

	function render(time){
		//stats.update();
		step++;

		//scene.rotation.set(step * 0.01, step * 0.01, step * 0.01);
		time *= 0.001;
		updateTexture();
		scene.children[0].material.uniforms.cameraPos.value.copy( camera.position );
		
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
	requestAnimationFrame(render);
}

main();
