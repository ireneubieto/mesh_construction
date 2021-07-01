import {
    Bone,
    Color,
    MeshPhongMaterial,
    PerspectiveCamera,
    PointLight,
    Scene,
    SkinnedMesh,
    Skeleton,
    Vector3,
    WebGLRenderer,

    BufferGeometry,
    BufferAttribute,
    Mesh,
    SphereGeometry
} from '/meshconstruction/three.js/build/three.module.js';
import { GUI } from '/meshconstruction/three.js/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from '/meshconstruction/three.js/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/meshconstruction/three.js/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from '/meshconstruction/three.js/examples/jsm/exporters/GLTFExporter.js';

var gui, scene, camera, renderer, orbit, lights;
var face, bones, skeleton;
var bone_rotation = [], bone_translation = [];
var trackedBones = [];
var trackedTargets = [];
var trackedVertex = [];
var trackedSkeleton = [];

var container = document.getElementById("canvas");

const state = {
    animateBones: false
};

export function initScene() {

    //Create scene
    scene = new Scene();
    scene.background = new Color( 0x444444 );

    //Set up renderer
    renderer = new WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    var rect = container.getBoundingClientRect();
    renderer.setSize(rect.width,rect.height);
    container.appendChild( renderer.domElement );

    //Set up camera
    camera = new PerspectiveCamera( 75, rect.width / rect.height, 0.1, 100);
    camera.position.z = 6;
    camera.position.y = 15;

    orbit = new OrbitControls( camera, container );
    orbit.enablePan = false;
    orbit.enableZoom = true;
    orbit.target.set( 0, 5, 0 );
    orbit.update();

    //Place lights
    lights = [];
    lights[ 0 ] = new PointLight( 0xffffff, 1, 0 );
    lights[ 1 ] = new PointLight( 0xffffff, 1, 0 );
    lights[ 2 ] = new PointLight( 0xffffff, 1, 0 );

    lights[ 0 ].position.set( 0, 200, 0 );
    lights[ 1 ].position.set( 100, 200, 100 );
    lights[ 2 ].position.set( - 100, - 200, - 100 );

    scene.add( lights[ 0 ] );
    scene.add( lights[ 1 ] );
    scene.add( lights[ 2 ] );

    
    window.addEventListener( 'resize', function () {

        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();

        renderer.setSize( rect.width, rect.height );

    }, false );

    const loader = new GLTFLoader();
	loader.load( "/meshconstruction/face.glb", function ( gltf ) {
        loadFace(gltf);
        //orderTargets();

        /*const geometry = new BufferGeometry();
        const vertices = new Float32Array(trackedVertex)
        geometry.setAttribute('position', new BufferAttribute( vertices, 3 ))
        const material = new MeshPhongMaterial( { color: 0xff0000 } );
        const mesh = new Mesh( geometry, material );
        scene.add( mesh );*/
        //rotation();
        transformbones();
    });

}

function transformbones(){
    const bones = face.skeleton.bones;
    for (let i = 0; i < bones.length; i++){
        if (trackedTargets[i] == null){
            continue;
        }
        for (let j = 0; j < trackedTargets.length; j++){
            bones[i].position.x = trackedTargets[i].position.x;
            bones[i].position.y = trackedTargets[i].position.y;
            bones[i].position.z = trackedTargets[i].position.z;
        }
    }
    face.geometry.center();
}


/*function printdots(){
    const bones = skeleton.bones;
    const geometry = new SphereGeometry(0.1, 32, 32 );
    const material = new MeshPhongMaterial( {color: 0x00ff00} );
    for (let i = 0; i < bones.length; i++){
        var position = new Vector3(bones[i].position.x, bones[i].position.y, bones[i].position.z);
        bones[i].getWorldPosition(position);
        //bones[i].localToWorld(position);
        const sphere = new Mesh( geometry, material );
        sphere.position.x = position.x;
        sphere.position.y = position.y;
        sphere.position.z = position.z;
        scene.add( sphere );
    }
    const material3 = new MeshPhongMaterial( {color: 0x0000ff} );
    for (let i = 0; i < trackedTargets.length; i++){
        if (trackedTargets[i] == null){
            continue;
        }
        var position = new Vector3(trackedTargets[i].position.x, trackedTargets[i].position.y, trackedTargets[i].position.z);
        trackedTargets[i].localToWorld(position);
        const sphere = new Mesh( geometry, material3 );
        sphere.position.x = position.x;
        sphere.position.y = position.y;
        sphere.position.z = position.z;
        scene.add( sphere );
    }
}*/

function loadFace(gltf){

    face = new SkinnedMesh();
    //eyes = new MeshPhongMaterial();
    face.mesh = gltf.scene.children[0];
    //eyes.mesh = gltf.scene.children[1];
    bones = face.mesh.children;
    skeleton = new Skeleton(bones);
    orderTargets(skeleton);

    face.bind(skeleton);
    scene.add(face.mesh);
}

export function setTargets(x, y, z, name){

    let bone = new Bone();
    bone.position.x = x;
    bone.position.y = y;
    bone.position.z = z;
    bone.name = name;
    trackedBones.push(bone);
    trackedVertex.push(x);
    trackedVertex.push(y);
    trackedVertex.push(z);

}
function orderTargets(skeleton){

    //Order de targets with the same index as the bones
    const bones = skeleton.bones;
    for (let i = 0; i < bones.length; i++){
        var hasPair = false;
        for (let j = 0; j < trackedBones.length; j++){
            if (bones[i].name.toLowerCase() == trackedBones[j].name.toLowerCase()){
                trackedTargets.push(trackedBones[j]);
                hasPair = true;
                break;
            }
        }
        if (hasPair == false){
            //If the current bone has no pair, we will set the variable as null
            trackedTargets.push(null);
        }
    }
    trackedSkeleton = new Skeleton(trackedTargets);
}

function rotation(){

    //Find how much each bone needs to rotate
    const bones = face.skeleton.bones;
    for (let i = 0; i < bones.length; i++){
        if (trackedTargets[i] == null){
            continue;
        }
        var world_bone = new Vector3;
        var world_track = new Vector3;
        bones[i].getWorldPosition(world_bone);
        trackedTargets[i].getWorldPosition(world_track);

        var x = Math.atan(world_track.z/world_track.y);
        var y = Math.atan(world_track.x/world_track.z);
        var z = Math.atan(world_track.x/world_track.y);
        bone_rotation.push(new Vector3(x,y,z));
    }
}

function setupDatGui() {

    gui = new GUI({ autoPlace: false });
    gui.domElement.id = 'gui';
    document.getElementById("edit-area").appendChild(gui.domElement);

    let folder = gui.addFolder( "General Options" );

    folder.add( state, "animateBones" );
    folder.__controllers[ 0 ].name( "Animate Bones" );

    folder.add( face, "pose" );
    folder.__controllers[ 1 ].name( ".pose()" );

    const bones = face.skeleton.bones;

    for ( let i = 0; i < trackedTargets.length; i ++ ) {

        const bone = bones[i];
        const target = trackedTargets[i];
        if (target == null){
            continue;
        }

        var name = bone.name;
        folder = gui.addFolder(name);

        folder.add( bone.position, 'x', -1 + bone.position.x, 1 + bone.position.x);
        folder.add( bone.position, 'y', -1 + bone.position.y, 1 + bone.position.y);
        folder.add( bone.position, 'z', -1 + bone.position.z, 1 + bone.position.z);

        /*
        folder.add( bone.rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 );
        folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 );
        folder.add( bone.rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 );

        folder.add( bone.scale, 'x', 0, 2 );
        folder.add( bone.scale, 'y', 0, 2 );
        folder.add( bone.scale, 'z', 0, 2 );*/

        folder.__controllers[ 0 ].name( "position.x" );
        folder.__controllers[ 1 ].name( "position.y" );
        folder.__controllers[ 2 ].name( "position.z" );

        /*
        folder.__controllers[ 3 ].name( "rotation.x" );
        folder.__controllers[ 4 ].name( "rotation.y" );
        folder.__controllers[ 5 ].name( "rotation.z" );

        folder.__controllers[ 6 ].name( "scale.x" );
        folder.__controllers[ 7 ].name( "scale.y" );
        folder.__controllers[ 8 ].name( "scale.z" );*/

    }

}

export function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

export function edit(){
    setupDatGui();
}

export function downloadModel(){

    const gltfExporter = new GLTFExporter();

    const options = {
        onlyVisible: true,
        truncateDrawRange: true
    };

    gltfExporter.parse( face.mesh, function ( result ) {

        if ( result instanceof ArrayBuffer ) {

            saveArrayBuffer( result, 'scene.glb' );

        } else {

            const output = JSON.stringify( result, null, 2 );
            console.log( output );
            saveString( output, 'scene.gltf' );

        }

    }, options );
}

function saveString( text, filename ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}

function saveArrayBuffer(buffer, filename){
    save(new Blob([buffer], {type:'application/octet-stream'}), filename);
}

function save(blob, filename){
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.append(link);

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
