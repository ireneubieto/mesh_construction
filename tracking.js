import {
    Vector3
} from '/meshconstruction/three.js/build/three.module.js';

let face_model;
let webcam
let webcamElement = document.getElementById("webcam")

var center_annotations;

import {
    initScene,
    render,
    setTargets,
    edit,
    downloadModel
} from '/meshconstruction/application.js';

import {
    adjust,
    initAdjustScene,
    makeAdjustMesh,
    getFinalMesh,
    stopRendering
} from '/meshconstruction/adjust.js';

function sendVertex(){
    var trackedVertex = [];
    Object.keys(center_annotations).forEach(function(key) {
        const item = center_annotations[key];
        for (let  i = 0; i < item.length; i++){
            const [x, y, z] = item[i];
            trackedVertex.push(x);
            trackedVertex.push(y);
            trackedVertex.push(z);
        }  
    });
    makeAdjustMesh(trackedVertex);
}
function centerPoints(distanceX, distanceY, distanceZ, annotations){

    center_annotations = annotations;
    Object.keys(annotations).forEach(function(key) {
        const item = annotations[key];
        for (let  i = 0; i < item.length; i++){
            const [x, y, z] = item[i];
            var x_final = (-x + distanceX)/50;
            var y_final = (-y + distanceY)/50;
            var z_final = (-z + distanceZ)/50;
            center_annotations[key][i] = [x_final, y_final, z_final]
        }  
    });

}
function createVertexVector(finalVector){

    var VertexVector = [];
    for (let i = 0; i < finalVector.length; i+=3){
        var v = new Vector3(finalVector[i], finalVector[i+1], finalVector[i+2]);
        VertexVector.push(v);
    }
    var nameVector = [];
    Object.keys(center_annotations).forEach(function(key) {
        const item = center_annotations[key];
        for (let  i = 0; i < item.length; i++){
            var name;
            if (item.length > 1){

                var current_key = key;

                if (key == "leftEyebrowLower"){
                    current_key = "leftEyebrowUpper";
                } else if (key == "rightEyebrowLower"){
                    current_key = "rightEyebrowUpper";
                } else if (key == "leftEyebrowUpper"){
                    current_key = "leftEyebrowLower";
                } else if (key == "rightEyebrowUpper"){
                    current_key = "rightEyebrowLower";
                }

                function padLeadingZeros(num, size) {
                    var s = num + "";
                    while (s.length < size) s = "0" + s;
                    return s;
                }
                var num = padLeadingZeros(i, 3);// "057"
                name = current_key.concat(num);
            }
            else {
                name = key;
            }
            nameVector.push(name);
        }  
    });
    return [VertexVector,nameVector];

}
function sendTargets(){

    var finalVertex = getFinalMesh();
    var [finalPos, nameVector] = createVertexVector(finalVertex);
    for (let i = 0; i < finalPos.length; i++){
        setTargets(finalPos[i].x, finalPos[i].y, finalPos[i].z, nameVector[i]);
    }
}

async function capture() {

    let a = [], b = [], c = [];

    const img = await webcam.capture();
    const predictions = await face_model.estimateFaces(img);

    //debugger;
    if (predictions.length > 0) {
        
        a = []; b = []; c = [];

        const annotations = predictions[0].annotations;
        const [distanceX, distanceY, distanceZ] = annotations["midwayBetweenEyes"][0];
        //Obtain annotations vertices and create center annotations vector
        centerPoints(distanceX, distanceY, distanceZ, annotations);
        //Create mesh out of centered points to adjust the tracked mesh
        sendVertex();
    }

    initAdjustScene();
    adjust();
}

function editCanvas(){
    document.getElementById("webcam").width = "300";
    document.getElementById("webcam").height = "300";
    document.getElementById("cam-area").style.width = "30%";
    document.getElementById("cam-area").style.marginRight = "10px";
    document.getElementById("cam-area").style.marginLeft = "-20px";
    document.getElementById("cam-area").style.left = "0px";
}

async function main() {
    // Load the MediaPipe facemesh model.
    face_model = await facemesh.load();
    console.log("Model loaded")

    webcam = await tf.data.webcam(webcamElement);
    const imgtemp = await webcam.capture();
    imgtemp.dispose()

    document.getElementById("capture").addEventListener("click", function () {
        capture();
        editCanvas();
        document.getElementById("edit-area").style.display = "block";
        document.getElementById("adjust-btn").style.display = "block";
        document.getElementById("capture").style.display = "none";
    })
    document.getElementById("adjust-btn").addEventListener("click", function () {
        sendTargets();
        stopRendering();
        document.getElementById("adjust-btn").style.display = "none";
        document.getElementById("adjust").style.display = "none";
        document.getElementById("canvas").style.display = "block";
        document.getElementById("edit-btn").style.display = "block";
        initScene();
        render();
    })
    document.getElementById("edit-btn").addEventListener("click", function () {
        edit();
        document.getElementById("edit-btn").style.display = "none";
        document.getElementById("download-btn").style.display = "block";
    })
    document.getElementById("download-btn").addEventListener("click", function () {
        downloadModel();
    })

}

main();
