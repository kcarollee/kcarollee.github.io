import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
import {Reflector} from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/objects/Reflector.js";
import {SceneUtils} from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/utils/SceneUtils.js";
const mod = (x, n) => (x % n + n) % n;
function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}
THREE.FocusShader = {

	uniforms: {

		'tDiffuse': { value: null },
		'screenWidth': { value: 1024 },
		'screenHeight': { value: 1024 },
		'sampleDistance': { value: 0.94 },
		'waveFactor': { value: 0.00125 }

	},

	vertexShader: [

		'varying vec2 vUv;',

		'void main() {',

		'	vUv = uv;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

		'}'

	].join( '\n' ),

	fragmentShader: [

		'uniform float screenWidth;',
		'uniform float screenHeight;',
		'uniform float sampleDistance;',
		'uniform float waveFactor;',

		'uniform sampler2D tDiffuse;',

		'varying vec2 vUv;',

		'void main() {',

		'	vec4 color, org, tmp, add;',
		'	float sample_dist, f;',
		'	vec2 vin;',
		'	vec2 uv = vUv;',

		'	add = color = org = texture2D( tDiffuse, uv );',

		'	vin = ( uv - vec2( 0.5 ) ) * vec2( 1.4 );',
		'	sample_dist = dot( vin, vin ) * 2.0;',

		'	f = ( waveFactor * 100.0 + sample_dist ) * sampleDistance * 4.0;',

		'	vec2 sampleSize = vec2(  1.0 / screenWidth, 1.0 / screenHeight ) * vec2( f );',

		'	add += tmp = texture2D( tDiffuse, uv + vec2( 0.111964, 0.993712 ) * sampleSize );',
		'	if( tmp.b < color.b ) color = tmp;',

		'	add += tmp = texture2D( tDiffuse, uv + vec2( 0.846724, 0.532032 ) * sampleSize );',
		'	if( tmp.b < color.b ) color = tmp;',

		'	add += tmp = texture2D( tDiffuse, uv + vec2( 0.943883, -0.330279 ) * sampleSize );',
		'	if( tmp.b < color.b ) color = tmp;',

		'	add += tmp = texture2D( tDiffuse, uv + vec2( 0.330279, -0.943883 ) * sampleSize );',
		'	if( tmp.b < color.b ) color = tmp;',

		'	add += tmp = texture2D( tDiffuse, uv + vec2( -0.532032, -0.846724 ) * sampleSize );',
		'	if( tmp.b < color.b ) color = tmp;',

		'	add += tmp = texture2D( tDiffuse, uv + vec2( -0.993712, -0.111964 ) * sampleSize );',
		'	if( tmp.b < color.b ) color = tmp;',

		'	add += tmp = texture2D( tDiffuse, uv + vec2( -0.707107, 0.707107 ) * sampleSize );',
		'	if( tmp.b < color.b ) color = tmp;',

		'	color = color * vec4( 2.0 ) - ( add / vec4( 8.0 ) );',
		'	color = color + ( add / vec4( 8.0 ) - color ) * ( vec4( 1.0 ) - vec4( sample_dist * 0.5 ) );',

		'	gl_FragColor = vec4( color.rgb * color.rgb * vec3( 0.95 ) + color.rgb, 1.0 );',

		'}'


	].join( '\n' )
};
class Line{
    constructor(size, posx, posy, posz, scene){
        this.size = size;
        this.posx = posx;
        this.posy = posy;
        this.posz = posz;
        this.p1 = new THREE.Vector3(posx, posy + size * 0.5, posz);
        this.p2 = new THREE.Vector3(posx, posy - size * 0.5, posz);
        this.lineGeo = new THREE.BufferGeometry().setFromPoints([this.p1, this.p2]);
        this.lineMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 2,
            opacity: 0.5
        });
        this.line =  new THREE.Line(this.lineGeo, this.lineMat);
       
        scene.add(this.line);

        this.noiseParams = {x: 0, y: 0};
        this.scaleCoef = 1.0;
        
    }

    setNoiseParameters(x, y){
        this.noiseParams.x = x;
        this.noiseParams.y = y;
        var n = noise.simplex2(this.noiseParams.x, this.noiseParams.y);
        this.scaleCoef = mapLinear(n, -1, 1, 0, 1);
        this.line.scale.y = this.scaleCoef;

    }

    updateNoise(step){
        var n = noise.simplex2(this.noiseParams.x + step, this.noiseParams.y + step);
        this.scaleCoef = mapLinear(n, -1, 1, 0, 1);
        this.line.scale.y = this.scaleCoef;
        
    }

}
class Cell{
    constructor(size, posx, posy, posz, index){
        this.index = index; // flat index
        this.noiseVal = 0;
        this.sizeCoef = 1.0;
        this.size = size;
        this.scalex = 1.0;
        this.scaley = 1.0;
        this.scalez = 1.0;
        this.geom = new THREE.BoxGeometry(this.size, this.size, this.size);
        //this.cellMesh = new THREE.Mesh(this.geom, Cell.standardMat);
        this.basicMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF * Math.random()});
        this.standardMat2 = new THREE.MeshStandardMaterial({roughness: 0.0});
        
        this.cellMesh = new THREE.Mesh(this.geom,
            this.standardMat2);
        
        this.cellMesh.position.set(posx, posy, posz);
        this.prevSizeCoef = this.sizeCoef;
        this.noiseParams = {x:0, y: 0, z: 0};
        this.posx = posx; this.posy = posy; this.posz = posz;
        this.cellMesh.geometry.parameters.width  = 100.0;

        
        
        Cell.cellGroupMesh.add(this.cellMesh);
    }

    setNoiseParameters(x, y, z){
        this.noiseParams.x = x;
        this.noiseParams.y = y;
        this.noiseParams.z = z;
        
    }

    updateNoise(step){
        this.noiseVal = noise.simplex3(this.noiseParams.x + step, this.noiseParams.y + step, this.noiseParams.z + step);
        
        var mappedNoise = mapLinear(this.noiseVal, -1, 1, 0, 1);

        this.standardMat2.color.r = 0.5 + 0.5 * Math.sin(mappedNoise * 10.0);
        this.standardMat2.color.g = 0.5 + 0.5 * Math.cos(mappedNoise * 20.0);
        this.standardMat2.color.b = 0.5 + 0.5 * Math.cos(mappedNoise * 3.0);
        
        if (Cell.hardCutoff){
            if (mappedNoise < Cell.cutoffThreshold) this.cellMesh.visible = false;
                
            else {
                this.cellMesh.visible = true;
                mappedNoise = 1.0;
            }
        }
        else if (Cell.exponentialCutoff){
            mappedNoise = Math.pow(mappedNoise, Cell.cutoffExponent);
            if (mappedNoise < Cell.cutoffThreshold) this.cellMesh.visible = false;
            else  this.cellMesh.visible = true;
        }
        this.setNewSizeCoef(mappedNoise);
        
        //this.cellMesh.rotateX(step * 0.0001);
        //this.cellMesh.translate(this.posx, this.posy, this.posz);
    }
    setNewSizeCoef(sizeCoef){
        this.sizeCoef = sizeCoef;
        this.size *= this.sizeCoef;
        this.cellMesh.scale.x = this.sizeCoef;
        this.cellMesh.scale.y = this.sizeCoef;
        this.cellMesh.scale.z = this.sizeCoef;
    }
    addToScene(scene){scene.add(this.cellMesh);}

    /* save for a different project
    calculateAdjacentIndices(cellMeshObjects){
        var rowNum = cellMeshObjects.rowNum;
        var colNum = cellMeshObjects.colNum;
        var totalNum = cellMeshObjects.arr.length;
        this.upperCellIndex = mod(this.index - colNum, totalNum);
        this.lowerCellIndex = mod(this.index + colNum, totalNum);
        this.leftCellIndex = mod(this.index - 1, totalNum);
        this.rightCellIndex = mod(this.index + 1, totalNum);
    }

    diffuse(cellMeshObjects){
        var upperCell = cellMeshObjects.arr[this.upperCellIndex];
        var lowerCell = cellMeshObjects.arr[this.lowerCellIndex];
        var leftCell = cellMeshObjects.arr[this.leftCellIndex];
        var rightCell = cellMeshObjects.arr[this.rightCellIndex];
        var f = 0.2;
        var temp = this.sizeCoef;
        this.prevSizeCoef = temp;
        this.sizeCoef += f * (upperCell.prevSizeCoef + lowerCell.prevSizeCoef + 
            leftCell.prevSizeCoef + rightCell.prevSizeCoef - 4.0 * this.prevSizeCoef);
        
        //this.cellMesh.geometry.width = this.sizeCoef * this.size;
        //this.cellMesh.geometry.height = this.sizeCoef * this.size;
        //this.cellMesh.geometry.depth = this.sizeCoef * this.size;
        
        //if (this.sizeCoef < 0.05) this.sizeCoef = 0.1;
       if (this.sizeCoef > 0.999) this.sizeCoef = 0.9;
        this.cellMesh.scale.x = this.sizeCoef;
        this.cellMesh.scale.y = this.sizeCoef;
        this.cellMesh.scale.z = this.sizeCoef;

    }
    */

}
Cell.standardMat = new THREE.MeshStandardMaterial({
    //color: 0xEEEEEE,
    roughness: 0.0,
    transparent: true,
    opacity: 1.0
});
Cell.normalMat = new THREE.MeshNormalMaterial();
Cell.exponentialCutoff = true;
Cell.cutoffExponent = 3.0;
Cell.cutoffThreshold = 0.25;
Cell.hardCutoff = false;
Cell.cellGroupMesh = new THREE.Mesh();

function init() {
    noise.seed(Math.random());
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
    //var stats = initStats();
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    var gui = new dat.GUI();

    scene.add(camera);

    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;

    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();

    var ambLight = new THREE.AmbientLight({color: 0xEEEEEE});
    //scene.add(ambLight);

    var spotLight = new THREE.SpotLight();
    spotLight.position.set(0, 100, 500);
    scene.add(spotLight);

    var spotLight2 = new THREE.SpotLight();
    spotLight2.position.set(0, 100, -500);
    scene.add(spotLight2);

    
    
    

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 200;
    camera.updateProjectionMatrix();
    camera.lookAt(scene.position);

    
    var composer = new THREE.EffectComposer(renderer);
    var renderPass = new THREE.RenderPass(scene, camera);
    
    composer.addPass(renderPass);
    
    
    var smaaPass = new THREE.SMAAPass(window.innderWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());

    
    var focusPass = new THREE.ShaderPass(THREE.FocusShader);
    focusPass.uniforms.waveFactor.value = 0.003;
    focusPass.uniforms.sampleDistance.value = 0.94;
    /*
    focusPass.enabled = true;
    focusPass.uniforms.screenWidth = window.innerWidth;
    focusPass.uniforms.screenHeight = window.innerHeight;
    
    */
    composer.addPass(focusPass);
    composer.addPass(smaaPass);

    var depthNum = 12;
    var rowNum = 12;
    var colNum = 12;
    var cellSize = 8;
    var initposx = -cellSize * colNum * 0.5;
    var initposy = -cellSize * rowNum * 0.5;
    var initposz = -cellSize * depthNum * 0.5;
    var cellMeshObjects = {
        arr: [],
        rowNum: rowNum,
        colNum: colNum
    };
    var index = 0;
    var noiseDiv = 10;
    
    for (let zi = 0; zi < depthNum; zi++){
        for (let ri = 0; ri < rowNum; ri++){
            for (let ci = 0; ci < colNum; ci++){
                var cell = new Cell(cellSize, initposx + cellSize * ci, 
                    initposy + cellSize * ri, initposz + cellSize * zi, index++);
                cell.setNoiseParameters(ci / noiseDiv, ri / noiseDiv, zi / noiseDiv);
                var n = noise.simplex3(ci / noiseDiv, ri / noiseDiv, zi / noiseDiv);
                cell.setNewSizeCoef(mapLinear(n, -1, 1, 0, 1));
                cellMeshObjects.arr.push(cell);
            }
        }
    }
    cellMeshObjects.arr.forEach(c => {
        //c.addToScene(scene)
    });

    var gapWidth = 50;
    var sideNum = 15;
    var lineMeshObjects = [];
    for (let i = 0; i < sideNum; i++){
        for (let j = 0; j < sideNum; j++){
            var l = new Line(10, -gapWidth * sideNum * 0.5 + gapWidth * i, 
                -150, -gapWidth * sideNum * 0.5 + gapWidth * j, scene);
            l.setNoiseParameters(i * 0.1, j * 0.1);
            lineMeshObjects.push(l);
        }
    }

    scene.add(Cell.cellGroupMesh);
    

    var boxSize = rowNum * cellSize;

    var barrierSize = 1.0;
    var planeGeo = new THREE.PlaneGeometry(boxSize * barrierSize * 2.0, boxSize * barrierSize * 2.0);
    var planeMat = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
    var shaderMat = createShaderMaterial("vert1", "frag1");
    var shaderMat2 = createShaderMaterial("vert1", "frag2");
    var planeFloor = new THREE.Mesh(planeGeo, planeMat);
    
    
    planeFloor.rotation.x = -Math.PI *0.5;
    planeFloor.position.y = -boxSize  * barrierSize;
    //scene.add(planeFloor);

    var planeRight = new THREE.Mesh(planeGeo, shaderMat);
    var planeLeft = new THREE.Mesh(planeGeo, planeMat);
    var planeCeil = new THREE.Mesh(planeGeo, planeMat);
    var planeBack = new THREE.Mesh(planeGeo, shaderMat2);
    
    planeRight.rotation.y = Math.PI * 0.5;
    planeRight.position.x = boxSize * barrierSize

    planeLeft.rotation.y = Math.PI * 0.5;
    planeLeft.position.x = -boxSize * barrierSize;

    planeCeil.rotation.x = Math.PI *0.5;
    planeCeil.position.y = boxSize  * barrierSize;

    
    planeBack.position.z = -boxSize  * barrierSize;
    scene.add(planeBack);
    
    

    //scene.add(planeCeil);
    scene.add(planeRight);
    //scene.add(planeLeft)
    
    console.log(Cell.cellGroupMesh);
    var reflectivePlane = new Reflector( new THREE.PlaneGeometry(boxSize * barrierSize * 6.0, boxSize * barrierSize * 6.0));
    reflectivePlane.color = 0x889999;
    reflectivePlane.rotation.x = -Math.PI * 0.5;
    reflectivePlane.position.y= -boxSize * barrierSize;

    var reflectivePlane2 = new Reflector( new THREE.PlaneGeometry(boxSize * barrierSize * 6.0, boxSize * barrierSize * 6.0));
    reflectivePlane2.color = 0x889999;
    reflectivePlane2.rotation.x = Math.PI * 0.5;
    reflectivePlane2.position.y= boxSize * barrierSize;

    
    
    scene.add(reflectivePlane);
    scene.add(reflectivePlane2);


    document.body.appendChild(renderer.domElement);
    renderer.autoClear = false;
    
    renderScene();

    var controls = new function() {
        this.outputObj = function() {
            console.log(scene.children);
        }
        this.exponentialCutoff = true;
        this.hardCutoff = false;
        this.cutoffExponent = 3.0;
        this.cutoffThreshold = 0.25;
        
        
        this.waveFactor = 0.003;
        this.sampleDistance = 0.94;

        this.scalex = 1.0;
        this.scaley = 1.0;
        this.scalez = 1.0;

    }
    /*
    gui.add(controls, 'hardCutoff').onChange(e => {
        Cell.hardCutoff = e;
        Cell.exponentialCutoff = !Cell.hardCutoff;
        controls.exponentialCutoff = !controls.hardCutoff;
    });
    */
    gui.add(controls, 'exponentialCutoff').onChange(e => {
        Cell.exponentialCutoff = e;
        Cell.hardCutoff = !Cell.exponentialCutoff;
        controls.hardCutoff = !controls.exponentialCutoff;
    });
    gui.add(controls, 'cutoffExponent', 1.0, 6.0).onChange(e => Cell.cutoffExponent = e);
    gui.add(controls, 'cutoffThreshold', 0.0, 1.0).onChange(e => Cell.cutoffThreshold = e);
    gui.add(controls, 'waveFactor', 0.00, 0.02).onChange(e => focusPass.uniforms.waveFactor.value = e);
    gui.add(controls, 'sampleDistance', 0.00, 3.00).onChange(e => focusPass.uniforms.sampleDistance.value = e);
    
    gui.add(controls, 'scalex', 1.0, 10.0);
    gui.add(controls, 'scaley', 1.0, 10.0);
    gui.add(controls, 'scalez', 1.0, 10.0);
    console.log(gui);
    
    var step = 0;
    Cell.cellGroupMesh.children.forEach(c => {
        c.scale.x *= 100.0;
        console.log(c.scale.x);
        
    });
    console.log(Cell.cellGroupMesh);
    
    function animateScene() {
        step++;
        cellMeshObjects.arr.forEach(c => c.updateNoise(step * 0.01));
        planeRight.material.uniforms.time.value = step * 0.01;
        planeBack.material.uniforms.time.value = step * 0.01;

        Cell.cellGroupMesh.rotateX(0.01);
        Cell.cellGroupMesh.rotateY(0.01);
        Cell.cellGroupMesh.rotateZ(0.01);
        try{
        Cell.cellGroupMesh.children.forEach(c => {
            
            c.scale.x *= controls.scalex;
            c.scale.y *= controls.scaley;
            c.scale.z *= controls.scalez;
        
        
        });
    } catch{}

        lineMeshObjects.forEach(l => l.updateNoise(step * 0.01));
    }

    function renderScene() {
        animateScene();
        //stats.update();
        requestAnimationFrame(renderScene);
        //renderer.render(scene, camera);
        composer.render();
    }

    function initStats() {
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
        return stats;
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    
    function createShaderMaterial(vert, frag){
        var vertShader = document.getElementById(vert).innerHTML;
        var fragShader = document.getElementById(frag).innerHTML;
        var attributes = {};
        var uniforms = {
            time: {type: 'f', value: 0.2},
            scale: {type: 'f', value: 0.2},
            alpha: {type: 'f', value: 0.6},
            resolution: {type: "v2", value: new THREE.Vector2()}
        }
        uniforms.resolution.value.x = window.innerWidth;
        uniforms.resolution.value.y = window.innerHeight;

        var meshMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            //attributes: attributes,
            vertexShader: vertShader,
            fragmentShader: fragShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        return meshMaterial;
    }

    window.addEventListener('resize', onResize, false);
}



window.onload = init;