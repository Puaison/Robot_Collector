import * as THREE from 'three';
import { LoadingManager } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import GUI from 'lil-gui';

// DH parameters for UR5

const DH_A = [
    0.0,
    -0.425,
    -0.39225,
    0.0,
    0.0,
    0.0
];

const DH_D = [
    0.089159,
    0.0,
    0.0,
    0.10915,
    0.09465,
    0.0823
];

const DH_ALPHA = [
    Math.PI/2,
    0.0,
    0.0,
    Math.PI/2,
    -Math.PI/2,
    0.0
];

let ur5robot = null;
let ur5gripper = null;


// SCENE


const scene = new THREE.Scene();
scene.background = new THREE.Color(0xC5A643);

// LIGHTS


const light1 = new THREE.DirectionalLight(0xffffff,2); //2 is the intensity of the light
const light2 = new THREE.DirectionalLight(0xffffff,2);
const light3 = new THREE.DirectionalLight(0xffffff,2);
const light4 = new THREE.DirectionalLight(0xffffff,2);
light1.position.set(-1, 1, -1);
light2.position.set(1, 1, -1);
light3.position.set(-1, 1, 1);
light4.position.set(1, 1, 1);
scene.add(light1);
scene.add(light2);
scene.add(light3);
scene.add(light4);


// CAMERA


const camera = new THREE.PerspectiveCamera(
    45, //fov
    window.innerWidth / window.innerHeight, //aspect
    0.01, //near
    500 //far
);
camera.position.set(1, 2, 2);
//camera.lookAt(-5, -5, -5);



// GUI
const gui= new GUI();
gui.add(camera, 'fov', 1, 180).onChange(animate);



// RENDERER

const renderer = new THREE.WebGLRenderer(); //it will also create a canvas
renderer.setSize(window.innerWidth, window.innerHeight); // define the size of the canvas
document.body.appendChild(renderer.domElement); // add the canvas to the DOM

// Controls of the camera
const cameracontrols = new OrbitControls(camera, renderer.domElement);
cameracontrols.minDistance = 0.1;
cameracontrols.maxDistance = 5;

// FLOOR
const floor = new THREE.Group();

const rows = 20;
const cols = 20;
const tile_size = 0.1;
const tile_height = 0.05;

for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {

        const tile_geometry = new THREE.BoxGeometry(
            tile_size,
            tile_height,
            tile_size
        );

        let tile_color;
        if ((i + j)%2 == 0) {
            tile_color = new THREE.MeshStandardMaterial({color: 0x000000}); 
        }
        else {
            tile_color = new THREE.MeshStandardMaterial({color: 0xC5AA4A}); 
        }

        const tile = new THREE.Mesh(tile_geometry, tile_color);

        tile.position.set(
            (j - cols/2 + 0.5) * tile_size,
            -tile_height/2 ,
            (i - rows/2 + 0.5) * tile_size
        );

        floor.add(tile);
    }
}

// LOADING UR5


const manager = new LoadingManager();
const loader = new URDFLoader(manager);
loader.packages = {
    ur_description: '/ur5/',
    robotiq_85_description: '/ur5/'
};

loader.load(
    '/ur5/ur5.urdf',
    robot => {
        ur5robot = robot;
        scene.add(robot);
        //console.log(robot.joints);
        robot.setJointValue('shoulder_pan_joint', -Math.PI/2); //this rotate the base
        robot.setJointValue('shoulder_lift_joint', -Math.PI/2); // this make the robot up
        robot.setJointValue('elbow_joint', 2); // the "gomito"
        robot.setJointValue('wrist_1_joint', Math.PI/2); 
        robot.setJointValue('wrist_2_joint', 1);
        robot.setJointValue('wrist_3_joint', 0); //rotation only of the tooltip
        console.log('UR5 loaded!', robot);

        // Rotatation of the mesh in order to stand on the floor
        robot.rotation.x = -Math.PI/2;
        // Robot in the center of the scene
        robot.position.set(0, 0 , 0);
        const fk = complete_forwardKinematics([
            -Math.PI/2, 
            -Math.PI/2, 
            2, 
            Math.PI/2, 
            1, 
            0
        ]);
        console.log('Forward Kinematics Result:', fk.position);
        console.log('Quaternion calculation Result:', fk.orientation);


        const lastJoint = robot.joints["wrist_3_joint"];
        const lastJoint_position = new THREE.Vector3();
        lastJoint.getWorldPosition(lastJoint_position);
        console.log("Real Position of the joint:", lastJoint_position.x, lastJoint_position.y, lastJoint_position.z);
        const quaternion_joint = new THREE.Quaternion();
        lastJoint.getWorldQuaternion(quaternion_joint);
        const R_real = new THREE.Matrix4().makeRotationFromQuaternion(quaternion_joint);
        //console.log("R_real:", R_real);
        console.log("Real Quaternion Joint:", quaternion_joint.x, quaternion_joint.y, quaternion_joint.z, quaternion_joint.w);

        loader.load(
            '/ur5/robotiq_85_gripper_simple.urdf',
            gripper => {
                ur5gripper = gripper;


                //gripper.setJointValue('robotiq_85_left_knuckle_joint', 0.7); // the first
                //gripper.setJointValue('robotiq_85_right_knuckle_joint', 0.5);
                //gripper.setJointValue('robotiq_85_left_finger_joint', 10); // it does not work
                //gripper.setJointValue('robotiq_85_left_inner_knuckle_joint', 0.7); // it works strange but not specular
                //gripper.setJointValue('robotiq_85_left_finger_tip_joint', 0.7); // it works strange but not specular

                // Mesh setup for the gripper
                gripper.position.set(0, 0.0, 0.137);
                gripper.rotation.y = -Math.PI/2;

                robot.joints["wrist_3_joint"].add(gripper);
                const center = gripper.links["dummy_center_indicator_link"];

                const center_position = new THREE.Vector3();

                center.getWorldPosition(center_position);
                console.log("Real Position of the gripper:", center_position.x, center_position.y, center_position.z);

                const quaternion_gripper = new THREE.Quaternion();
                center.getWorldQuaternion(quaternion_gripper);
                const R_real_gripper = new THREE.Matrix4().makeRotationFromQuaternion(quaternion_gripper);
                //console.log("R_real_gripper:", R_real_gripper);
                console.log("Real Quaternion Gripper:", quaternion_gripper.x, quaternion_gripper.y, quaternion_gripper.z, quaternion_gripper.w);
            },
            undefined,
            error => {
                console.error('Error in the loading of the gripper', error);
            }
        );

    },
    undefined,
    error => {
        console.error('Error in the loading of the robot', error);
    }
);



scene.add(floor);



function animate(time) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  cameracontrols.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

function DHMatrix(a, d, alpha, q_i) {
    const cq = Math.cos(q_i);
    const sq = Math.sin(q_i);
    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);

    return new THREE.Matrix4().set(
        cq,      -sq * ca,   sq * sa,    a * cq,
        sq,       cq * ca,  -cq * sa,    a * sq,
         0,            sa,        ca,         d,
         0,             0,         0,          1
    );
}

function complete_forwardKinematics(q) {

    // Create the six DH matrices for each joint
    const T01 = DHMatrix(
        DH_A[0],
        DH_D[0],
        DH_ALPHA[0],
        q[0]
    );

    const T12 = DHMatrix(
        DH_A[1],
        DH_D[1],
        DH_ALPHA[1],
        q[1]
    );

    const T23 = DHMatrix(
        DH_A[2],
        DH_D[2],
        DH_ALPHA[2],
        q[2]
    );

    const T34 = DHMatrix(
        DH_A[3],
        DH_D[3],
        DH_ALPHA[3],
        q[3]
    );

    const T45 = DHMatrix(
        DH_A[4],
        DH_D[4],
        DH_ALPHA[4],
        q[4]
    );

    const T56 = DHMatrix(
        DH_A[5],
        DH_D[5],
        DH_ALPHA[5],
        q[5]
    );

    //Rotation of the frame of the gripper to attach it to the robot
    const T6G = new THREE.Matrix4().makeRotationY(-Math.PI/2);
    T6G.setPosition(0,0,0.137);

    // Obtain the Final DH Canonical Transformation Matrix for the gripper

    const T0G = new THREE.Matrix4()
        .multiply(T01)
        .multiply(T12)
        .multiply(T23)
        .multiply(T34)
        .multiply(T45)
        .multiply(T56)
        .multiply(T6G);


    // Extract last joint position based on the original DH conventions

    const x_original = T0G.elements[12];
    const y_original = T0G.elements[13];
    const z_original = T0G.elements[14];

    // Adjusting the position to match the uploaded URDF model's conventions and the three.js rotation around x-axis
    const x = -x_original;
    const y = z_original;
    const z = y_original;


    // The URDF follows REP-103 conventions. Thus, we need to apply a rotation correction to the last joint orientation obtained by forward kinematics based on the original DH conventions
    const R_z = new THREE.Matrix4().makeRotationZ(Math.PI);

    // Three.js mesh rotation around x-axis in order to have the robot standing on the floor
    const R_x = new THREE.Matrix4().makeRotationX(-Math.PI/2);

    // Final correction matrix to be applied to the DH final matrix
    const R_correction = new THREE.Matrix4().multiply(R_x).multiply(R_z);

    const R_DH = new THREE.Matrix4().extractRotation(T0G);

    const R_corrected = new THREE.Matrix4()
        .multiply(R_correction)
        .multiply(R_DH);
        //.multiply(R_y);
    
    console.log("R_corrected:", R_corrected);
    //console.log("R_DH:", R_DH);

    
    const orientation = new THREE.Quaternion();
    orientation.setFromRotationMatrix(R_corrected);



    return {position: {x, y, z}, orientation: orientation};
}