function main(){
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas});

	const fov = 75;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 1000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	camera.position.set(0, 50, 0);
	camera.up.set(0, 0, 1); // positive Z is the directional vector of the top of the camera
	camera.lookAt(0, 0, 0);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	renderer.render(scene, camera);

	{
		const color = 0xFFFFFF;
		const intensity = 3;
		const light = new THREE.PointLight(color, intensity);
		scene.add(light);
	}



	// array of objects whose rotation needs to be updated
	const objects = [];

	const solarSystem = new THREE.Object3D(); // a single local space
	scene.add(solarSystem);
	objects.push(solarSystem);

	const radius = 1;
	const widthSegments = 6;
	const heightSegments = 6;
	const sphereGeom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

	const sunMat = new THREE.MeshPhongMaterial({emissive: 0xFFFF00}); // emissive: color drawn without any light
	const sunMesh = new THREE.Mesh(sphereGeom, sunMat);
	sunMesh.scale.set(5, 5, 5);
	//scene.add(sunMesh);
	solarSystem.add(sunMesh);
	objects.push(sunMesh);

	const earthOrbit = new THREE.Object3D();
	earthOrbit.position.x = 10;
	solarSystem.add(earthOrbit);
	objects.push(earthOrbit);

	const earthMat = new THREE.MeshPhongMaterial({color: 0x2233FF, emissive: 0x112244});
	const earthMesh = new THREE.Mesh(sphereGeom, earthMat);
	//earthMesh.position.x = 10;
	earthOrbit.add(earthMesh);
	objects.push(earthMesh);
	// adding earthMesh to sunMesh renders the former as a child of the latter.
	// since sunMesh's scale is set to 5x, the same applies to earthMesh as well.
	// Root(scene) --> sunMesh(5x) --> earthMesh
	
	//sunMesh.add(earthMesh);
	//scene.add(earthMesh);
	//solarSystem.add(earthMesh);
	//objects.push(earthMesh);

	const moonOrbit = new THREE.Object3D();
	moonOrbit.position.x = 2; // translate about the parent's (earthOrbit) local space
	earthOrbit.add(moonOrbit);

	const moonMat = new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
	const moonMesh = new THREE.Mesh(sphereGeom, moonMat);
	moonMesh.scale.set(0.5, 0.5, 0.5);
	moonOrbit.add(moonMesh);
	objects.push(moonMesh);
	
	const gui = new dat.GUI();
	const controls = new function(){
		this.outputObj = function(){
			scene.children.forEach(c => console.log(c));
		}
	}
	gui.add(controls, 'outputObj');

	function render(time){
		time *= 0.001;
		// make each object rotate about the y axis of its and parents' local space
		objects.forEach(obj => obj.rotation.y = time); 
	
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