import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

function main(){
// P5 SKETCH
	const p5Sketch = (sketch) => {

		let width;
		let height;
		let font;
		let textSize;
		let mainText;
		let mainTextPosx;
        sketch.setup = () => {
        	sketch.createCanvas(400, 400);
        	
        	width = sketch.width;
        	height = sketch.height;

        	textSize = height * 0.5;
        	font = sketch.loadFont('assets/Hahmlet-ExtraBold.ttf', sketch.drawText);
        	
        	sketch.textSize(textSize);
        	//sketch.textAlign(sketch.CENTER);

        	mainText = "환자의 용태에 관한 문제";
        	mainTextPosx = 0;
		}
		sketch.draw = () => {
			if (p5Texture) p5Texture.needsUpdate = true;
			sketch.background(255);

			/*
			sketch.push();
			sketch.rectMode(sketch.CENTER);
			sketch.translate(width * 0.5, height * 0.5);
			sketch.rotate(sketch.frameCount * 0.01);
			sketch.strokeWeight(10);
			sketch.rect(0, 0, width * 0.5, height * 0.5);	
			sketch.pop();
			*/
			
			try{
				let stringWidth = font.textBounds(mainText).w;
				if (mainTextPosx < -stringWidth) mainTextPosx = width;
			}catch{}
			mainTextPosx -= 2;
			sketch.text(mainText, mainTextPosx, height * 0.65);
		}

		sketch.drawText = (f) => {
			sketch.textFont(f, textSize);
		}

		
    };

    const p5Canvas = new p5(p5Sketch);
	const p5Texture = new THREE.CanvasTexture(p5Canvas.canvas);
	p5Texture.wrapS = THREE.RepeatWrapping;
	p5Texture.wrapT = THREE.RepeatWrapping;
	p5Texture.needsUpdate = true;
	//p5Canvas.canvas.style.display = "none";
	
//CANVAS AND RENDERER 
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
	let step = 0;
//RAYCASTER
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
//TEXTURES
	const textureLoader = new THREE.TextureLoader();
	/*
	textureArr[n] : ARRAY OF 11 TEXTURES OF THE NUMBER 'n-1' (n < 10)
	textureArr[10] : ARRAY OF 11 DOT TEXTURES
	*/ 
	const textureArr = [];
	const selectedTextures = [];
	selectedTextures[10] = 0;
	console.log(selectedTextures);
	let fileName;

	// numbers
	for (let i = 0; i < 10; i++){
		let numTexArr = [];
		for (let j = 0; j <= 10; j++){
			if (j == 10) fileName = "img/n" + i.toString() + j.toString() + ".png";
			else fileName = "img/n" + i.toString() + "0" + j.toString() + ".png";
			let texture =  textureLoader.load(fileName);
			//texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.NearestFilter;
			numTexArr.push(texture);
		}
		textureArr.push(numTexArr);
	}

	// dots
	let dotTexArr = [];
	for (let i = 0; i <= 10; i++){
		if (i == 10) fileName = "img/d0" + i.toString() + ".png";
		else fileName = "img/d00" + i.toString() + ".png";
		let texture =  textureLoader.load(fileName);
		//texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		dotTexArr.push(texture);
	}
	textureArr.push(dotTexArr);

	const backgroundTexture = textureLoader.load('img/backgroundTexture.png');
	const titleTexture = textureLoader.load('img/title.png');
	const debugTex = textureLoader.load('test.jpg');
	

//CAMERA
	const fov = 75;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 1000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(0, 0, 10);


	const orbitControls = new OrbitControls(camera, renderer.domElement);
	orbitControls.update();

	const scene = new THREE.Scene();
	scene.background = backgroundTexture;
	renderer.render(scene, camera);


//GEOMETRIES
	const planeGeom = new THREE.PlaneGeometry(20, 20, 100, 100);
	//planeGeom.rotateX(-Math.PI * 0.9);
	const shaderMaterial = new THREE.ShaderMaterial({
		uniforms:{
			mainTexture: {value: p5Texture},
			testTex: {value: textureArr[1][2]},
			selectedTextures: {value: selectedTextures},
			
			sideTileNum: {value: 50.0},
			time: {value: step},
			
		},

		vertexShader: document.getElementById('vertexShader').textContent,

		fragmentShader: document.getElementById('fragmentShader').textContent,

		side: THREE.DoubleSide,
		//wireframe: true
	});

	// material for the title pannel
	const shaderMaterial2 = new THREE.ShaderMaterial({
		uniforms:{
			titleTexture: {value: titleTexture},
			time: {value: step},
		},

		vertexShader: document.getElementById('titleVertexShader').textContent,

		fragmentShader: document.getElementById('titleFragmentShader').textContent,

		side: THREE.DoubleSide,
		//wireframe: true
	});

	const mainPlane = new THREE.Mesh(planeGeom, shaderMaterial);
	mainPlane.position.set(0, 0, -3);
	scene.add(mainPlane);

	const titlePlaneGeom = new THREE.PlaneGeometry(7, 20);
	titlePlaneGeom.rotateX(Math.PI * 0.5);
	titlePlaneGeom.translate(0, -5, 10);

	titlePlaneGeom.scale(0.25, 0.25, 0.25);
	

	const titleMesh = new THREE.Mesh(titlePlaneGeom, shaderMaterial2);

	scene.add(titleMesh);

	// the scene is rotated, which means 
	// y axis: points towards the back of the screen
	// z axis: points towards the top of the screen
	scene.rotateX(-Math.PI * 0.5);

//GUI
/*
	const gui = new dat.GUI();
	const controls = new function(){
		this.outputObj = function(){
			scene.children.forEach(c => console.log(c));
		}
	}
	gui.add(controls, 'outputObj');
*/


	function render(time){
		time *= 0.001;
		step++;
		updateRaycaster();
		if (step % 3 == 0)selectRandomTextures();

		// update shader uniforms
		mainPlane.material.uniforms.time.value = step * 0.01;
		titleMesh.material.uniforms.time.value = step * 0.01;
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

	function selectRandomTextures(){
		let randomIndex;
		for (let i = 0; i < 11; i++){
			randomIndex = Math.floor(Math.random() * 11);
			selectedTextures[i] = textureArr[i][randomIndex];
		}
	}

	function onMouseMove(event){
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	}

	function updateRaycaster(){
		raycaster.setFromCamera(mouse, camera);
		const intersects = raycaster.intersectObjects(scene.children);
		for (let i = 0; i < intersects.length; i++){
			
		
		}
		
	}
	requestAnimationFrame(render);

	window.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('mousedown', event =>{
		//console.log("HEY");
		canvas.webkitRequestFullscreen();
	});
}

window.onload = main;