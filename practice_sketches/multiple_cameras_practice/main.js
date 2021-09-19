// https://stackoverflow.com/questions/42562056/how-to-use-rendering-result-of-scene-as-texture-in-threejs
// https://threejs.org/examples/webgl_rtt.html
// https://stemkoski.github.io/Three.js/Refraction.html
import * as THREE from "https://cdn.skypack.dev/three@0.130.0/build/three.module.js";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.130.0/examples/jsm/controls/OrbitControls.js";
import {ImprovedNoise} from "https://cdn.skypack.dev/three@0.130.0/examples/jsm/math/ImprovedNoise.js";
import {EffectComposer} from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/RenderPass.js';
import {SMAAPass} from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/SMAAPass.js';
import {BufferGeometryUtils} from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/utils/BufferGeometryUtils.js';
const DEFAULT_CAM_CONFIGS = {
	fov: 60, 
	aspect: window.innerWidth/window.innerHeight, 
	near: 0.1, 
	far: 1000
}

class RenderTargetCamera{
	// lookAt: Vector3
	constructor(posx, posy, posz, lookAt, configs = DEFAULT_CAM_CONFIGS){
		this.camera = new THREE.PerspectiveCamera(configs.fov, configs.aspect, configs.near, configs.far);
		this.camera.position.set(posx, posy, posz);
		this.cameraLookAt = lookAt;
		this.camera.lookAt(lookAt);
		this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

		// CAMERA MODEL
		this.cameraMesh = new THREE.Mesh(RenderTargetCamera.camGeometry, RenderTargetCamera.camMaterial);

	}

	updateCameraPosition(x, y, z){
		this.camera.position.set(x, y, z);
		this.cameraMesh.position.set(x, y, z);
	}

	updateCameraLookAt(x, y, z){
		this.cameraLookAt.set(x, y, z);
		this.camera.lookAt(this.cameraLookAt);
	}

	updateCameraMeshRotation(){
		//this.cameraMesh.rotation.set(1, 1, 0);
		//this.cameraMesh.rotateX(1);
		//this.cameraMesh.rotateY();
		//this.cameraMesh.rotateZ();

		let bisectVec = new THREE.Vector3();
		let initVec = new THREE.Vector3(1, 0, 0);
		let subVec = new THREE.Vector3();
		subVec.subVectors(this.cameraLookAt, this.camera.position);
		bisectVec = initVec.add(subVec).normalize();
		

		this.cameraMesh.rotateOnWorldAxis(bisectVec, Math.PI);
	}

	renderOntoRenderTarget(renderer, scene){
		renderer.setRenderTarget(this.renderTarget);
		renderer.clear();
		renderer.render(scene, this.camera);
	}

	// don't forget to add mesh to the scene
	getMesh(){
		return this.cameraMesh;
	}	

	getCameraViewTexture(){
		return this.renderTarget.texture;
	}

	getCamera(){
		return this.camera;
	}
}

RenderTargetCamera.camGeometry = new THREE.BoxGeometry(1, 1, 1);
RenderTargetCamera.camMaterial = new THREE.MeshBasicMaterial({color: 0xFF0000});



function main(){
	let step = 0;
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//CAMERA
	const cameraArr = [];
	
	const fov = 60;
	const aspect = canvas.clientWidth / canvas.clientHeight; // display aspect of the canvas
	const near = 0.1;
	const far = 1000;
	
	let mainCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	let mainCameraCopy;
	mainCamera.position.set(0, 0, 10);

	let orbitControls = new OrbitControls(mainCamera, renderer.domElement);
	orbitControls.enableDamping = true;
	orbitControls.update();
	const testCamera = new RenderTargetCamera(0, 0, -30, new THREE.Vector3(0, 0, 0));
	const testCamera2 = new RenderTargetCamera(0, 0, -30, new THREE.Vector3(0, 0, 0));
	
	cameraArr.push(mainCamera, testCamera, testCamera2);
	
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);

	const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
		format: THREE.RGBFormat,
		generateMipmaps: true,
		minFilter: THREE.LinearMipmapLinearFilter
	});

	const cubeCamera = new THREE.CubeCamera(near, far, cubeRenderTarget);
	//cube
	scene.add(cubeCamera);
	

//GEOMETRIES

	const torusNum = 150;
	const torusGeom = new THREE.TorusGeometry(5, 0.5, 5, 4);
	//const torusGeom = new THREE.SphereGeometry(20, 20, 20);
	//const torusGeom = new THREE.TorusGeometry(5, 5, 50, 50);
	//const torusMat = new THREE.MeshNormalMaterial();
	const torusMat = new THREE.MeshLambertMaterial({
		color: 0xFF7420,
		emissive: 0xFF7420
	});
	const textureLoader = new THREE.TextureLoader();
	const diffuse = textureLoader.load('test.jpeg');
	const normal1 = textureLoader.load('marble.jpg');
	diffuse.encoding = THREE.sRGBEncoding;
	diffuse.wrapS = THREE.RepeatWrapping;
	diffuse.wrapT = THREE.RepeatWrapping;
	diffuse.repeat.x = 10;
	diffuse.repeat.y = 10;

	console.log(normal1);
	/*
	normal1.encoding = THREE.sRGBEncoding;
	normal1.wrapS = THREE.RepeatWrapping;
	normal1.wrapT = THREE.RepeatWrapping;
	normal1.repeat.x = 4;
	normal1.repeat.y = 4;
	*/
	const standardMat = new THREE.MeshStandardMaterial({
		roughness: 0.1,
		metalness: 0.9,
		//map: diffuse,
		envMap: cubeRenderTarget.texture,
		normalMap: normal1,
		color: 0xFFFFFF
	});
	
	const cubeCameraMat = new THREE.MeshBasicMaterial({
		//color: 0xFFFFFF,
		envMap: cubeRenderTarget.texture,
		//reflectivity: 1,
		refractionRatio: 1
	})
	
	let torusArr = [];
	
	function getTorusPositionByIncrement(i){
		let radius = 40;
		let height = 40 + 20 * Math.sin(i * 3.0);
		let x = radius * Math.cos(i);
		let y = height;
		let z = radius * Math.sin(i);
		let pos = new THREE.Vector3(x, y, z);
		return pos;
	}

	let increment = Math.PI * 2.0 / torusNum;
	// init torus
	for (let i = 0; i < torusNum; i++){
		let torus = new THREE.Mesh(torusGeom, torusMat);
		//let torus = new THREE.Mesh(torusGeom, standardMat);
		//let torus = new THREE.Mesh(torusGeom, cubeCameraMat);
		let pos = getTorusPositionByIncrement(increment * (i));
		let prevPos = getTorusPositionByIncrement(increment * (i - 1));
		let lookAtVec = new THREE.Vector3();
		torus.castShadow = true;
		lookAtVec.subVectors(prevPos, pos);
		torus.lookAt(lookAtVec);
		torus.position.copy(pos);
		torusArr.push(torus);
		scene.add(torus);
	}

	
	function distortTorus(){
		for (let i = 0; i < torusArr.length; i++){
			let torus = torusArr[i];
			let pos = getTorusPositionByIncrement(increment * (i + step * 0.01));
			let prevPos = getTorusPositionByIncrement(increment * (i - 1 + step * 0.01));
			let lookAtVec = new THREE.Vector3();
			lookAtVec.subVectors(prevPos, pos);
			// multiplying by scalar yields desired result. but why???
			torus.lookAt(lookAtVec.multiplyScalar(10000));
			
			torus.position.copy(pos);
			torus.rotateOnAxis(zAxis, step * 0.01 + increment * i * 0.5);
			//let dr = 0.5 + 0.5 * Math.sin(step * 0.25);
			let s = 1 + 0.9 * Math.sin(i * 0.5 + step * 0.025);
			torus.scale.set(s, s, 1);
		}
	}

	const dim = 40;
	const planeGeom = new THREE.PlaneGeometry(10, 10, 10);
	const planeMat = new THREE.MeshBasicMaterial({
		map: testCamera.getCameraViewTexture(),
		side: THREE.DoubleSide
	});
	const planeMat2 = new THREE.MeshBasicMaterial({
		map: testCamera2.getCameraViewTexture(),
		side: THREE.DoubleSide
	});
	

	const planeNum = 20;
	const planePlacementAngleDiv = Math.PI * 2.0 / planeNum;
	const planePlacementRadius = 30;
	for (let i = 0; i < planeNum; i++){
		let p;
		if (Math.random() < 0.5){
			p = new THREE.Mesh(planeGeom, planeMat);
		}
		else p = new THREE.Mesh(planeGeom, planeMat2);
		p.receiveShadow = true;
		let rand = Math.random() * Math.PI * 2.0;

		p.position.set(planePlacementRadius * Math.cos(planePlacementAngleDiv * i), 
			Math.random() * 10 + 2, 
			planePlacementRadius * Math.sin(planePlacementAngleDiv * i));
		p.rotateY(Math.random() * Math.PI * 2.0);
		p.rotateZ(Math.random() * Math.PI * 2.0);
		
		scene.add(p);
	}

	const bufferGeometryUtils = new BufferGeometryUtils();
	const cubeArr = [];
	
	const cubeMat = new THREE.MeshNormalMaterial();
	
	const cubeNum = 3000;
	
	const xAxis = new THREE.Vector3(1, 0, 0);
	const yAxis = new THREE.Vector3(0, 1, 0);
	const zAxis = new THREE.Vector3(0, 0, 1);



	const shapeFunc1 = (x, y, z, steep) => (1000 / (10 + (Math.pow(x, steep) + Math.pow(y, steep) + Math.pow(z, steep))));
	for (let i = 0; i < cubeNum; i++){
		
		let cube;
		/*
		let rand = Math.random();
		if (rand < 0.6) cube = new THREE.Mesh(cubeGeom, cubeMat);
		else if (rand < 0.8) cube = new THREE.Mesh(cubeGeom, planeMat);
		else cube = new THREE.Mesh(cubeGeom, planeMat2);
		*/

		// without merged geometries

		/* 
		cube = new THREE.Mesh(cubeGeom, cubeMat);
		cube.position.set(Math.random() * dim - dim * 0.5, 0, Math.random() * dim - dim * 0.5);
		//cube.scale.set(Math.random() * 5, Math.random() * 10, Math.random() * 5);
		let scale = shapeFunc1(cube.position.x, cube.position.y, cube.position.z, 2);
		cube.scale.set(Math.random() * 5, Math.random() * scale, Math.random() * 5);
		cube.rotateOnAxis(yAxis, Math.random() * Math.PI);
		//scene.add(cube);
		*/

		// with merged geometries
		let xpos = Math.random() * dim - dim * 0.5;
		let ypos = 0;
		let zpos = Math.random() * dim - dim * 0.5;
		let scale = shapeFunc1(xpos, ypos, zpos, 2);
		//cube = new THREE.BoxGeometry(1, 1, 1);
		cube = new THREE.CylinderGeometry(1, 1, 1, Math.floor(Math.random() * 2 + 4))
		cube.translate(xpos, ypos, zpos);
		cube.scale(Math.random() * 5, Math.random() * scale, Math.random() * 5);
		cube.rotateY(Math.random() * Math.PI);
		if (i == 10) console.log(cube.attributes.position);
		cube.attributes.position.array.forEach(function(p){
			p = 0;
		});
		cube.attributes.position.needsUpdate = true;
		if (i == 10) console.log(cube.attributes.position);
		cubeArr.push(cube);
	}
	const cubeGeometries = BufferGeometryUtils.mergeBufferGeometries(cubeArr);
	const cubesMesh = new THREE.Mesh(cubeGeometries, standardMat);
	cubesMesh.receiveShadow = true;
	scene.add(cubesMesh);

	scene.add(testCamera.getMesh());
	scene.add(testCamera2.getMesh());
	
//LIGHTS

	
	const globalPointLight = new THREE.PointLight(0xffffff, 7, 0);
	const lightDistFromCenter = 100;
	
	globalPointLight.position.set(0, lightDistFromCenter, 0);
	globalPointLight.castShadow = true;
	globalPointLight.shadow.mapSize.set(512, 512);
	console.log(globalPointLight);
	//scene.add(light);
	//scene.add(light2);
	//scene.add(light3);
	//scene.add(light4);
	scene.add(globalPointLight);

// POST PROCESSING
	const renderPass = new RenderPass(scene, mainCamera);
	const smaaPass = new SMAAPass(window.innderWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
	const composer = new EffectComposer(renderer);

	composer.setSize(window.innerWidth, window.innerHeight);
	composer.addPass(renderPass);
	composer.addPass(smaaPass);
	
//GUI
	const gui = new dat.GUI();
	const controls = new function(){
		let cameraIndex = 0;
		this.debug = function(){
			console.log(globalPointLight.position);
		}

		this.switchCamera = function(){
			
			cameraIndex++;
			cameraIndex %= cameraArr.length;
			

			if (cameraIndex == 0) {
				mainCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
				mainCamera.position.set(0, 20, 100);
				orbitControls = new OrbitControls(mainCamera, renderer.domElement);
				orbitControls.enableDamping = true;

			}
			
			else {
				let temp = mainCamera;
				mainCameraCopy = temp;
				mainCamera = cameraArr[cameraIndex].getCamera();
			}
			
			
		}
	}

	
	gui.add(controls, 'debug');
	gui.add(controls, 'switchCamera');

	

	let tick = true;
	let incrementForTorusCam = 0.01;
	function render(time){
		time *= 0.001;
		step += 1;
		orbitControls.update();
		testCamera.updateCameraMeshRotation();
		testCamera.updateCameraPosition(60 *  Math.cos(step * 0.01), 60, 60 *  Math.sin(step * 0.01));
		testCamera.updateCameraLookAt(0, 0, 0);

		testCamera.renderOntoRenderTarget(renderer, scene);


		distortTorus();
		testCamera2.updateCameraMeshRotation();
		let newPos = getTorusPositionByIncrement(incrementForTorusCam * step * 0.5);
		let lookAtPos = getTorusPositionByIncrement(incrementForTorusCam * (step * 0.5 + 10));
		/*
		testCamera2.updateCameraPosition(30 *  Math.sin((step - 0.01) * 0.01), 5 * Math.sin((step * 5 - 0.01) * 0.01), 30 *  Math.cos((step - 0.01) * 0.01));
		testCamera2.updateCameraLookAt(30 *  Math.sin(step * 0.01), 5 * Math.sin(step * 5 * 0.01), 30 *  Math.cos(step * 0.01));
		*/
		testCamera2.updateCameraPosition(newPos.x, newPos.y, newPos.z);
		testCamera2.updateCameraLookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);
		testCamera2.renderOntoRenderTarget(renderer, scene);
		globalPointLight.position.copy(testCamera2.getCamera().position);
		
		
		/*
		torusArr.forEach(t => t.visible = false);
		let cubeCameraPos = new THREE.Vector3();
		cubeCameraPos.copy(mainCamera.position);
		cubeCameraPos.multiplyScalar(0.25);
		cubeCamera.position.copy(cubeCameraPos);
		cubeCamera.update(renderer, scene);
		torusArr.forEach(t => t.visible = true);
		*/

		cubesMesh.visible = false;
		let cubeCameraLookAt = new THREE.Vector3();
		cubeCameraLookAt.subVectors(cubeCamera.position, mainCamera.position);
		cubeCamera.position.set(0, 10, 0);
		cubeCamera.lookAt(cubeCameraLookAt);
		//cubeCamera.rotateY(Math.PI);
		cubeCamera.update(renderer, scene);
		cubesMesh.visible = true;
		

		/*
		torusArr.forEach(function (t){
			t.visible = false;
			cubeCamera.position.copy(t.position);
			cubeCamera.update(renderer, scene);
			t.visible = true;
		});
		*/
		if (resizeRenderToDisplaySize(renderer)){
			const canvas = renderer.domElement;
			mainCamera.aspect = canvas.clientWidth / canvas.clientHeight;
			mainCamera.updateProjectionMatrix();
		}
		
		renderer.setRenderTarget(null);
		renderer.clear();
		renderer.render(scene, mainCamera);
		

		//composer.render();
		
		requestAnimationFrame(render);
		

		
		
		/*
		cameraArr.forEach(function(c, i){
			if (i == 0){
				renderer.setViewport(0, 0, 0.5 * window.innerWidth, 1 * window.innerHeight);
				renderer.setScissor(0, 0, 0.5 * window.innerWidth, 1 * window.innerHeight);
				renderer.setScissorTest(true);
				renderer.setClearColor(scene.background);

				c.aspect = canvas.clientWidth / canvas.clientHeight;
				c.updateProjectionMatrix();
				renderer.render(scene, c);
			}
			else{
				renderer.setViewport(0.5 * window.innerWidth, 0, 0.5 * window.innerWidth, 1 * window.innerHeight);
				renderer.setScissor(0.5 * window.innerWidth, 0, 0.5 * window.innerWidth, 1 * window.innerHeight);
				renderer.setScissorTest(true);
				renderer.setClearColor(new THREE.Color(0xFFFFFF));

				c.aspect = canvas.clientWidth / canvas.clientHeight;
				c.updateProjectionMatrix();
				renderer.render(scene, c);
			}
		});
		requestAnimationFrame(render);
		*/
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