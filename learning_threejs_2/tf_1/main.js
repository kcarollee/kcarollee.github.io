function main(){
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas});

	const fov = 75;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 5;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	camera.position.set(0, 0, 2);

	const scene = new THREE.Scene();

	const boxWidth = 1;
	const boxHeight = 1;
	const boxDepth = 1;
	const geom = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
	//const mat = new THREE.MeshBasicMaterial({color: 0x44aa88}); //  basic mat is not affected by lights
	/*
	const phongMat = new THREE.MeshPhongMaterial({color: 0x44aa88});
	const cube = new THREE.Mesh(geom, phongMat);
	scene.add(cube);
	*/

	const cubes = [
		makeInstance(geom, 0x44aa88, 0),
		makeInstance(geom, 0x8844aa, -2),
		makeInstance(geom, 0xaa8844, 2)
	];
	const color = 0xFFFFFF;
	const intensity = 1;
	const light = new THREE.DirectionalLight(color, intensity);
	light.position.set(-1, 2, 4); // slightly on the left, above and behind the camera
	scene.add(light);

	renderer.render(scene, camera);

	function render(time){
		time *= 0.001;
		/*
		cube.rotation.x = time;
		cube.rotation.y = time;
		*/
		cubes.forEach(function(cube, index){
			const speed = 1 + index * 0.1;
			const rot = time * speed;
			cube.rotation.x = rot;
			cube.rotation.y = rot;
		});
		renderer.render(scene, camera);

		requestAnimationFrame(render);
	}

	// using the same geometry with different materials
	function makeInstance(geometry, color, x){		
		const mat = new THREE.MeshPhongMaterial({color});
		const cube = new THREE.Mesh(geometry, mat);
		scene.add(cube);
		cube.position.x = x;
		return cube;
	}
	requestAnimationFrame(render);
}

main();