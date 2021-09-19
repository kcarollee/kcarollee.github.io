import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

function createShaderMaterial(vert, frag){
    var vertShader = document.getElementById(vert).innerHTML;
    var fragShader = document.getElementById(frag).innerHTML;
    var attributes = {};
    var uniforms = {
        time: {type: 'f', value: 0.2},
        scale: {type: 'f', value: 0.2},
        alpha: {type: 'f', value: 0.0},
        resolution: {type: "v2", value: new THREE.Vector2()},
        cameraPos: {type: "v3", value: camera.getWorldPosition(new THREE.Vector3())},
        distanceFromCamera: {type: 'f', value: 1.0}
    }

    uniforms.resolution.value.x = window.innerWidth;
    uniforms.resolution.value.y = window.innerHeight;

    var meshMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        //attributes: attributes,
        vertexShader: vertShader,
        fragmentShader: fragShader,
        transparent: true
    });
    return meshMaterial;
}

class CurvedTree{
    constructor(trunkPosVec, trunkPointsNum, branchParams){
        this.points = [];
        this.leaves = [];
        this.trunkPos = trunkPosVec;
        this.pointsNum = trunkPointsNum;
        this.tubeGroup = new THREE.Group();
        this.leafGroup = new THREE.Object3D();
        this.shaderMat = createShaderMaterial("vertex-shader", "fragment-shader-1");
        this.mat = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
        this.indexCount = 0;
        this.genComplete = false;
        this.deleteFlag = false;
        this.rand = Math.random() * 10;
        
        this.evalQueue = [];
        this.evalComplete = false;
        this.branchParams = branchParams;

        var firstPointsOnQueue;
        var randomAngle = (Math.random() * Math.PI - 1.5 * Math.PI);
            
        var centerX = this.trunkPos.x + this.branchParams.spiralRadius  * Math.cos(randomAngle);
        var centerZ = this.trunkPos.z + this.branchParams.spiralRadius  * Math.sin(randomAngle);
           
        var theta = Math.atan((this.trunkPos.z - centerZ) / (this.trunkPos.x - centerX));
        var determineNextPos = (c, i) => {
            var x = centerX + this.branchParams.spiralRadius  * Math.cos(theta + c * i * 0.15);
            var z = centerZ + this.branchParams.spiralRadius  * Math.sin(theta + c * i * 0.15);
            return [x, z];
        };
        var dr = Math.random() > 0.5 ? 1 : -1;
        for (let i = 0; i < this.pointsNum; i++){
            var x, z;
            [x, z] = determineNextPos(dr, i);
            var n = mapLinear(noise.simplex2(x  * 0.0025, z * 0.0025), -1, 1, 0, 1);
                //console.log(n);
            var y = this.trunkPos.y + i * 10 * n;
            this.points.push(new THREE.Vector3(x, y, z));

            if (i != this.pointsNum - 1 && Math.random() > 0.1 && i > this.pointsNum * 0.25){
                var firstPointsOnQueue = {
                    pointsNum: Math.floor(this.pointsNum * 0.5),
                    pos: new THREE.Vector3(x, y, z),
                    spiralRadius: this.branchParams.spiralRadius * 1.2,
                    thickness: this.branchParams.thickness * 0.5,
                    heightCoef: this.branchParams.heightCoef * 0.95,
                    noiseCoef: this.branchParams.noiseCoef * 2.0
                };
                this.evalQueue.push(firstPointsOnQueue);
            }
        }
        /*
        var g = new THREE.BoxGeometry(10, 10, 10);
        var gm = new THREE.Mesh(g, new THREE.MeshBasicMaterial());
        gm.position.set(this.trunkPos.x, this.trunkPos.y, this.trunkPos.z);
        console.log(gm);
        scene.add(gm);
        */
        var branchPath = new THREE.CatmullRomCurve3(this.points);
        var branchGeom = new THREE.TubeGeometry(branchPath, this.pointsNum, this.branchParams.thickness, 10, false);
        var branchMesh = new THREE.Mesh(branchGeom, this.shaderMat);

        this.tubeGroup.add(branchMesh);
    }

    getTopOfQueueString(){
        var t = this.evalQueue[0];
        return "top of Queue: " + t.pos.x + " " + t.pos.y + " " + t.pos.z + "<br>" + 
        "spiralRadius: " + t.spiralRadius + "<br>" +
        "height coef: " + t.heightCoef + "<br>" +
        "thickness: " + t.thickness + "<br>" ;
    }

    increaseOpacity(){
        //console.log(this.shaderMat.uniforms.alpha.value);
        if (this.shaderMat.uniforms.alpha.value < 1.0) this.shaderMat.uniforms.alpha.value += 0.01;
        else this.genComplete = true;
    }

    decreaseOpacity(){
        //console.log(this.shaderMat.uniforms.alpha.value);
        if (this.shaderMat.uniforms.alpha.value > 0) this.shaderMat.uniforms.alpha.value -= 0.01;
        else this.deleteFlag = true;
    }

    dropLeaves(){
        //console.log(this.leafGroup);
        this.leafGroup.children.forEach(function (c){
            c.position.x -= c.dropVec.x;
            c.position.y -= Math.abs(c.dropVec.y);
            c.position.z -= c.dropVec.z;
            //c.updateMatrixWorld(true);
            c.material.opacity -= 0.005;
        });
    }

    generatePointsIncrementally(){
        if (!this.evalQueue.length == 0){
            var branchPoints = [];
            var r = Math.random();
            var evalTarget = this.evalQueue[0];
            var branchPos = evalTarget.pos;
            var randomAngle = (Math.random() * Math.PI - 1.5 * Math.PI);
            
            var centerX = branchPos.x + evalTarget.spiralRadius * 0.5 * Math.cos(randomAngle);
            var centerZ = branchPos.z + evalTarget.spiralRadius * 0.5 * Math.sin(randomAngle);
           
            var theta = Math.atan((branchPos.z - centerZ) / (branchPos.x - centerX));

            var determineNextPos = (c, i) => {
                var x = centerX + evalTarget.spiralRadius * 0.5 * Math.cos(theta + c * i * 0.1);
                var z = centerZ + evalTarget.spiralRadius * 0.5 * Math.sin(theta + c * i * 0.1);
                return [x, z];
            };
            var dr = Math.random() > 0.5 ? 1 : -1;
            for (let i = 0; i < evalTarget.pointsNum; i++){
                var x, z;
                [x, z] = determineNextPos(dr, i);
                var n = mapLinear(noise.simplex2(x  * evalTarget.noiseCoef, z * evalTarget.noiseCoef), -1, 1, 0, 1);
                var y = evalTarget.pos.y + i * evalTarget.heightCoef * n;
                var pos = new THREE.Vector3(x, y, z);
                branchPoints.push(pos);

                if (evalTarget.pointsNum > 10 && i !=  evalTarget.pointsNum - 1 && 
                    Math.random() > 0.75 && 
                    i > this.pointsNum * 0.25){
                    
                    var firstPointsOnQueue = {
                        pointsNum: Math.floor(evalTarget.pointsNum * 0.5),
                        pos: pos,
                        spiralRadius: evalTarget.spiralRadius * 0.5,
                        heightCoef: evalTarget.heightCoef * 0.95,
                        noiseCoef: evalTarget.noiseCoef * 2.0,
                        thickness: evalTarget.thickness * 0.5
                    };
                    //console.log(firstPointsOnQueue.pointsNum);
                    //console.log(firstPointsOnQueue.pointsNum);
                    this.evalQueue.push(firstPointsOnQueue);
                }
                else {
                    if (i == evalTarget.pointsNum - 1){
                        this.generateLeafSprite(pos);
                        this.leaves.push(new THREE.Vector3(x, y, z));
                    }
                }
            }

            var branchPath = new THREE.CatmullRomCurve3(branchPoints);
            var branchGeom = new THREE.TubeGeometry(branchPath, evalTarget.pointsNum, evalTarget.thickness, 3, false);
            var branchMesh = new THREE.Mesh(branchGeom, this.shaderMat);

            this.tubeGroup.add(branchMesh);
            this.evalQueue.splice(0, 1);
        }
        else this.evalComplete = true;
    }

    generateLeafSprite(pos){
        var spriteMat = new THREE.SpriteMaterial({
            opacity: 0.25,
            color: 0xFFFFFF,
            transparent: true,
            blending: THREE.AdditiveBlending,
            map: leafTexture
        });

        var sprite = new THREE.Sprite(spriteMat);
        var rs = Math.random() * 10 + 10;
        sprite.scale.set(rs, rs, rs);
        sprite.position.set(pos.x, pos.y, pos.z);
        sprite.initPos = {x: pos.x, y: pos.y, z: pos.z};
        var r = Math.random() * 10;
        var c = 10;
        var nx = noise.simplex2(pos.x * c, pos.y * c) * 2.0;
        var ny = noise.simplex2(pos.x * c + r, pos.y * c) * 2.0;
        var nz = noise.simplex2(pos.x * c, pos.y * c + r) * 2.0;
        sprite.dropVec = new THREE.Vector3(nx, ny, nz);
        this.leafGroup.add(sprite);
    }

    getTreeMesh(){ 
        this.tubeGroup.name = "tubeGroup";
        return this.tubeGroup; 
    }

    getLeafSprites(){
        this.leafGroup.name = "leafGroup";
        return this.leafGroup;
    }

    animateLeaves(step){
        this.leafGroup.children.forEach(function(p){
            p.position.x = p.initPos.x + 10.0 * Math.sin(step + p.initPos.x);
            p.map = leafTexture;
        });
    }

    /*
    generateWhole(){
        if (Math.random() < 0.5){
            for (let i = 0; i < this.pointsNum; i++){
                var x = this.trunkPos.x + 30 * Math.cos(i * 0.15);
                var z = this.trunkPos.z + 30 * Math.sin(i * 0.15);
                var n = mapLinear(noise.simplex2(x  * 0.01, z * 0.01), -1, 1, 0, 1);
                //console.log(n);
                var y = this.trunkPos.y + i * 5 * n;
                this.points.push(new THREE.Vector3(x, y, z));

                if (i != this.pointsNum - 1 && Math.random() > 0.1 && i > this.pointsNum * 0.25){
                    this.generateBranchPoints(this.points[i], 40, 20, 0.75, 1, 0.01, 3);
                }
            }
        }
        else{
             for (let i = 0; i < this.pointsNum; i++){
                var x = this.trunkPos.x - 30 * Math.cos(i * 0.15);
                var z = this.trunkPos.z - 30 * Math.sin(i * 0.15);
                var n = mapLinear(noise.simplex2(x  * 0.01, z * 0.01), -1, 1, 0, 1);
                //console.log(n);
                var y = this.trunkPos.y + i * 5 * n;
                this.points.push(new THREE.Vector3(x, y, z));

                if (i != this.pointsNum - 1 && Math.random() > 0.5 && i > this.pointsNum * 0.25){
                    this.generateBranchPoints(this.points[i], 40, 20, 0.75, 1, 0.01, 3);
                }
            }
        }
        this.completeMeshAfterGen();
    }

    generateIncrementally(i){
        var x = this.trunkPos.x + 30 * Math.cos(i * 0.05);
        var z = this.trunkPos.z + 30 * Math.sin(i * 0.05);
        var n = mapLinear(noise.simplex2(x  * 0.01 + this.rand, z * 0.01 + this.rand), -1, 1, 0, 1);
        //console.log(n);
        var y = this.trunkPos.y + i * 5 * n;
        this.points.push(new THREE.Vector3(x, y, z));


        if (i != this.pointsNum - 1 && Math.random() > 0.75 && i > this.pointsNum * 0.5){
            this.generateBranchPoints(this.points[i], this.pointsNum, 20, 0.5, 1, 0.01, 2);
        }
    }

    completeMeshAfterGen(){
        this.genComplete = true;
        //this.generateLeafSprites();
        this.trunkPath = new THREE.CatmullRomCurve3(this.points);
        this.geom = new THREE.TubeGeometry(this.trunkPath, 30, 1, 4, false);
        
        this.mesh = new THREE.Mesh(this.geom, this.mat);

        this.tubeGroup.add(this.mesh);
    }

    generateLeafSprites(){
        var self = this;
        this.leaves.forEach(function (p){
            var spriteMat = new THREE.SpriteMaterial({
                opacity: 0.025,
                color: 0xFFFFCC,
                transparent: true,
                blending: THREE.AdditiveBlending
            });

            var sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(100, 10, 10);
            sprite.position.set(p.x, p.y, p.z);
            sprite.initPos = {x: p.x, y: p.y, z: p.z};
            self.leafGroup.add(sprite);
        });
    }

    


    generateBranchPoints(basePos, pointsNum, spiralRadius, thickness, heightCoef, noiseCoef, iterNum){
        if (iterNum == 0 || pointsNum < 1 || spiralRadius < 1) return;
        iterNum--;
        var self = this;
        var branchPoints = [];
        var branchPos = basePos;
        var randomAngle = (Math.random() * Math.PI - 1.5 * Math.PI);
        var centerX = branchPos.x + spiralRadius * 0.5 * Math.cos(randomAngle);
        var centerZ = branchPos.z + spiralRadius * 0.5 * Math.sin(randomAngle);
        var theta = Math.atan((branchPos.z - centerZ) / (branchPos.x - centerX));
        //console.log(branchPos.x + " " + (centerX + spiralRadius * 0.5 * Math.cos(theta)));
        //console.log(iterNum);
        var r = Math.random();
        for (let i = 0; i < pointsNum; i++){
            var x, z;
            if (r % 2 == 0){
                x = centerX + spiralRadius * 0.5 * Math.cos(theta + i * 0.1);
                z = centerZ + spiralRadius * 0.5 * Math.sin(theta + i * 0.1);
            }
            else{
                x = centerX + spiralRadius * 0.5 * Math.cos(theta - i * 0.1);
                z = centerZ + spiralRadius * 0.5 * Math.sin(theta - i * 0.1);
            }
            var n = mapLinear(noise.simplex2(x  * noiseCoef, z * noiseCoef), -1, 1, 0, 1);
            var y = branchPos.y + i * heightCoef * n;
            branchPoints.push(new THREE.Vector3(x, y, z));
            if (iterNum == 0 && i == pointsNum - 1) self.leaves.push(new THREE.Vector3(x, y, z));
           // console.log(pointsNum/2);
            if (Math.random() > 0.5 && i > pointsNum * 0.5) self.generateBranchPoints(branchPoints[i], Math.floor(pointsNum * 0.5),
             spiralRadius * 1.2, thickness * 0.5, heightCoef * 0.95, noiseCoef * 2.0, iterNum);
        }

        var branchPath = new THREE.CatmullRomCurve3(branchPoints);
        var branchGeom = new THREE.TubeGeometry(branchPath, pointsNum, thickness, 10, false);
        var branchMesh = new THREE.Mesh(branchGeom, self.mat);

        self.tubeGroup.add(branchMesh);
    }
    */

}

let scene;
let camera;
let p5Canvas;
let leafTexture;
let leafShader;
let shaderLoaded = false;
function init() {
    const p5Sketch = (sketch) => {
        /*
        sketch.preload = () => {
            leafShader = sketch.loadShader('./assets/leafShader.vert',
                './assets/leafShader.frag');
                console.log(leafShader);
            shaderLoaded = true;
        }
        */
        sketch.setup = () => {
           
            //sketch.createCanvas(50, 50, sketch.WEBGL);
            sketch.createCanvas(30, 30);
            
        }
        sketch.draw = () => {
            sketch.background(255);
            //sketch.shader(leafShader);
            sketch.noFill();
            sketch.strokeWeight(2);
            sketch.stroke(255, 0, 0);
            sketch.rectMode(sketch.CENTER);
            for (var i = 0; i < 5; i++){
                sketch.rect(sketch.width * 0.5, sketch.height * 0.5,
                    (sketch.frameCount + i * 10) % 30, (sketch.frameCount + i * 10) % 30);
            }
            if (leafTexture) leafTexture.needsUpdate = true;
        }
    };
    p5Canvas = new p5(p5Sketch);
    p5Canvas.canvas.style.display = 'none';
    //console.log(p5Canvas.canvas);
    var text = document.createElement('div');
    text.style.position = 'absolute';
    //text.style.zIndex = 1;    // if you still don't see the label, try uncommenting this

    text.style.backgroundColor = "white";
    text.style.top = 30 + 'px';
    text.style.left = 25 + 'px';
    text.style.color = "red";
    text.style.fontSize = "11px";
    text.style.fontFamily = "Courier";
    text.style.fontWeight = "1000";
    text.style.opacity = "0.75";
    document.body.appendChild(text);

    
    leafTexture = new THREE.CanvasTexture(p5Canvas.canvas);
    leafTexture.needsUpdate = true;
    console.log(leafTexture);
    
    noise.seed(Math.random());
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

    //var stats = initStats();
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
   
    var newTreeRef;



    //scene.add(camera);

    renderer.setClearColor(0x550033, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;

    
    
    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();
    
    camera.position.x = 0;
    camera.position.y = 500;
    camera.position.z = 800;

    camera.lookAt(scene.position);

    var shaderMat = new THREE.ShaderMaterial({
        uniforms:{
            time: {value: 1.0},
            resolution: {value: new THREE.Vector2()}
        }
    });

  
    var deleteTargetLeaf;
    var deleteTargetTube;
    var deleteTarget;
    //tree.generateWhole();
    //scene.add(tree.getTreeMesh());
    //scene.add(tree.getLeafSprites());

    var planeGeom = new THREE.PlaneGeometry(700, 700, 15, 15);
    planeGeom.rotateX(-Math.PI * 0.5);
    

    var plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
        wireframe: true,
        opacity: 0.3,
        transparent: true
    }));
    

    var planeVerts = planeGeom.vertices;
    for (let i = 0; i < planeVerts.length; i++){
        planeVerts[i].y += noise.simplex2(planeVerts[i].x, planeVerts[i].z) * 20.0 - 70;
    }
    scene.add(plane);

    var treeArr = [];
    var treeNum = 10;
    var growthRadius = 400;
    for (let i = 0; i < treeNum; i++){
        var randr = Math.random() * growthRadius;
        var randt = Math.random() * Math.PI * 2.0;
        var randPointIndex = Math.floor(Math.random() * planeGeom.vertices.length);
        var randPoint = planeGeom.vertices[randPointIndex];
        //new CurvedTree(new THREE.Vector3(randr * Math.cos(randt), -70, randr * Math.sin(randt)), 60
        var tree = new CurvedTree(new THREE.Vector3(randPoint.x, randPoint.y, randPoint.z), 60, {
            pointsNum: 100,
            spiralRadius: mapLinear(Math.random() * 50, 0, 50, 20, 50),
            thickness: mapLinear(Math.random(), 0, 1, 2, 3),
            heightCoef: 1,
            noiseCoef: 0.01
        });
        treeArr.push(tree);
        scene.add(tree.getTreeMesh());
        scene.add(tree.getLeafSprites());
    }
    
    

    document.body.appendChild(renderer.domElement);

    renderScene();
    deleteTarget = treeArr[0];
    var step = 0;
    let stop = false;
    function animateScene() {
        step++;
        scene.rotation.y = step * 0.01;
        /*
        if (!tree.genComplete){
            if (tree.indexCount < tree.pointsNum){
                tree.generateIncrementally(tree.indexCount);
                tree.indexCount++
            }
            else tree.completeMeshAfterGen();
                
        }
        */

        if (newTreeRef != undefined){
            if (!newTreeRef.genComplete){
                text.innerHTML = "new tree's evaluation queue: <br>" + 
                "size: " + newTreeRef.evalQueue.length + "<br>" +
                newTreeRef.getTopOfQueueString() + "<br>";
            }
        }
        else text.innerHTML = "";
        let cpos = camera.getWorldPosition(new THREE.Vector3());
        treeArr.forEach(function(tree){
            tree.animateLeaves(step * 0.01);
            if (!tree.evalComplete) {
                tree.generatePointsIncrementally();
                text.innerHTML += "generating tree " + tree.tubeGroup.uuid + "<br>";
            }


            //tree.tubeGroup.rotation.y = step * 0.0025;
           // tree.leafGroup.rotation.y = step * 0.0025;   

            if (tree == deleteTarget){
                if (!tree.genComplete) tree.increaseOpacity();
            }
            else tree.increaseOpacity();

            tree.shaderMat.uniforms.cameraPos.value = cpos;
            tree.shaderMat.uniforms.distanceFromCamera.value = 
                1.0 - mapLinear(cpos.distanceTo(tree.trunkPos),
                    0, 1500, 0, 0.95);
            tree.shaderMat.uniformsNeedUpdate = true;
        });
        //plane.rotation.y = step * 0.0025;
        //plane.rotation.y = step * 0.0025;
       // console.log(treeArr[0].shaderMat.uniforms.cameraPos.value);

        //console.log(deleteTarget);
        
        try{
            if (deleteTarget.genComplete){
                deleteTarget.decreaseOpacity();
                deleteTarget.dropLeaves();
                text.innerHTML += "deleting tree " + deleteTarget.tubeGroup.uuid;
            }
            if (deleteTarget.deleteFlag){
                treeArr.splice(0, 1);
                scene.remove(scene.getObjectByName("leafGroup"));
                scene.remove(scene.getObjectByName("tubeGroup"));

                var growthRadius = 400;
                var randr = Math.random() * growthRadius;
                var randt = Math.random() * Math.PI * 2.0;
                var randPointIndex = Math.floor(Math.random() * planeGeom.vertices.length);
                var randPoint = planeGeom.vertices[randPointIndex];
                //new CurvedTree(new THREE.Vector3(randr * Math.cos(randt), -70, randr * Math.sin(randt)), 60
                var tree = new CurvedTree(new THREE.Vector3(randPoint.x, randPoint.y, randPoint.z), 60, {
                    pointsNum: 200,
                    spiralRadius: mapLinear(Math.random() * 50, 0, 50, 20, 50),
                    thickness: mapLinear(Math.random(), 0, 1, 2, 3),
                    heightCoef: 1,
                    noiseCoef: 0.01
                });
                newTreeRef = tree;
                treeArr.push(tree);
                scene.add(tree.getTreeMesh());
                scene.add(tree.getLeafSprites());
                deleteTarget = treeArr[0];
            }
        } catch{}

        
;
        //document.getElementById("wall").innerHTML = Math.random()
        /*
        if (newTreeRef){
            document.getElementById("wall").innerHTML = "evaluation Queue of new tree:<br>";
        }
        */

        
        /*
        treeArr[treeArr.length - 1].evalQueue.forEach(function (elem){
            text.innerHTML += elem.pos.x + "<br>";
        });
        */
       /*
        for (let i = 0; i < treeArr.length; i++){
            text.innerHTML += "tree in index " + i.toString() + "<br>";
        }
        */

         //if (treeArr[treeArr.length-1].evalQueue.length>1)document.getElementById("wall").innerHTML += treeArr[treeArr.length - 1].evalQueue[0].pos.x;
    }

    
    function renderScene() {
        animateScene();
        //stats.update();
        requestAnimationFrame(renderScene);
        renderer.render(scene, camera);
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

    function onDocumentKeyDown(event){
        var keyCode = event.which;
        console.log(keyCode);
        switch(keyCode){
            case 83:
                stop = true;
                break;
            
        }
    }

    window.addEventListener('keydown', onDocumentKeyDown, false);


    window.addEventListener('resize', onResize, false);
}



window.onload = init;