function main(){
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas});

	const fov = 75;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 1000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	camera.position.set(0, 0, 20);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xFFAAAA);
	renderer.render(scene, camera);


	const gui = new dat.GUI();
	const controls = new function(){
		this.outputObj = function(){
			scene.children.forEach(c => console.log(c));
		}

		this.current = "box";

		this.boxParams = {
			width: 8,
			height: 8,
			depth: 8
		}

		this.circleParams = {
			radius: 7,
			segments: 24,
			thetaStart: Math.PI * 0.25,
			thetaLength: Math.PI * 1.5
		}

		this.icoParams = {
			radius: 7,
			detail: 2
		}
	}
	gui.add(controls, 'outputObj');
	gui.add(controls, 'current', ["box", "circle", "ico"]).onChange(function (e){
		switch(e){
			case "box":
				currentMesh.visible = false;
				currentMesh = scene.children[0];
				currentMesh.visible = true;
				break;
			case "circle":
				currentMesh.visible = false;
				currentMesh = scene.children[1];
				currentMesh.visible = true;
				break;
			case "ico":
				currentMesh.visible = false;
				currentMesh = scene.children[2];
				currentMesh.visible = true;
		}
	});	


	let currentMesh;


	const mat = new THREE.MeshNormalMaterial();

	//---------------------BOXGEOMETRY----------------------------
	{
		const params = controls.boxParams;
		const boxGeom = new THREE.BoxGeometry(params.width, 
										params.height, 
										params.depth);
		const box = new THREE.Mesh(boxGeom, mat);
		currentMesh = box;
		scene.add(box);

		const boxFolder = gui.addFolder('BoxGeometry');
		boxFolder.add(params, 'width', 1, 10).onChange(e => updateGeometry(box, new THREE.BoxGeometry(params.width, 
		params.height, params.depth)));
		boxFolder.add(params, 'height', 1, 10).onChange(e => updateGeometry(box, new THREE.BoxGeometry(params.width, 
		params.height, params.depth)));
		boxFolder.add(params, 'depth', 1, 10).onChange(e => updateGeometry(box, new THREE.BoxGeometry(params.width, 
		params.height, params.depth)));
	}
	//------------------------------------------------------
	//-------------------CIRCLEGEOMETRY--------------------------
	{
		const params = controls.circleParams;
		const circleGeom = new THREE.CircleGeometry(params.radius, params.segments);
		const circle = new THREE.Mesh(circleGeom, mat);
		circle.visible = false;
		scene.add(circle);

		const circleFolder = gui.addFolder('CircleGeometry');
		circleFolder.add(params, 'radius', 1, 10).onChange(e => updateGeometry(circle, new THREE.CircleGeometry(params.radius, params.segments,
		params.thetaStart, params.thetaLength)));
		circleFolder.add(params, 'segments', 1, 50).onChange(e => updateGeometry(circle, new THREE.CircleGeometry(params.radius, params.segments,
		params.thetaStart, params.thetaLength)));
		circleFolder.add(params, 'thetaStart', 0, Math.PI * 2.0).onChange(e => updateGeometry(circle, new THREE.CircleGeometry(params.radius, params.segments,
		params.thetaStart, params.thetaLength)));
		circleFolder.add(params, 'thetaLength', 0, Math.PI * 2.0).onChange(e => updateGeometry(circle, new THREE.CircleGeometry(params.radius, params.segments,
		params.thetaStart, params.thetaLength)));
	}
	//-----------------------------------------------------------
	//-------------------ICOSAHEDRONGEOMETRY----------------------
	{
		const params = controls.icoParams;
		const icoGeom = new THREE.IcosahedronGeometry(params.radius, params.detail);
		const ico = new THREE.Mesh(icoGeom, mat);
		ico.visible = false;
		scene.add(ico);

		const icoFolder = gui.addFolder('IcosahedronGeometry');
		icoFolder.add(params, 'radius', 1, 10).onChange(e => updateGeometry(ico, new THREE.IcosahedronGeometry(params.radius, params.detail)));
		icoFolder.add(params, 'detail', 1, 5).step(1).onChange(e => updateGeometry(ico, new THREE.IcosahedronGeometry(params.radius, params.detail)));
	}

	//----------------------------------------------------------

	

	function render(time){
		time *= 0.001;
		animateMesh(currentMesh, time);
		if (resizeRenderToDisplaySize(renderer)){
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}
		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}

	function animateMesh(mesh, time){
		mesh.rotation.x = time;
		mesh.rotation.y = time;
	}

	function updateGeometry(mesh, geometry){
		mesh.geometry.dispose();
		mesh.geometry = geometry;
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