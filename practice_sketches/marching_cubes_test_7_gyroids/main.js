import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
let step = 0;
let scene;
let seedAlt = 0;
let stats;
let texture;
let vertShader, fragShader;
let uniforms;
let thresholdGlobal = 0.65;

function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}
function mix(x, y, k){
	return x * (1.0 - k) + y * k;
}
function clamp(x, min, max){
	return Math.min(Math.max(x, min), max);
}
function smoothUnion(x, y, k){
	let h = clamp(0.5 + 0.5 * (y - x) / (1 - k), 0, 1);
	return mix(x, y, h) - (1 - k) * h * (1.0 - h);
}

class Cube{
    constructor(centerX, centerY, centerZ, w, h, d){
    	this.centerX = centerX;
    	this.centerY = centerY;
    	this.centerZ = centerZ;
    	this.cubeVertArr = []; // [x0, y0, z0, x1, y1, z1..., x7, y7, z7]



    	this.width = w;
    	this.height = h;
    	this.depth = d;

    	/*****************
		  4________5
		 /		   /
		7_________6 |
		|         | |
		| 0________1
		|/		  |/
		3_________2
			
		0: left down back   | cx-hw cy-hh cz-hd
		1: right down back  | cx+hw cy-hh cz-hd 
		2: right down front | cx+hw cy-hh cz+hd
		3: left down front  | cx-hw cy-hh cz+hd
		4: left up back     | cx-hw cy+hh cz-hd
		5: right up back    | cx+hw cy+hh cz-hd
        6: right up front   | cx+hw cy+hh cz+hd
        7: left up front    | cx-hw cy+hh cz+hd

        testing should be done in a decreasing order to create the correct configIndex.
    	******************/

    	this.configIndex = 0; // index in the triangulation table
    	this.triangulationEdgeIndices;

    	this.empty = false;

    	this.normalsCount = 0;
    	this.prevVertInHashMap = false;

    	this.id = ++Cube.id;
    }

    hashFunc(){

    }

    setCubeCorners(){
    	// half width, height, depth
    	let hw = this.width * 0.5;
    	let hh = this.height * 0.5;
    	let hd = this.depth * 0.5;
    	let mult = [
    		-1, -1, -1,
    		1, -1, -1,
    		1, -1, 1,
    		-1, -1, 1,
    		-1, 1, -1,
    		1, 1, -1,
    		1, 1, 1,
    		-1, 1, 1
    	];
    	for (let i = 0; i < 24; i++){
    		switch(i % 3){
    			// push xpos of the corner
    			case 0:
    				let x = this.centerX + mult[i] * hw;
    				this.cubeVertArr.push(x);
    				break;
    			// push ypos of the corner
    			case 1:
    				let y = this.centerY + mult[i] * hh;
    				this.cubeVertArr.push(y);
    				break;
    			// push zpos of the corner
    			case 2:
    				let z = this.centerZ + mult[i] * hd;
    				this.cubeVertArr.push(z);
    				break;
    		}
    	}
    }


    // f is a shape function that takes x, y, z as arguments
    // threshold is a threshold value over which we define as being 'inside' (1)
    // if f is a perlin noise function, it yields a value between -1 and 1.
    setConfigIndex(f, threshold){
    	// start from vert # 7 since that's how the configIndex is generated.
    	for (let i = 7; i > -1; i--){
    		let x = this.cubeVertArr[i * 3];
    		let y = this.cubeVertArr[i * 3 + 1];
    		let z = this.cubeVertArr[i * 3 + 2];
    		if (f(x, y, z) > thresholdGlobal) {
    			this.configIndex |= 1 << i;
    		}
    	}
    	

    	// set the array of triangulation edge indices based on the configIndex.
    	this.triangulationEdgeIndices = Cube.triangulationTable[this.configIndex];
    }

    setMeshVertices(f, threshold, interpolate, hashMap, vertices,  indices, index, useDifferentHashFunc = false, funcIndex = 0){
    	let tempForNormals = [];
    	for (let i = 0; i < 16; i++){
    		if (this.triangulationEdgeIndices[i] == -1){
    			if (i == 0) {
    				this.empty = true;
    				break;
    			}
    			break;
    		} 
    		
    		// 1. get edge index in triEdgeIndices 
    		let edgeIndex = this.triangulationEdgeIndices[i];
    		
    		// 2. use Cube.edgeToVerticesIndices to determine which two vertices the edge is in between
    		let vertIndices = Cube.edgeToVerticesIndices[edgeIndex];
    		let vertIndex1 = vertIndices[0];
    		let vertIndex2 = vertIndices[1];

    		let v1x = this.cubeVertArr[vertIndex1 * 3];
    		let v1y = this.cubeVertArr[vertIndex1 * 3 + 1];
    		let v1z = this.cubeVertArr[vertIndex1 * 3 + 2];

    		let v2x = this.cubeVertArr[vertIndex2 * 3];
    		let v2y = this.cubeVertArr[vertIndex2 * 3 + 1];
    		let v2z = this.cubeVertArr[vertIndex2 * 3 + 2];

    		
    		// coordinates of the point between the two vertices
    		let mx, my, mz;
    		
    		// hash value. 
    		let hn;
    		// THIS IS PERFECT HASHING, as in this function gaurantees that every vertex is paired with an unique index. 
    		if (!useDifferentHashFunc) hn = this.id * 10000000 + edgeIndex;
    		// the functions below yields overlapping values for some of the vertices, resulting in distorted shapes.
    		else {
    			let hx, hy, hz;
    			hx = v1x + v2x;
    			hy = v1y + v2y;
    			hz = v1z + v2z;
    			switch(funcIndex){
    				case 0:
    					hn = noise.simplex3(hx * 0.0001, hy * 0.0001, hz * 0.0001);
    					break;
    				case 1:
    					hn = hx * hy * hz;
    					break;
    				case 2:
    					hn = noise.simplex2(hx * 0.001, hy * 0.001) + noise.simplex2(hy * 0.001, hz * 0.001);
    					break;
    				case 3:
    					hn = noise.simplex2(hx * 0.001, hy * 0.001) * noise.simplex2(hy * 0.001, hz * 0.001);
    					break;
    			}
    		}

    		// if the vertex hasn't been used yet, push the vertex to the vertices array
    		// push the index into the indices array and increment it.
    		if (!hashMap.has(hn)){    			
    			// 3. get the intepolated point between the two vertices
    			if (interpolate){
    				let v1f = f(v1x, v1y, v1z);
    				let v2f = f(v2x, v2y, v2z);
    				let r = v1f < v2f ?
    				mapLinear(thresholdGlobal, v1f, v2f, 0, 1) : 
    				mapLinear(thresholdGlobal, v2f, v1f, 0, 1);
    			
    				if (v1f < v2f){
    					mx = v1x + (v2x - v1x) * r;
    					my = v1y + (v2y - v1y) * r;
    					mz = v1z + (v2z - v1z) * r;
    				}

    				else{
    					mx = v2x + (v1x - v2x) * r;
    					my = v2y + (v1y - v2y) * r;
    					mz = v2z + (v1z - v2z) * r;
    				}
    			}
    			// 3.5 else get the midpoint of the two vertices
    			else{
    				mx = (v1x + v2x) * 0.5;
					my = (v1y + v2y) * 0.5;
					mz = (v1z + v2z) * 0.5;
    			}
    			hashMap.set(hn, {index: index.getValue()});
    			vertices.push(mx, my, mz);
    			indices.push(index.getValue());
    			index.increment();
    		}
    		// else the vertex has been used. 
    		// no need to push the vertex to the vertices array -> solves the redundancy issue
    		// push the index of the corresponding vertex into the indices array
    		else indices.push(hashMap.get(hn).index);
    	}

    }

    reset(){
    	this.empty = false;
    	this.configIndex = 0;
    	this.normalsCount = 0;
    	
    }
    getMeshGeometry(){
    	return this.mesh.geometry;
    }
}

Cube.edgeIndices = edgeIndices;
Cube.triangulationTable = triangulationTable;
Cube.edgeToVerticesIndices = [
	[0, 1], // edge number 0 is between vert0 & vert1
	[1, 2], // edge number 1 is between vert1 & vert2
	[2, 3], // edge number 2
	[3, 0], // edge number 3 
	[4, 5], // edge number 4
	[5, 6], // edge number 5
	[6, 7], // edge number 6
	[7, 4], // edge number 7
	[0, 4], // edge number 8
	[1, 5], // edge number 9
	[2, 6], // edge number 10
	[3, 7]  // edge number 11
];	
Cube.uvs = [
	0, 0,
	0, 1,
	1, 1,
	1, 0
];
Cube.id = 0;


class MarchingCubes{
	// test space w, h, d & single cube w, h, d & centerx, centery, centerz
	constructor(tw, th, td, sw, sh, sd, cx, cy, cz, shapeFunc, threshold, matIndex){

		this.testSpace = {
			width: tw,
			height: th,
			depth: td
		}

		this.singleCubeParams = {
			width: sw,
			height: sh,
			depth: sd
		}

		this.centerX = cx;
		this.centerY = cy;
		this.centerZ = cz;

		this.shapeFunc = shapeFunc;
		this.threshold = threshold;

		this.hashMap = new Map();
		this.vertices = [];
		this.indices = [];
		this.uvs = [];

		this.indexCount = new IndexObject(0);

		this.marchingCubes = [];
		this.initCubes();
		
		this.marchingCubesMesh;
		this.setCubes();

	
		this.materialArr = [
			new THREE.MeshNormalMaterial({
                side: THREE.DoubleSide,
                //wireframe: true
			}),

			// when using envMap, TURN OFF THREE.DOUBLESIDE

			new THREE.MeshBasicMaterial({ 
				transparent: false, 
				opacity: 0.7, 
				refractionRatio: 0.9,
				//side: THREE.DoubleSide,
				wireframe: false,
				
				//flatShading: true
			}),

			new THREE.MeshLambertMaterial({
			 	color: 0xFFFFFF * Math.random(),
			 	side: THREE.DoubleSide
			}),

			new THREE.ShaderMaterial({
			 	uniforms: uniforms,
			 	vertexShader: vertShader,
			 	fragmentShader: fragShader,
			 	//side: THREE.DoubleSide
			}),
		];

		this.material = this.materialArr[matIndex];

		this.interpolate = true;

		this.id = ++MarchingCubes.id;


		this.totalGeom;
		this.useDifferentHashFunc = false;
		this.hashFuncIndex = 0;

		this.addedToScene = false; // set to true as soon as mesh is added to scene
	}

	updateShaderMaterial(){
        if (this.material instanceof THREE.ShaderMaterial){
		    let ref = scene.getObjectByName("marchingCubesMesh" + this.id);
            ref.material.uniforms.time.value = step * 0.01;
            
        }
	}


	initCubes(){
		let testSpace = this.testSpace;
		let singleCubeParams = this.singleCubeParams;

		let wStart = testSpace.width * -0.5 + this.centerX;
		let wEnd = testSpace.width * 0.5 + this.centerX;

		let hStart = testSpace.height * -0.5 + this.centerY;
		let hEnd = testSpace.height * 0.5 + this.centerY;

		let dStart = testSpace.depth * -0.5 + this.centerZ;
		let dEnd = testSpace.depth * 0.5 + this.centerZ;
		
		for (let h = hStart; h < hEnd; h += singleCubeParams.height){
			for (let d = dStart; d < dEnd; d += singleCubeParams.depth){
				for (let w = wStart; w < wEnd; w += singleCubeParams.width){
					let cube = new Cube(w, h, d, singleCubeParams.width, singleCubeParams.height, singleCubeParams.depth);
					this.marchingCubes.push(cube);
				}
			}	
		}
	}

	setCubes(){
		this.marchingCubes.forEach(function(c){
			c.setCubeCorners();
		});
	}

	updateCubes(){
		
		
		let func = this.shapeFunc;
		let interpolate = this.interpolate;
		let threshold = this.threshold;
		let hashMap = this.hashMap;
		let vertices = this.vertices;
		let indices = this.indices;
		let index = this.indexCount;
		let uvs = this.uvs;
		let useDifferentHashFunc = this.useDifferentHashFunc;
		let hashFuncIndex = this.hashFuncIndex;
		

		// note that the vertices and indices arrays are passed as arguments to the cubes, but not the uv array.
		// the uv array is filled AFTER vertices and indices are calculated. 
		this.marchingCubes.forEach(function(c){
			c.reset();
			c.setConfigIndex(func, threshold);
			c.setMeshVertices(func, threshold, interpolate, hashMap, 
				vertices, indices, index, 
				useDifferentHashFunc, hashFuncIndex);
		});

			
		let vertFloat = new Float32Array(this.vertices);
		let uvFloat = new Float32Array(this.uvs);
		// this is the best i could do for now for optimization.
		if (!this.addedToScene) {
			this.totalGeom = new THREE.BufferGeometry();
			this.totalGeom.setAttribute('position', new THREE.BufferAttribute(vertFloat, 3));
			this.totalGeom.setAttribute('uv', new THREE.BufferAttribute(uvFloat, 2));
			this.totalGeom.setIndex(this.indices);
			this.totalGeom.computeVertexNormals();
			this.marchingCubesMesh = new THREE.Mesh(this.totalGeom, this.material);
			this.marchingCubesMesh.name = "marchingCubesMesh" + this.id;
			scene.add(this.marchingCubesMesh);
			this.addedToScene = true;

			this.totalGeom.dispose();
			this.material.dispose();
		}
		else{
			let ref = scene.getObjectByName("marchingCubesMesh" + this.id); // reference to the mesh in scene
			
			ref.geometry = new THREE.BufferGeometry();
			ref.geometry.setAttribute('position', new THREE.BufferAttribute(vertFloat, 3));
			

			// push only the x and y coordinates of the position array.
			let u = this.uvs;
			let testSpace = this.testSpace;
			ref.geometry.attributes.position.array.forEach(function(n, i){
				switch(i % 3){
					case 0: // x
						u.push(mapLinear(n, -testSpace.width * 0.5, testSpace.width * 0.5, 0.0, 1.0)); 
						break;
					case 2: // y
						u.push(mapLinear(n, -testSpace.height * 0.5, testSpace.height * 0.5, 0.0, 1.0)); 
						break;
				}
			});
			uvFloat = new Float32Array(this.uvs);
			ref.geometry.setAttribute('uv', new THREE.BufferAttribute(uvFloat, 2));

			ref.geometry.setIndex(this.indices);
			// COMPUTE VERTICES AFTER SETTING THE INDICES
			ref.geometry.computeVertexNormals();
			
			ref.geometry.attributes.position.needsUpdate = true;
			ref.geometry.attributes.normal.needsUpdate = true;
			ref.geometry.attributes.uv.needsUpdate = true;

			// disposing the material after being done with it is also a must.
			ref.geometry.dispose();
			ref.material.dispose();
		}


		// resetting attributes
		this.hashMap.clear();
		this.vertices = [];
		this.indices = [];
		this.uvs = [];
		this.indexCount.reset();	
	}

	// use this for instances that aren't updated every frame
	manageResources(){	
		this.marchingCubesMesh.geometry.dispose();
		this.marchingCubesMesh.material.dispose();
	}

	setVisiblility(c){
		this.marchingCubesMesh.visible = c;
	}

	useDifferentHashFunc(){
		this.useDifferentHashFunc = true;
	}

	useDefaultHashFunc(){
		this.useDefaultHashFunc = false;
	}

	getMesh(){
		return this.marchingCubesMesh;
	}


	setShapeFunc(newFunc){
		this.shapeFunc = newFunc;
	}

	setThreshold(newThreshold){
		this.threshold = newThreshold;
	}

	setMaterial(newMat){
		this.getMesh().material = newMat;
		this.getMesh().material.needUpdate = true;
	}

}

MarchingCubes.id = 0;



class IndexObject{
	constructor(i){
		this.value = i;
	}
	increment(){
		this.value++;
	}
	getValue(){
		return this.value;
	}
	reset(){
		this.value = 0;
	}
}

let p5texture;
let p5Font;
let p5Canvas;
function main(){
   
	//initStats();
// P5 SKETCH
	const p5Sketch = (sketch) => {

		let textSize = 130;
		let mainFont;
		let stringNum = 8;
		let p5Shader;
		let texImage;

        sketch.setup = () => {
        	
			sketch.createCanvas(window.innerWidth, window.innerHeight, sketch.WEBGL);
			sketch.textSize(textSize);
			mainFont = sketch.loadFont('helvetica_bold.ttf', sketch.drawText);
			p5Shader = sketch.loadShader('p5VertShader.vert', 'p5FragShader.frag', sketch.getShader);
			texImage = sketch.loadImage('testTex.png', sketch.getImage);
			texImage.resize(512, 512);
			sketch.textureWrap(sketch.REPEAT);
			
		}
		sketch.draw = () => {
			try{
				p5Shader.setUniform('resolution', [sketch.width, sketch.height]);
                p5Shader.setUniform('time', sketch.frameCount * 0.03);
				p5Shader.setUniform('tex', texImage);
				p5Shader.setUniform('mouse', [sketch.mouseX/sketch.width, sketch.mouseY/sketch.height]);
                sketch.shader(p5Shader);
				sketch.quad(-1, -1, 1, -1, 1, 1, -1, 1);

				sketch.text("HELLO", 0, 0);
				//console.log(sketch.mouseX, sketch.mouseY);
           	} catch{}
			if (p5texture) p5texture.needsUpdate = true;
		}

		sketch.windowResized = () => {
			sketch.resizeCanvas(window.width, window.height);
			sketch.createCanvas(window.innerWidth, window.innerHeight);
			 p5texture.needsUpdate = true;
		}

		// use callbacks instead of async functions to load assets.

		sketch.drawText = (f) => {
			sketch.textFont(f, textSize);
		}

		sketch.getShader = (s) => {
			sketch.shader(s);
		}

		sketch.getImage = (i) =>{
			sketch.image(i, 0, 0);
		}
    };
// NOISE
	noise.seed(Math.random());

	p5Canvas = new p5(p5Sketch);
	p5texture = new THREE.CanvasTexture(p5Canvas.canvas);
	
	p5texture.needsUpdate = true;
	p5texture.wrapS = THREE.RepeatWrapping;
	p5texture.wrapT = THREE.RepeatWrapping;
	// this hides the p5 canvas
	p5Canvas.canvas.style.display = "none";

// SHADERS
	vertShader = document.getElementById('vert').innerHTML;
	fragShader = document.getElementById('frag').innerHTML;
	uniforms = {
		time: {type: 'f', value: 0.0},
		resolution: {type: 'v2', value: new THREE.Vector2()},
		tex: {type: 't', value: p5texture}
	}
	uniforms.resolution.value.x = window.innerWidth;
	uniforms.resolution.value.y = window.innerHeight;
// TEST SHAPE FUNCTIONS
	let smoothUnionVal = 0.1;
	const noiseFunc1 = (x, y, z) =>{
		let nx = 0.05;
		let ny = 0.05;
		let nz = 0.05;


		
		let n = noise.simplex3(x * nx + step * 0.003, y * ny + step * 0.003, z * nz + step * 0.003);
		
		return n;
	}

	

	
// METABALL
// check out the following link:
// https://takumi0125.github.io/threejsMarchingCubesMetaball/
// check out the addBall function in the following link:
// https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/objects/MarchingCubes.js
	class MetaBall{
		constructor(centerX, centerY, centerZ, radius){
			this.centerX = centerX;
			this.centerY = centerY;
			this.centerZ = centerZ;
			this.initX = centerX;
			this.initY = centerY;
			this.initZ = centerZ;
			this.radius = radius;
			this.initR = radius;
			this.randX = Math.random() * 10;
			this.randY = Math.random() * 10;
			this.randZ = Math.random() * 10;
            this.randD = Math.random() * 5;
            
            this.movementRadius = mapLinear(Math.random(), 0, 1, 10, 13);
            this.movementRadiusInit = this.movementRadius;
            
		}	

		updatePos(){

            /*
			this.centerX = this.initX + this.randD * Math.sin(step * 0.1 + this.randX);
			this.centerY = this.initY + this.randD * Math.sin(step * 0.1 + this.randY);
			this.centerZ = this.initZ + this.randD * Math.sin(step * 0.1 + this.randZ);
           	*/
           // this.radius = this.initR + Math.sin(step * 0.1 + this.randZ);
            
            
            let randDeg1 = noise.simplex2(step * 0.0025 + this.randX, this.randY) * Math.PI * 2;
            let randDeg2 = noise.simplex2(step * 0.005 + this.randY, this.randZ);
            let pos = this.getPos(randDeg1, randDeg2);
            this.centerX = pos[0];
            this.centerY = pos[1];
            this.centerZ = pos[2];
            
        }
        
        getPos(deg1, deg2){
            let x = this.movementRadius  * Math.cos(deg1) * Math.cos(deg2);
            let y = this.movementRadius  * Math.sin(deg1) * Math.cos(deg2);
            let z = this.movementRadius  * Math.sin(deg2);
        
            return [x, y, z];
        }

		getValue(x, y, z){
			let dx = x - this.centerX;
			let dy = y - this.centerY;
			let dz = z - this.centerZ;

            let dist = dx * dx + dy * dy + dz * dz;
			return this.radius * this.radius / dist;
        }
        
        getInfluence(){
        	return this.radius * this.radius;
        }

        getDist(x, y, z){
        	let dx = x - this.centerX;
			let dy = y - this.centerY;
			let dz = z - this.centerZ;

            let dist = dx * dx + dy * dy + dz * dz;
            return dist;
        }


	}

	let metaBallNum = 6;
    let metaBallArr = [];
    let influenceCoef = 3.0;
	for (let i = 0; i < metaBallNum; i++){
        let m = new MetaBall(
            Math.random() * 20.0 - 10.0, 
            Math.random() * 20.0 - 10.0, 
            Math.random() * 20.0 - 10.0,
            Math.random() * 2.0 + 2.0
        );
		metaBallArr.push(m);
    }
    
    const planeX = (x, y, z) => {
        return x;
    }



	const metaBall = (x, y, z) => {
        
        /*
		let max = -99999999;
		metaBallArr.forEach(function(m){
			let val = m.getValue(x, y, z);
			m.updatePos();
			if (val > max) max = val;
		});
		return max;
        */


        // influence method: http://glslsandbox.com/e#27744.8
        // https://matiaslavik.wordpress.com/computer-graphics/metaball-rendering/

        
        let influence = 0;
        let val = 0;
        metaBallArr.forEach(function(m, i){
        	
            let currentInfluence = m.getInfluence();
            currentInfluence /= m.getDist(x, y, z) * (1.0 / influenceCoef);
            influence += currentInfluence;
            

        });
        val = mapLinear(influence, 0, 3, -1, 1);
        metaBallArr.forEach(m => m.updatePos());
        return val;
        
        
        /*
		let val = metaBallArr[0].getValue(x, y, z);
		metaBallArr[0].updatePos();
		for (let i = 1; i < metaBallArr.length; i++){
            let nextVal = metaBallArr[i].getValue(x, y, z);
            if (val < nextVal){
                val = smoothUnion(val, metaBallArr[i].getValue(x, y, z), smoothUnionVal);
            }
			
			//metaBallArr[i].updatePos();
        }

   
        
        metaBallArr.forEach(m => m.updatePos());

        return val;
        */
		
	}

	const sphereFunc1 = (x, y, z) => {
		let r = 10;
		let ds = x*x + y*y + z*z;
		let m = mapLinear(ds, 0, r*r, -1, 1);
		return m;
	}

	const randomSphereFunc = (x, y, z) => {
		let r = 2;
		let c = 0.009 ;
		let v = 0.009;
		let n = noise.simplex3(x * c + step * v + seedAlt, y * c + step * v + seedAlt, z * c + step * v + seedAlt);
		n = mapLinear(n, -1, 1, 0, 1);
		r += 13.0 * n;
		let ds = x*x + y*y + z*z;
		let m = mapLinear(ds, 0, r*r, -1, 1);
		return m;
	}

	const randomSphereFunc2 = (x, y, z) => {
		let r = 450;
		let c = 0.003;
		let v = 0.009;
		let n = noise.simplex3(x * c + step * v + seedAlt, y * c + step * v + seedAlt, z * c + step * v + seedAlt);
		r += 20.0 * n;
		let ds = x*x + y*y + z*z;
		let m = mapLinear(ds, 0, r*r, -1, 1);
		return m;
	}

	let gDensity = 0.8;
	let gThickness = 1.0;
	let gRadius = 10;
	let gStepCoef = 0.1;
	const testFunc = (x, y, z) => {

		// gyroid

		let dt = step * gStepCoef;
		let c = gDensity;
		let oc = gThickness;
		let g = Math.sin(x * c + dt) * Math.cos(y * c + dt) + 
		Math.sin(y * c + dt) * Math.cos(z * c + dt) + 
		Math.sin(z * c + dt) * Math.cos(x * c + dt);

		g *= oc;
		let dist = Math.sqrt(x*x + y*y + z*z);
		let r = gRadius;
		if (dist > r) g = 0;

		return g;
	}

	
	

	console.log(metaBall.toString())

// CANVAS & RENDERER
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

// CAMERA
	const fov = 90;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 5000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	//const camera = new THREE.OrthographicCamera(window.innerWidth * -0.5, window.innerWidth * 0.5, window.innerHeight * 0.5, window.innerHeight  *-0.5, 1, 1000);
	camera.position.set(0, 0, 20);

	scene = new THREE.Scene();
	scene.background = p5texture;

	renderer.render(scene, camera);


	let marchingCubesStatic = new MarchingCubes(30.0, 30.0, 30.0,0.3,0.3,0.3, 0, 0, 0, testFunc, 0.65, 3);
    marchingCubesStatic.updateCubes();


    let showMoving = false;
    let marchingCubesMoving = new MarchingCubes(30.0, 30.0, 30.0, 1.0, 1.0, 1.0, 0, 0, 0, testFunc, 0.65, 3);
    marchingCubesMoving.updateCubes();

    marchingCubesMoving.getMesh().visible = false;


	

// LIGHTS
	let dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
	dirLight.position.set(0, 0, 20);
	scene.add(dirLight);
	
	const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();



// GUI
	const gui = new dat.GUI();
	const controls = new function(){	
        
        this.thresholdGlobal = 0.65;
        this.gDensity = gDensity;
        this.gThickness = gThickness;
        this.gRadius = gRadius;
        this.gStepCoef = gStepCoef;
        this.showMoving = false;
	}
	
	
  

	gui.add(controls, 'thresholdGlobal', 0, 1.0).onChange(function(e) {
		thresholdGlobal = e;
	});

	gui.add(controls, 'gDensity', 0, 1.0).onChange(function(e) {
		gDensity = e;
	});

	gui.add(controls, 'gThickness', 0, 3.0).onChange(function(e) {
		gThickness = e;
	});

	gui.add(controls, 'gRadius', 0, 15).onChange(function(e) {
		gRadius = e;
	});

	gui.add(controls, 'gStepCoef', 0.0, 0.2).onChange(function(e) {
		gStepCoef = e;
	});

	gui.add(controls, 'showMoving').onChange(function(e) {
		showMoving = !showMoving;
		if (showMoving){
			marchingCubesStatic.setVisiblility(false);
			marchingCubesMoving.setVisiblility(true);
		}
		else{
			marchingCubesStatic.setVisiblility(true);
			marchingCubesMoving.setVisiblility(false);
		}
	});

	gui.close();


	function render(time){

		time *= 0.001;
		step += 1;

		//stats.update();

		
		scene.rotation.x = step *0.005;
		scene.rotation.y = step *0.005;
		scene.rotation.z = step *0.005;
		
		//marchingCubes.updateCubes();
		//marchingCubes.updateShaderMaterial();

		if (showMoving){
			
			marchingCubesMoving.updateCubes();
			marchingCubesMoving.updateShaderMaterial();
			 marchingCubesStatic.manageResources();
			 marchingCubesStatic.updateShaderMaterial();
		}
		else{
			

			 marchingCubesStatic.manageResources();
			
		} 

		
		if (resizeRenderToDisplaySize(renderer)){
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}
		
		renderer.render(scene, camera);
        requestAnimationFrame(render);
        
        p5texture.dispose();
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

	function onMouseMove(){
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //debugCube.position.set(mouse.x, mouse.y);
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

	function onResize(){
    	camera.aspect = window.innerWidth / window.innerHeight;
    	camera.updateProjectionMatrix();
    	renderer.setSize(window.innerWidth, window.innerHeight);
  	}
  
  	window.addEventListener('resize', onResize, false);
}

window.onload = main;