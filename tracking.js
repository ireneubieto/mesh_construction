import {
    Vector3
} from '/three.js/build/three.module.js';

let face_model;
let webcam
let webcamElement = document.getElementById("webcam")
let capturing = false

var center_annotations;
var adjust_annotations;

import {
    initScene,
    render,
    setTargets
} from '/application.js';

import {
    adjust,
    initAdjustScene,
    makeAdjustMesh,
    getFinalMesh,
    stopRendering
} from '/adjust.js';

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
            var x_final = (-x + distanceX)/20;
            var y_final = (-y + distanceY)/20;
            var z_final = (-z + distanceZ)/20;
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

    //We will exectute the while loop for 5 seconds
    var time_start = performance.now();
    var time_finish = time_start + 5000;

    //while (performance.now() < time_finish) {
        const img = await webcam.capture();
        const predictions = await face_model.estimateFaces(img);

        //debugger;
        if (predictions.length > 0) {
           
            a = []; b = []; c = [];
            //for (let i = 0; i < predictions.length; i++) {

                //const annotations = predictions[i].annotations;
                const annotations = predictions[0].annotations;
                const [distanceX, distanceY, distanceZ] = annotations["midwayBetweenEyes"][0];
                //Obtain annotations vertices and create center annotations vector
                centerPoints(distanceX, distanceY, distanceZ, annotations);
                //Create mesh out of centered points to adjust the tracked mesh
                sendVertex();
                //addMesh1(center_annotations);
                /*
                Object.keys(annotations).forEach(function(key) {
                    const item = annotations[key];
                    for (let  i = 0; i < item.length; i++){
                        const [x, y, z] = item[i];
                        var x_final = (-x + distanceX)/20;
                        var y_final = (-y + distanceY)/20;
                        var z_final = (-z + distanceZ)/20;
                        var name;
                        if (item.length > 1){

                            function padLeadingZeros(num, size) {
                                var s = num + "";
                                while (s.length < size) s = "0" + s;
                                return s;
                            }
                            var num = padLeadingZeros(i, 3);// "057"
                            name = key.concat(num);
                        }
                        else {
                            name = key;
                        }
                        //makeBones(x_final,y_final,z_final,name)
                    }  
                });*/
            //}
        }
    //}
    initAdjustScene();
    adjust();
    //makeMesh();
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
        //init2DScene();
        //adjust();
        document.getElementById("adjust-btn").style.display = "block";
        //initScene();
        //render(); 
    })
    document.getElementById("adjust-btn").addEventListener("click", function () {
        sendTargets();
        stopRendering();
        document.getElementById("adjust-btn").style.display = "none";
        initScene();
        render();
    })

}


main();