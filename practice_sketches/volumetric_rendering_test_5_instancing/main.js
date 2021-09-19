
import * as THREE from "https://cdn.skypack.dev/three@0.130.0/build/three.module.js";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.130.0/examples/jsm/controls/OrbitControls.js";
import {ImprovedNoise} from "https://cdn.skypack.dev/three@0.130.0/examples/jsm/math/ImprovedNoise.js";
import {WEBGL} from "https://cdn.skypack.dev/three@0.130.0/examples/jsm/WebGL.js"
import {EffectComposer} from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/RenderPass.js';
import {SMAAPass} from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/SMAAPass.js';
//import {Reflector} from "https://cdn.skypack.dev/three@0.130.0/examples/jsm/objects/Reflector.js";

class ModifiedReflector extends THREE.Mesh {

	constructor( geometry, options = {} ) {

		super( geometry );

		this.type = 'Reflector';

		const scope = this;

		const color = ( options.color !== undefined ) ? new THREE.Color( options.color ) : new THREE.Color( 0x7F7F7F );
		const textureWidth = options.textureWidth || 512;
		const textureHeight = options.textureHeight || 512;
		const clipBias = options.clipBias || 0;
		const shader = options.shader || ModifiedReflector.ReflectorShader;

		//

		const reflectorPlane = new THREE.Plane();
		const normal = new THREE.Vector3();
		const reflectorWorldPosition = new THREE.Vector3();
		const cameraWorldPosition = new THREE.Vector3();
		const rotationMatrix = new THREE.Matrix4();
		const lookAtPosition = new THREE.Vector3( 0, 0, - 1 );
		const clipPlane = new THREE.Vector4();

		const view = new THREE.Vector3();
		const target = new THREE.Vector3();
		const q = new THREE.Vector4();

		const textureMatrix = new THREE.Matrix4();
		const virtualCamera = new THREE.PerspectiveCamera();

		const parameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat
		};

		const renderTarget = new THREE.WebGLRenderTarget( textureWidth, textureHeight, parameters );

		if ( ! THREE.MathUtils.isPowerOfTwo( textureWidth ) || ! THREE.MathUtils.isPowerOfTwo( textureHeight ) ) {

			renderTarget.texture.generateMipmaps = false;

		}

		const material = new THREE.ShaderMaterial( {
			uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader
		} );

		material.uniforms[ 'tDiffuse' ].value = renderTarget.texture;
		material.uniforms[ 'color' ].value = color;
		material.uniforms[ 'textureMatrix' ].value = textureMatrix;

		this.material = material;

		this.onBeforeRender = function ( renderer, scene, camera ) {

			reflectorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
			cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

			rotationMatrix.extractRotation( scope.matrixWorld );

			normal.set( 0, 0, 1 );
			normal.applyMatrix4( rotationMatrix );

			view.subVectors( reflectorWorldPosition, cameraWorldPosition );

			// Avoid rendering when reflector is facing away

			if ( view.dot( normal ) > 0 ) return;

			view.reflect( normal ).negate();
			view.add( reflectorWorldPosition );

			rotationMatrix.extractRotation( camera.matrixWorld );

			lookAtPosition.set( 0, 0, - 1 );
			lookAtPosition.applyMatrix4( rotationMatrix );
			lookAtPosition.add( cameraWorldPosition );

			target.subVectors( reflectorWorldPosition, lookAtPosition );
			target.reflect( normal ).negate();
			target.add( reflectorWorldPosition );

			virtualCamera.position.copy( view );
			virtualCamera.up.set( 0, 1, 0 );
			virtualCamera.up.applyMatrix4( rotationMatrix );
			virtualCamera.up.reflect( normal );
			virtualCamera.lookAt( target );

			virtualCamera.far = camera.far; // Used in WebGLBackground

			virtualCamera.updateMatrixWorld();
			virtualCamera.projectionMatrix.copy( camera.projectionMatrix );

			// Update the texture matrix
			textureMatrix.set(
				0.5, 0.0, 0.0, 0.5,
				0.0, 0.5, 0.0, 0.5,
				0.0, 0.0, 0.5, 0.5,
				0.0, 0.0, 0.0, 1.0
			);
			textureMatrix.multiply( virtualCamera.projectionMatrix );
			textureMatrix.multiply( virtualCamera.matrixWorldInverse );
			textureMatrix.multiply( scope.matrixWorld );

			// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
			// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
			reflectorPlane.setFromNormalAndCoplanarPoint( normal, reflectorWorldPosition );
			reflectorPlane.applyMatrix4( virtualCamera.matrixWorldInverse );

			clipPlane.set( reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant );

			const projectionMatrix = virtualCamera.projectionMatrix;

			q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
			q.y = ( Math.sign( clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
			q.z = - 1.0;
			q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

			// Calculate the scaled plane vector
			clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) );

			// Replacing the third row of the projection matrix
			projectionMatrix.elements[ 2 ] = clipPlane.x;
			projectionMatrix.elements[ 6 ] = clipPlane.y;
			projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
			projectionMatrix.elements[ 14 ] = clipPlane.w;

			// Render

			renderTarget.texture.encoding = renderer.outputEncoding;

			scope.visible = false;

			const currentRenderTarget = renderer.getRenderTarget();

			const currentXrEnabled = renderer.xr.enabled;
			const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

			renderer.xr.enabled = false; // Avoid camera modification
			renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

			renderer.setRenderTarget( renderTarget );

			renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897

			if ( renderer.autoClear === false ) renderer.clear();
			renderer.render( scene, virtualCamera );

			renderer.xr.enabled = currentXrEnabled;
			renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

			renderer.setRenderTarget( currentRenderTarget );

			// Restore viewport

			const viewport = camera.viewport;

			if ( viewport !== undefined ) {

				renderer.state.viewport( viewport );

			}

			scope.visible = true;

		};

		this.getRenderTarget = function () {

			return renderTarget;

		};

	}

}

ModifiedReflector.prototype.isReflector = true;

ModifiedReflector.ReflectorShader = {

	uniforms: {

		'color': {
			value: null
		},

		'tDiffuse': {
			value: null
		},

		'textureMatrix': {
			value: null
		}

	},

	vertexShader: /* glsl */`
		uniform mat4 textureMatrix;
		varying vec4 vUv;
		#include <common>
		#include <logdepthbuf_pars_vertex>
		void main() {
			vUv = textureMatrix * vec4( position, 1.0 );
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			#include <logdepthbuf_vertex>
		}`,

	fragmentShader: /* glsl */`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;
		#include <logdepthbuf_pars_fragment>
		float blendOverlay( float base, float blend ) {
			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
		}
		vec3 blendOverlay( vec3 base, vec3 blend ) {
			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
		}
		void main() {
			#include <logdepthbuf_fragment>
			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );
		}`
};
function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}


function main(){

	const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});
    //renderer.antialias = true;
    //renderer.setPixelRatio(window.innerWidth, window.innerHeight);

    let stats;
    //initStats();
//CAMERA
	const fov = 45;
	const aspect = window.innerWidth / window.innerHeight; // display aspect of the canvas
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	camera.position.set(10, 2, 10);
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
	// for 2D reaction diffusion texture.
	const texVertexShader = `

	`;
	// reaction diffusion shader
	const texFragmentShader0 = `

	`;
	// output shader
	const texFragmentShader1 = `

	`;

	// buffers
	let rd2dTex0 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
	let rd2dTex1 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

	// reaction diffusion shader
	let rd2dUniforms = {
		texture: {type: "t", value: rd2dTex1}
	}
	let rd2dMaterial = new THREE.ShaderMaterial({
		vertexShader: texVertexShader,
		fragmentShader: texFragmentShader0
	});
	let rd2dGeo = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);
	let rd2dQuad = new THREE.Mesh(rd2dGeo, rd2dMaterial);
	//scene.add(rd2dQuad);

	// output shader

	let outputUniforms = {
		rd2dOutput: {type: "t", value: rd2dTex1}
	}
	let outputMaterial = new THREE.ShaderMaterial({

		uniforms: outputUniforms,
		vertexShader: texVertexShader,
		fragmentShader: texFragmentShader1
	})
	let outputGeo = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);
	let outputQuad = new THREE.Mesh(outputGeo, outputMaterial);
	scene.add(outputQuad);


    // for 3D reaction diffusion. 
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

        uniform int colorMode;
        
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
					color.rgb = normal( p + 0.5 ) * 0.5 + ( p  );
					//color.rgb = normal(p + 0.5);
					vec3 n = normal(p + 0.5);
					float fs = acos(dot(n, vDirection));
					float fs2 = dot(n, 1.0 - normalize(vDirection));
					
					vec3 lm = lightDir - (p + 0.5);
					vec3 rm = 2.0 * (dot(lm, n)) * n - lm;
					//color.rgb = vec3(normal(p + 0.5));
					
					//color.rgb = vec3(1.0 - fs2); 
					//color.rgb = rm;
					
					color.rgb = vec3(color.r + color.g + color.b);
					color.rgb *= 0.25;
					vec3 light = vec3(dot(lm, n) + pow(dot(rm , normalize(vDirection)), 1.0)) + vec3(1.0);
					//color.rgb = light + 0.25;
					color.r += n.g;
					color = 0.75 - color;
					//color *= 1.5;
					//color.rgb += vec3(0.5);
					//color.rgb *= texture(tex, abs(p.xy )).rgb;

					
					// ORIGINAL COLOR
					color.rgb = vec3(dot(lm, n) + pow(dot(-rm , normalize(vDirection)), 1.0));
					color.rgb = 1.0 - color.rgb;
					
					
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

// REFLECTIVE STUFF

	
	let gap = 3.0;
	let refGeom = new THREE.PlaneGeometry(gap * 2.0 - 0.25, gap * 2.0 - 0.25);
	let mirrorArr = [];
	let mirrorOptions = {
		clipBias: 0.003,
		textureWidth: window.innerWidth * window.devicePixelRatio,
		textureHeight: window.innerHeight * window.devicePixelRatio,
	}
	let mirror = new ModifiedReflector(refGeom, mirrorOptions);
	let mirror2 = new ModifiedReflector(refGeom, mirrorOptions);
	let mirror3 = new ModifiedReflector(refGeom, mirrorOptions);

	let mirrorGroup = new THREE.Group();

	let frameGeo = new THREE.PlaneGeometry(gap * 2.0 + 0.01, gap * 2.0 + 0.01);
	let frameMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF});


	let frame1 = new THREE.Mesh(frameGeo, frameMat);
	let frame2 = new THREE.Mesh(frameGeo, frameMat);
	let frame3 = new THREE.Mesh(frameGeo, frameMat);



	let frameGroup = new THREE.Group();

	let light = new THREE.SpotLight(0xffffff, 2);
	light.position.set(1.5, 1.5, 1.5);
	light.castShadow = true;
	scene.add(light);

	
	mirror.position.z = -gap;
	frame1.position.z = -gap - 0.001;

	mirror2.rotateY(Math.PI * 0.5);
	mirror2.position.x = -gap;

	frame2.rotateY(Math.PI * 0.5);
	frame2.position.x = -gap - 0.001;

	mirror3.rotateX(-Math.PI * 0.5);
	mirror3.position.y = -gap;	

	frame3.rotateX(-Math.PI * 0.5);
	frame3.position.y = -gap - 0.001;	

	mirrorArr.push(mirror);
	mirrorArr.push(mirror2);
	mirrorArr.push(mirror3);

	mirrorArr.forEach(function(m){
		
		mirrorGroup.add(m);
	});

	frameGroup.add(frame1);
	frameGroup.add(frame2);
	frameGroup.add(frame3);

	frameGroup.receiveShadow = true;

	scene.add(frameGroup);
	scene.add(mirrorGroup);
//GUI
	
	const gui = new dat.GUI();
	const controls = new function(){
		
		this.threshold = 0.16;
		
	}

	gui.add(controls, 'threshold', 0, 1).listen().onChange(function (e){
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
	let isOutOfBounds = [];
	let aPrevValues = [];
	let bPrevValues = [];
	let aNextValues = [];
	let bNextValues = [];
	for (let i = 0; i < 26; i++) {
		adjacentIndices.push(0);
		isOutOfBounds.push(false);
	}
	for (let i = 0; i < Math.pow(size, 3); i++){
		aPrevValues.push(1);
		bPrevValues.push(0);
		aNextValues.push(1);
		bNextValues.push(0);
	}
	

	controls.enableBoundary = false;
	gui.add(controls, 'enableBoundary', false).listen();


	// i: current index
	// a: index in isOutOfBounds

	function getLeftIndex(i, s, a){
		if (i % s != 0) {
			isOutOfBounds[a] = false;
			return i - 1;
		}
		else {
			isOutOfBounds[a] = true;
			return i - 1 + s;
		}
		//return i % s != 0 ? i - 1 : i - 1 + s;
	}

	function getRightIndex(i, s, a){
		if ((i + 1) % s != 0) {
			isOutOfBounds[a] = false;
			return i + 1;
		}
		else{
			isOutOfBounds[a] = true;
			return i + 1 - s;
		}
		//return (i + 1) % s != 0 ? i + 1 : i + 1 - s;
	}

	function getDownIndex(i, ss, tms, a){
		if (i < tms) {
			isOutOfBounds[a] = false;
			return i + ss;
		}
		else {
			isOutOfBounds[a] = true;
			return i - tms;
		}
		//return i < tms ? i + ss : i - tms;
	}

	function getUpIndex(i, ss, tms, a){
		if (i >= ss){
			isOutOfBounds[a] = false;
			 return i - ss;
		}
		else {
			isOutOfBounds[a] = true;
			return i + tms;
		}
		//return i >= ss ? i - ss : i + tms;
	}

	function getBackIndex(i, s, ss, a){
		let bf = Math.floor(i / ss) * ss;
		if ((i < bf) || (i >= bf + s)){
			isOutOfBounds[a] = false;
		 	return i - s;
		 }
		else {
			isOutOfBounds[a] = true;
			return i - s + ss;
		}
		/*
		return (i < bf) || (i >= bf + s) ?
				i - s : 
				i - s + ss ;
		*/
	}

	function getFrontIndex(i, s, ss, a){
		let ff = Math.floor((i + s) / ss) * ss;
		if ((i < ff - s) || (i >= ff)){
			isOutOfBounds[a] = false;
			return i + s;
		}
		else{
			isOutOfBounds[a] = true;
			return i - ss + s;
		}
		/*
		return (i < ff - s) || (i >= ff) ? 
				i + s :
				i - ss + s;
		*/
	}
	function calcNeighborIndices(i, size){
		let sizeSquared = Math.pow(size, 2);
        let sizeTripled = Math.pow(size, 3);
        let tms = sizeTripled - sizeSquared;
        //let ff = Math.floor((i + size) / sizeSquared) * sizeSquared; // front floored
        //let bf = Math.floor(i / sizeSquared) * sizeSquared; // back floored
		// NEEDS MAJOR FIXING UP
		// face sharing
		adjacentIndices[0] = getLeftIndex(i, size, 0);//i % size != 0 ? i - 1 : i - 1 + size; // l
		adjacentIndices[1] = getRightIndex(i, size, 1);//(i + 1) % size != 0 ? i + 1 : i + 1 - size; // r
		adjacentIndices[2] = getDownIndex(i, sizeSquared, tms, 2);//i < tms ? i + sizeSquared : i - tms; // d
		adjacentIndices[3] = getUpIndex(i, sizeSquared, tms, 3);//i >= sizeSquared ? i - sizeSquared : i + tms; // u
		adjacentIndices[4] = getBackIndex(i, size, sizeSquared, 4);
							//(i < bf) || (i >= bf + size) ?
							//i - size : 
							//i - size + sizeSquared ; // b
		adjacentIndices[5] = getFrontIndex(i, size, sizeSquared, 5);
							//(i < ff - size) || (i >= ff) ? 
							//i + size :
							//i - sizeSquared + size; // f

		// side sharing
		adjacentIndices[6] = getLeftIndex(adjacentIndices[5], size, 6);//mod(adjacentIndices[5] - 1, size); // fl = f - 1 // f's left
		adjacentIndices[7] = getRightIndex(adjacentIndices[5], size, 7);//mod(adjacentIndices[5] + 1, size); // fr = f + 1 // f's right
		adjacentIndices[8] = getDownIndex(adjacentIndices[5], sizeSquared, tms, 8);//mod(adjacentIndices[2] + size, sizeSquared); // fd = d + size // f's down
		adjacentIndices[9] = getUpIndex(adjacentIndices[5], sizeSquared, tms, 9);//mod(adjacentIndices[3] + size, sizeSquared); // fu = u + size // f's up
		
		
		adjacentIndices[10] = getLeftIndex(adjacentIndices[4], size, 10);//mod(adjacentIndices[4] - 1, size); // bl = b - 1 // b's left
		adjacentIndices[11] = getRightIndex(adjacentIndices[4], size, 11);//mod(adjacentIndices[4] + 1, size); // br = b + 1 // b's right
		adjacentIndices[12] = getDownIndex(adjacentIndices[4], sizeSquared, tms, 12);//mod(adjacentIndices[2] - size, sizeSquared); //  bd = d - size // b's down
		adjacentIndices[13] = getUpIndex(adjacentIndices[4], sizeSquared, tms, 13);//mod(adjacentIndices[3] - size, sizeSquared); // bu = u - size // b's up

		
		adjacentIndices[14] = getLeftIndex(adjacentIndices[3], size, 14);//mod(adjacentIndices[3] - 1, size); // ul = u - 1 // u's left
		adjacentIndices[15] = getRightIndex(adjacentIndices[3], size, 15);//mod(adjacentIndices[3] + 1, size); // ur = u + 1 // u's right
		adjacentIndices[16] = getLeftIndex(adjacentIndices[2], size, 16);//mod(adjacentIndices[2] - 1, size); // dl = d - 1 // d's left
		adjacentIndices[17] = getRightIndex(adjacentIndices[2], size, 17);//mod(adjacentIndices[2] + 1, size); // dr = d + 1 // d's right

		// vertex sharing
		adjacentIndices[18] = getLeftIndex(adjacentIndices[9], size, 18);//mod(adjacentIndices[9] - 1, size); // ful = fu - 1 // fu's left
		adjacentIndices[19] = getRightIndex(adjacentIndices[9], size, 19);//mod(adjacentIndices[9] + 1, size); // fur = fu + 1 // fu's right
		adjacentIndices[20] = getLeftIndex(adjacentIndices[8], size, 20);//mod(adjacentIndices[8] - 1, size); // fdl = fd - 1 // fd's left
		adjacentIndices[21] = getRightIndex(adjacentIndices[8], size, 21);//mod(adjacentIndices[8] + 1, size); // fdr = fd + 1`// fd's right

		adjacentIndices[22] = getLeftIndex(adjacentIndices[13], size, 22);//mod(adjacentIndices[17] - 1, size); // bul = bu - 1 // bu's left
		adjacentIndices[23] = getRightIndex(adjacentIndices[13], size, 23);//mod(adjacentIndices[17] + 1, size); // bur = bu + 1 // bu's right
		adjacentIndices[24] = getLeftIndex(adjacentIndices[12], size, 24);//mod(adjacentIndices[16] - 1, size); // bdl = bd - 1 // bd's left
		adjacentIndices[25] = getRightIndex(adjacentIndices[12], size, 25);//mod(adjacentIndices[16] + 1, size); // bdr = bd + 1 // bd's right
		
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

	paramFolder.add(RD_PARAMS, 'da', 0.0, 1.5).listen();
	paramFolder.add(RD_PARAMS, 'db', 0.0, 1.5).listen();
	paramFolder.add(RD_PARAMS, 'dt', 0.0, 10.0).listen().step(0.001);
	paramFolder.add(RD_PARAMS, 'feed', 0.0, 0.1).listen().step(0.001);
	paramFolder.add(RD_PARAMS, 'kill', 0.0, 0.1).listen().step(0.001);
	paramFolder.add(RD_PARAMS, 'faceNeighborCoef', 0.0, 0.25).listen().step(0.001);
	paramFolder.add(RD_PARAMS, 'sideNeighborCoef', 0.0, 0.25).listen().step(0.001);
	paramFolder.add(RD_PARAMS, 'vertNeighborCoef', 0.0, 0.25).listen().step(0.001);


	

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
	controls.moveFeedSource = false;
	gui.add(controls, 'continuousFeed', false).listen();
	gui.add(controls, 'moveFeedSource', false).listen();
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
			if (controls.enableBoundary && isOutOfBounds[i]){
				asum -= 10;
				bsum -= 10;
			 return;
			}
			if (i < 6){
				asum += aPrevValues[adjIndex] * fc;
				bsum += bPrevValues[adjIndex] * fc;
			}

			else if (i < 18){
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
			
			
			

			let ra = 0.5;
			let dist;
			if (controls.moveFeedSource){
				 dist = Math.sqrt(distSquared(x, y, z, ra * Math.sin(step * 0.01), ra * Math.cos(step * 0.01), ra * Math.cos(step * 0.01)));
			}
			else{
				dist = Math.sqrt(distSquared(x, y, z, 0, 0, 0));
			}
			let r = 0.1;
			dist = dist > r ? 0.0 : 1.0;
			b += dist;
			
			/*
			let rand = perlin.noise(x * 10.0 + step * 0.001, y * 10.0 + step * 0.001, z * 10.0 + step * 0.001);
			rand = rand > 0 ? 0.0 : 1.0;
			b += rand;
			*/
			
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
		console.log(isOutOfBounds);
		console.log(p5texture);
		
	}
	gui.add(controls, 'debug');

	let debugMat = new THREE.MeshBasicMaterial();
	let debugCube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), debugMat);

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
	let switchMeshPosFlag = true;
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
    	

		//scene.remove(scene.getObjectByName("volumeMesh"));
		//scene.remove(scene.getObjectByName('rdmesh'));
		scene.clear();
		//scene.add(debugCube);
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
    	        steps: {value: 200},
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
    	let mesh2 = new THREE.Mesh(geometry, material);

    	let mesh3 = new THREE.Mesh(geometry, material);
    	let mesh4 = new THREE.Mesh(geometry, material);
    	let mesh5 = new THREE.Mesh(geometry, material);

    	let mesh6 = new THREE.Mesh(geometry, material);
    	let mesh7 = new THREE.Mesh(geometry, material);
    	let mesh8 = new THREE.Mesh(geometry, material);
    	let mesh9 = new THREE.Mesh(geometry, material);
    	//mesh2.rotation.set(0, Math.PI, 0);
    	
    	


    	mesh4.rotation.set(0, 0, -Math.PI);
    	

    	mesh5.rotation.set(0, 0, Math.PI);
    	

    	mesh6.rotation.set(0, Math.PI, 0);
    	

    	mesh7.rotation.set(0, -Math.PI, 0);
    	


    	mesh8.rotation.set(0, 0, -Math.PI);
    	

    	mesh9.rotation.set(0, 0, Math.PI);
    	

    	if (step % 60 == 0) switchMeshPosFlag = !switchMeshPosFlag;
    	if (switchMeshPosFlag){
    		mesh8.visible = true;
			mesh9.visible = true;
    		mesh2.position.set(1, 1, -1);
    		mesh3.position.set(-1, -1, 1);
    		mesh4.position.set(1, 1, 1);
			mesh5.position.set(-1, -1, -1);
			mesh6.position.set(-1, 1, -1);
			mesh7.position.set(1, -1, 1);
			mesh8.position.set(-1, 1, 1);
			mesh9.position.set(1, -1, -1);
		}

		else {
    		mesh2.position.set(0, 0, -1);
    		mesh3.position.set(0, 0, 1);
    		mesh4.position.set(0, 1, 0);
			mesh5.position.set(0, -1, 0);
			mesh6.position.set(1, 0, 0);
			mesh7.position.set(-1, 0, 0);
			mesh8.visible = false;
			mesh9.visible = false;
		}

    	
    	let rdmeshGroup = new THREE.Mesh();
    	rdmeshGroup.castShadow = true;

    	mesh.name = 'volumeMesh';
    	//mesh2.name = 'volumeMesh2';

    	//scene.rotation.set(step * 0.01, step * 0.01,  0);


    	rdmeshGroup.add(mesh);
    	rdmeshGroup.add(mesh2);
    	rdmeshGroup.add(mesh3);
    	rdmeshGroup.add(mesh4);
    	rdmeshGroup.add(mesh5);
    	rdmeshGroup.add(mesh6);
    	rdmeshGroup.add(mesh7);
    	rdmeshGroup.add(mesh8);
    	rdmeshGroup.add(mesh9);

    	rdmeshGroup.name = 'rdmesh';

    	rdmeshGroup.rotation.set(step * 0.01, step * 0.01,  0);
    	scene.add(rdmeshGroup);

    	material.dispose();
	}

// BACKGROUND GEOM
	let knotTex = new THREE.TextureLoader().load('tex.png');
	let knotGeom = new THREE.TorusKnotGeometry(30, 3, 500, 3, 2, 7);
	let knotMat = new THREE.MeshBasicMaterial({map: knotTex});

	let knot = new THREE.Mesh(knotGeom, knotMat);
	knot.rotation.x = 90;
	knotTex.wrapS = THREE.RepeatWrapping;
	knotTex.wrapT = THREE.RepeatWrapping;

	scene.add(knot);
// POST PROCESSING
	let renderPass = new RenderPass(scene, camera);
	let smaaPass = new SMAAPass(window.innderWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
	let composer = new EffectComposer(renderer);

	composer.setSize(window.innerWidth, window.innerHeight);
	composer.addPass(renderPass);
	composer.addPass(smaaPass);

// PRESETS
	
	let presetsArr = ['ERROR', 'ERROR_2', 'ERROR_3', 'ERROR_4','SEMI_MITOSIS', 'SEMI_MITOSIS_2', 'RING_PUFF', 'BLOWOUT', 'BLOWOUT_2', 'FN_ONLY'];
	let presetsIndex = 0;
	controls.presets = 'BLOWOUT';
	controls.threshold = 0.23;
	controls.moveFeedSource = true;
	controls.enableBoundary = false;
	setRDParams(0.84, 0.93, 1.2, 0.057, 0.062, 0.167, 0, 0);
	function setRDParams(a, b, t, f, k, fn, sn, vn){
		
		RD_PARAMS.da = a;
		RD_PARAMS.db = b;
		RD_PARAMS.dt = t;
		RD_PARAMS.feed = f;
		RD_PARAMS.kill = k;
		RD_PARAMS.faceNeighborCoef = fn;
		RD_PARAMS.sideNeighborCoef = sn;
		RD_PARAMS.vertNeighborCoef = vn;
	}

	function switchMode(m){
		switch(m){
			case 'ERROR':
				controls.threshold = 0.36;
				controls.continuousFeed = true;
				controls.moveFeedSource = true;
				controls.enableBoundary = false;
				setRDParams(1.05, 0.14, 1.479, 0.021, 0.034, 0.04, 0.056, 0.015);
				break;

			case 'ERROR_2':
				controls.threshold = 0.59;
				controls.moveFeedSource = true;
				controls.enableBoundary = true;
				setRDParams(0.59, 0.14, 3.023, 0.042, 0.031, 0.081, 0.1, 0.037);
				break;

			case 'ERROR_3':
				controls.threshold = 0.27;
				controls.continuousFeed = true;
				controls.moveFeedSource = true;
				controls.enableBoundary = true;
				setRDParams(0.55, 0.93, 4.125, 0.036, 0.035, 0.023, 0.04, 0.009);
				break;
			case 'ERROR_4':
				controls.threshold = 0.32;
				controls.continuousFeed = true;
				controls.moveFeedSource = true;
				controls.enableBoundary = true;
				setRDParams(0.55, 0.27, 5.337, 0.051, 0.077, 0.029, 0.04, 0.009);
				break;
			case 'SEMI_MITOSIS':
				controls.threshold = 0.82;
				controls.moveFeedSource = false;
				controls.enableBoundary = false;
				setRDParams(0.6, 0.2, 1.0, 0.058, 0.07, 1.0 / 26.0, 1.0 / 26.0, 1.0 / 26.0);
				break;
			case 'SEMI_MITOSIS_2':
				controls.threshold = 0.79;
				controls.moveFeedSource = false;
				controls.enableBoundary = false;
				setRDParams(0.68, 0.12, 1.2, 0.009, 0.056, 1.0 / 26.0, 1.0 / 26.0, 1.0 / 26.0);
				break;
			case 'RING_PUFF':
				controls.threshold = 0.82;
				controls.moveFeedSource = false;
				controls.enableBoundary = false;
				setRDParams(0.73, 0.2, 1.4, 0.009, 0.056, 1.0 / 26.0, 1.0 / 26.0, 1.0 / 26.0);
				break;
			case 'BLOWOUT':
				controls.threshold = 0.23;
				controls.moveFeedSource = true;
				controls.enableBoundary = false;
				setRDParams(0.84, 0.93, 1.2, 0.057, 0.062, 0.167, 0, 0);
				break;
			case 'BLOWOUT_2':
				controls.threshold = 0.19;
				controls.moveFeedSource = true;
				controls.enableBoundary = false;
				setRDParams(0.75, 1.13, 1.148, 0.043, 0.062, 0.167, 0, 0);
				break;
			case 'FN_ONLY':
				RD_PARAMS.faceNeighborCoef = 1.0 / 6.0;
				RD_PARAMS.sideNeighborCoef = 0.0;
				RD_PARAMS.vertNeighborCoef = 0.0;
				break;
		}
	}
	gui.add(controls, 'presets', 
		presetsArr).onChange(switchMode).listen();

	let step = 0;

	function render(time){
		knotGeom.p = 5 + 5 * Math.sin(step * 0.01);
		if (decrementThreshold){
			if (controls.threshold < 1) controls.threshold += 0.01;
		}
		moveCamera();
		//stats.update();
		step++;
		
		//scene.rotation.set(0, step * 0.005, 0);
		time *= 0.001;
		updateTexture();

		scene.rotation.y = step * 0.005;
		mirrorArr.forEach(m => scene.add(m));
		//knot.rotation.x = step * 0.01;
		//knot.rotation.y = step * 0.01;
		//knot.rotation.z = step * 0.01;

		scene.add(knot);
		scene.add(light);
		scene.add(frameGroup);
		scene.getObjectByName("volumeMesh").material.uniforms.cameraPos.value.copy( camera.position );
		
		if (resizeRenderToDisplaySize(renderer)){
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();

		}
		//renderer.render(scene, camera);
		composer.render();

		requestAnimationFrame(render);

		//p5texture.dispose();
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

    let moveCameraForward = false;
    let moveCameraBackward = false;
    let decrementThreshold = false;
    function moveCamera(){
    	let forwardDest = new THREE.Vector3(0, 0, 0);
    	let div = 200.0;
    	if (moveCameraForward){
    		let dist = camera.position.distanceTo(forwardDest);
    		let subVec = forwardDest.sub(camera.position);

    		subVec.divideScalar(div);
    		//console.log(subVec, dist);
    		if (dist > 7){
    			camera.position.add(subVec);
    			//console.log(camera.position);
    		}
    		else moveCameraForward = false;
    	}

    	else if (moveCameraBackward){
    		let dist = camera.position.distanceTo(forwardDest);
    		let subVec = forwardDest.sub(camera.position);
    		subVec.divideScalar(div);
    		//console.log(subVec, dist);
    		if (dist < 13){
    			camera.position.sub(subVec);
    			//console.log(camera.position);
    		}
    		else moveCameraBackward = false;
    	}
    	camera.lookAt(0, 0, 0);
    }
    function onDocumentKeyDown(event){
    	var keyCode = event.which;
    	console.log(keyCode);
    	switch(keyCode){
    		case 88:
    			moveCameraForward = true;
    			break;
    		case 90:
    			moveCameraBackward = true;
    			break;
    		case 82:
    			controls.reset();
    			break;
    		case 65:
    			controls.addValue();
    			break;
    		case 49:
    			controls.presets = presetsArr[presetsIndex];
    			switchMode(controls.presets);
    			presetsIndex++;
    			if (presetsIndex > 3) presetsIndex = 7;
    			
    			break;
    		case 84:
    			decrementThreshold = true;
    			break;
    	}
    }

    window.addEventListener('keydown', onDocumentKeyDown, false);
    window.addEventListener('resize', onResize, false);
	requestAnimationFrame(render);
}

window.onload = main;
