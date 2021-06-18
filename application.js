import {
    Bone,
    Color,
    CylinderGeometry,
    DoubleSide,
    Float32BufferAttribute,
    MeshPhongMaterial,
    PerspectiveCamera,
    PointLight,
    Scene,
    SkinnedMesh,
    Skeleton,
    SkeletonHelper,
    Vector3,
    Uint16BufferAttribute,
    WebGLRenderer,
    DirectionalLight,

    BufferGeometry,
    PointsMaterial,
    Points,
    BufferAttribute,
    Mesh
} from '/three.js/build/three.module.js';
import { GUI } from '/three.js/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from '/three.js/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/three.js/examples/jsm/loaders/GLTFLoader.js';

var gui, scene, camera, renderer, orbit, lights;
var face, eyes, bones, skeleton;
var trackedBones = [];
var trackedTargets = [];
var trackedVertex = [];

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
    camera = new PerspectiveCamera( 75, rect.width / rect.height, 0.1, 200);
    camera.position.z = 30;
    camera.position.y = 0;

    
    orbit = new OrbitControls( camera, renderer.domElement );
    orbit.enablePan = false;
    orbit.enableZoom = true;
    orbit.target.set( 0, 1, 0 );
    orbit.update();
    //orbit.minDistance = 50;
    //orbit.maxDistance = 200;

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
	loader.load( "/face.glb", function ( gltf ) {
        loadFace(gltf);
        orderTargets();

        const geometry = new BufferGeometry();
        const vertices = new Float32Array(trackedVertex)
        geometry.setAttribute('position', new BufferAttribute( vertices, 3 ))
        const material = new MeshPhongMaterial( { color: 0xff0000 } );
        const mesh = new Mesh( geometry, material );
        scene.add( mesh );
        console.log(scene)
        //setupDatGui();
    });

    console.log(scene)

}

function loadFace(gltf){

    face = new SkinnedMesh();
    eyes = new MeshPhongMaterial();
    face.mesh = gltf.scene.children[0];
    eyes.mesh = gltf.scene.children[1];
    bones = face.mesh.children;
    skeleton = new Skeleton(bones);

    face.bind(skeleton);
    face.mesh.scale.multiplyScalar(5)
    eyes.mesh.scale.multiplyScalar(5)

    /*skeletonHelper = new SkeletonHelper(face.mesh);
	skeletonHelper.visible = true;
    skeletonHelper.material.linewidth = 2;*/
    //scene.add(face.mesh)
    scene.add(eyes.mesh)
    //scene.add(skeletonHelper)

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
function orderTargets(){

    //Order de targets with the same index as the bones
    const bones = face.skeleton.bones;
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
}

function midway(point1, point2){

    var m = new Vector3((point1.x + point2.x)/2, (point1.y + point2.y)/2, (point1.z + point2.z)/2)
    return m;
}

function setupDatGui() {

    
    gui = new GUI();

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
        const m = midway(bone.position, target.position);

        var name = bone.name;
        folder = gui.addFolder(name);

        //debugger;
        var origin_position = new Vector3(bone.position.x, bone.position.y, bone.position.z);
        bone.position.x = target.position.x;
        bone.position.y = target.position.y;
        bone.position.z = target.position.z;
        //debugger;
        folder.add( bone.position, 'x', origin_position.x, target.position.x );
        folder.add( bone.position, 'y', origin_position.y, target.position.y );
        folder.add( bone.position, 'z', origin_position.z, target.position.z );

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

    /*
    // Set up dat.GUI to control targets
    const params = {
        Spherify: 0,
    };
    const gui = new GUI();
    const folder = gui.addFolder( 'Morph Targets' );

    folder.add( params, 'Morph', 0, 1 ).step( 0.01 ).onChange( function ( value ) {
        debugger;
        face.mesh.morphTargetInfluences[ 0 ] = value;

    } );


    folder.open();*/

}

export function render() {

    requestAnimationFrame( render );

    //const time = Date.now() * 0.001;

    /*
    //Wiggle the bones
    if ( state.animateBones ) {

        for ( let i = 0; i < face.skeleton.bones.length; i ++ ) {

            face.skeleton.bones[ i ].rotation.z = Math.sin( time ) * 2 / face.skeleton.bones.length;

        }

    }*/

    renderer.render( scene, camera );

}
