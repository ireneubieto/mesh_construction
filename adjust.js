import {
    Raycaster,
    Vector2,
    WebGLRenderer,
    Scene,
    Color,
    PerspectiveCamera,
    Group,
    Sprite,
    SpriteMaterial,
    TextureLoader,
    MeshPhongMaterial,
    MeshBasicMaterial,
    MeshStandardMaterial,
    DirectionalLight,
    OrthographicCamera,
    PointsMaterial,
    BufferGeometry,
    BufferAttribute,
    Points,
    PointLight,
    SkinnedMesh,
    Skeleton,
    SkeletonHelper,
    Mesh
} from '/three.js/build/three.module.js';
import { OrbitControls } from '/three.js/examples/jsm/controls/OrbitControls.js';
import { GUI } from '/three.js/examples/jsm/libs/dat.gui.module.js';
import { GLTFLoader } from '/three.js/examples/jsm/loaders/GLTFLoader.js';

let renderer, scene, camera;
var visibleMesh, trackedMesh, trackedBones;
let controls, group;

let selectedObject = null;
const raycaster = new Raycaster();
const mouse = new Vector2();
var draggable_front = [];
var draggable_info_front = [];
var draggable_profile = [];
var draggable_info_profile = [];
let enableSelection = false;

var container = document.getElementById("adjust");

var pointMesh = [];
var marks = [];

var face, eyes, rect;
var isRendering = true;

export function initAdjustScene() {

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
    
    var orbit = new OrbitControls( camera, renderer.domElement );
    orbit.enablePan = false;
    orbit.enableZoom = true;
    orbit.target.set( 0, 1, 0 );
    orbit.update();

    //Place lights
    var lights = [];
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
        scene.add(trackedMesh);
        console.log(trackedMesh)
        setupDatGui();
    });

}

function loadFace(gltf){

    var face = new SkinnedMesh();
    var eyes = new MeshPhongMaterial();
    face.mesh = gltf.scene.children[0];
    eyes.mesh = gltf.scene.children[1];
    var bones = face.mesh.children;
    var skeleton = new Skeleton(bones);

    face.bind(skeleton);
    face.mesh.scale.multiplyScalar(5)
    eyes.mesh.scale.multiplyScalar(5)

    /*skeletonHelper = new SkeletonHelper(face.mesh);
	skeletonHelper.visible = true;
    skeletonHelper.material.linewidth = 2;*/
    scene.add(face.mesh)
    scene.add(eyes.mesh)
    //scene.add(skeletonHelper)

}

function setupDatGui() {

    // Set up dat.GUI to adjust tracked mesh
    const gui = new GUI();
    const folder = gui.addFolder( 'Adjust Tracked Mesh' );
    folder.add( trackedMesh.position, 'x', -10, 10, 0.1);
    folder.add( trackedMesh.position, 'y', -10, 10, 0.1);
    folder.add( trackedMesh.position, 'z', -10, 10, 0.1);
    folder.__controllers[ 0 ].name( "position.x" );
    folder.__controllers[ 1 ].name( "position.y" );
    folder.__controllers[ 2 ].name( "position.z" );

    folder.add( trackedMesh.scale, 'x', -10, 10, 0.1);
    folder.add( trackedMesh.scale, 'y', -10, 10, 0.1);
    folder.add( trackedMesh.scale, 'z', -10, 10, 0.1);
    folder.__controllers[ 3 ].name( "scale.x" );
    folder.__controllers[ 4 ].name( "scale.y" );
    folder.__controllers[ 5 ].name( "scale.z" );

    folder.add( trackedMesh.rotation, 'x', -5, 5, 0.01);
    folder.add( trackedMesh.rotation, 'y', -5, 5, 0.01);
    folder.add( trackedMesh.rotation, 'z', -5, 5, 0.01);
    folder.__controllers[ 6 ].name( "rotation.x" );
    folder.__controllers[ 7 ].name( "rotation.y" );
    folder.__controllers[ 8 ].name( "rotation.z" );

    folder.open();
    console.log(folder)

}

export function getFinalMesh(){
    trackedMesh.geometry.applyMatrix4(trackedMesh.matrix);
    trackedMesh.geometry.needsUpdate = true;
    return trackedMesh.geometry.attributes.position.array;
}


export function makeAdjustMesh(trackedVertex){

    const geometry = new BufferGeometry();
    const vertices = new Float32Array(trackedVertex)
    geometry.setAttribute('position', new BufferAttribute( vertices, 3 ))
    const material = new MeshBasicMaterial( { color: 0x000000, wireframe: true } );
    trackedMesh = new Mesh( geometry, material );

}


// Three.js render loop
export function adjust() {
    if (isRendering){
        requestAnimationFrame(adjust);
        renderer.render(scene, camera);
    }
}
export function stopRendering(){
    isRendering = false;
}

