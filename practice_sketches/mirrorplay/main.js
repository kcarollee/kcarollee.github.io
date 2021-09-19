
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
	const far = 1000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	camera.position.set(10, 2, 10);
	camera.lookAt(0, 0, 0);

	new OrbitControls(camera, renderer.domElement);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xffffff);
	
    renderer.render(scene, camera);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    

// REFLECTIVE STUFF

	
	let gap = 3.0;
	let refGeom = new THREE.PlaneGeometry(gap * 2.0, gap * 2.0);
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

	let frameGeo = new THREE.PlaneGeometry(gap * 2.0 , gap * 2.0 );
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

	//scene.add(frameGroup);
	scene.add(mirrorGroup);
//GUI
	
	const gui = new dat.GUI();
	const controls = new function(){
		
		
		
	}

	



	

	

// BACKGROUND GEOM
	let knotTex = new THREE.TextureLoader().load('tex.png');
	let knotGeom = new THREE.TorusKnotGeometry(30, 7, 1000, 3, 2, 11);
	let knotMat = new THREE.MeshBasicMaterial({
		map: knotTex,
		morphTargets: true
	});


	knotGeom.morphAttributes.position = [];
	let knotMorphPositions = [];
	let knotInitialPosAttribute = knotGeom.attributes.position;
	console.log(knotInitialPosAttribute)
	let perlin = new ImprovedNoise();
	for (let i = 0; i < knotInitialPosAttribute.count; i++){
		let x = knotInitialPosAttribute.getX(i) + perlin.noise(knotInitialPosAttribute.getX(i), knotInitialPosAttribute.getY(i), knotInitialPosAttribute.getZ(i));
		let y = knotInitialPosAttribute.getY(i) + perlin.noise(knotInitialPosAttribute.getZ(i), knotInitialPosAttribute.getX(i), knotInitialPosAttribute.getY(i));
		let z = knotInitialPosAttribute.getZ(i) + perlin.noise(knotInitialPosAttribute.getY(i), knotInitialPosAttribute.getZ(i), knotInitialPosAttribute.getX(i));

		knotMorphPositions.push(x, y, z);
	}

	knotGeom.morphAttributes.position[0] = new THREE.Float32BufferAttribute(knotMorphPositions, 3);
	let knot = new THREE.Mesh(knotGeom, knotMat);
	

	
	scene.add(knot);
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
		
		moveCamera();
		//stats.update();
		step++;
		
		//scene.rotation.set(0, step * 0.005, 0);
		time *= 0.001;
		
		//scene.rotation.y = step * 0.005;
		//mirrorArr.forEach(m => scene.add(m));
		//knot.rotation.x = step * 0.01;
		//knot.rotation.y = step * 0.01;
		//knot.rotation.z = step * 0.01;

		
		
		knot.morphTargetInfluences[0] = 2.0 * Math.sin(step * 0.01);
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
    	}
    }

    window.addEventListener('keydown', onDocumentKeyDown, false);
    window.addEventListener('resize', onResize, false);
	requestAnimationFrame(render);
}

window.onload = main;
