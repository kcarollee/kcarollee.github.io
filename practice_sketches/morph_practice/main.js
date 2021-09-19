import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

function main(){
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas});

//CAMERA
	const fov = 75;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 1000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	const orbitControls = new OrbitControls(camera, renderer.domElement);
	orbitControls.update();
	camera.position.set(0, 0, 20);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xCCCCCC);
	renderer.render(scene, camera);

//GEOMETRIES

	const sphereGeom = new THREE.SphereGeometry(5, 32, 32);
	const morphToGeom = new THREE.PlaneGeometry(10, 10, 2, 2);
	sphereGeom.morphAttributes.position = [];
	const initialSpherePosAttribute = sphereGeom.attributes.position;
	const morphToPosAttribute = morphToGeom.attributes.position;
	const morphToVerticesNum = morphToPosAttribute.length / 3;
	console.log(morphToVerticesNum);
	const morphToVertArr = [];
	for (let i = 0; i < morphToVerticesNum; i++){

	}

	console.log(morphToPosAttribute);
	const sphereMorphPositions = [];
	// for all the initial positionAttributes
	for (let i = 0; i < initialSpherePosAttribute.count; i++){
		
		let x = initialSpherePosAttribute.getX(i);
		let y = initialSpherePosAttribute.getY(i);
		let z = initialSpherePosAttribute.getZ(i);
		


		// find the vertex in morphToGeom that's the closest
		let min = 999999;
		let mx, my, mz;
		let rx, ry, rz; // results coordinates
		let distSquared;
		for (let j = 0; j < morphToPosAttribute.count; j++){
			mx = morphToPosAttribute.getX(j);
			my = morphToPosAttribute.getY(j);
			mz = morphToPosAttribute.getZ(j);

			let dx = mx - x;
			let dy = my - y;
			let dz = mz - z;

			distSquared	= dx * dx + dy * dy + dz * dz;
			if (distSquared < min){
				min = distSquared;
				rx = mx;
				ry = my;
				rz = mz;
			}
		}
		sphereMorphPositions.push(rx, ry, rz);
	}

	sphereGeom.morphAttributes.position[0] = new THREE.Float32BufferAttribute(sphereMorphPositions, 3);

	const normalMat = new THREE.MeshNormalMaterial({
		morphTargets: true,
		wireframe: true
	});

	const sphereMesh = new THREE.Mesh(sphereGeom, normalMat);
	scene.add(sphereMesh);
	
//GUI
	const gui = new dat.GUI();
	const controls = new function(){
		this.outputObj = function(){
			scene.children.forEach(c => console.log(c));
		}

		this.wireframe = function(){
			sphereMesh.material.wireframe = !sphereMesh.material.wireframe;
		}
	}
	gui.add(controls, 'outputObj');
	gui.add(controls, 'wireframe');


	function render(time){
		time *= 0.001;
		sphereMesh.morphTargetInfluences[0] = 0.5 + 0.5 * Math.sin(time * 2.0);
		if (resizeRenderToDisplaySize(renderer)){
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}
		renderer.render(scene, camera);
		requestAnimationFrame(render);
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