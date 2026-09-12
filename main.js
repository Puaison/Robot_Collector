import * as THREE from 'three';
import { LoadingManager } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import GUI from 'lil-gui';
import { Matrix,inverse } from 'ml-matrix';

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

// BLOCK FOR THE ROBOT
const block_Height = 0.4;
const geometry_block = new THREE.BoxGeometry(0.15, block_Height, 0.15);
const material_block = new THREE.MeshStandardMaterial({ color: 0xC5AA4A });
const block = new THREE.Mesh(geometry_block, material_block);
block.position.set(0, block_Height/2, 0);
scene.add(block);

// LOADING UR5


const manager = new LoadingManager();
const loader = new URDFLoader(manager);
loader.packages = {
    ur_description: '/ur5/',
    robotiq_85_description: '/ur5/'
};

const robot_joints_values=[
     -Math.PI/2, 
     -Math.PI/2, 
     0, 
     0, 
     -Math.PI/2, 
     0
 ];

// const robot_joints_values=[
//     0, 
//     0, 
//     0, 
//     0, 
//     0, 
//     0
// ];
const prova_inverse_kin = true;

loader.load(
    '/ur5/ur5.urdf',
    robot => {
        ur5robot = robot;
        scene.add(robot);
        // Inverse Kinematics
        //const desired_T = extract_T_from_oriented_point (desidered_pose[0],desidered_pose[1],desidered_pose[2],desidered_pose[3],desidered_pose[4],desidered_pose[5]);

        //RPY
        const desidered_pose = [-0.5,0.1,-0.5,0,0,-Math.PI/2];
        //const final_q =inverse_Kinematics(desidered_pose,robot_joints_values,10000,0.06,1e-2,0.1);
        const temp_q =inverse_Kinematics(desidered_pose,robot_joints_values,10000,1e-4,1e-2);
        console.log ("INVERSE KINEMATICS RESULT",temp_q);
        const final_q = temp_q.map(angle => normalize_Angle(angle));

        if (prova_inverse_kin) {
            robot.setJointValue('shoulder_pan_joint', final_q[0]); //this rotate the base
            robot.setJointValue('shoulder_lift_joint', final_q[1]); // this make the robot up
            robot.setJointValue('elbow_joint', final_q[2]); // the "gomito"
            robot.setJointValue('wrist_1_joint', final_q[3]); 
            robot.setJointValue('wrist_2_joint', final_q[4]);
            robot.setJointValue('wrist_3_joint', final_q[5]); //rotation only of the tooltip
            console.log('UR5 loaded in IK!', robot);
        } else {
            robot.setJointValue('shoulder_pan_joint', robot_joints_values[0]); //this rotate the base
            robot.setJointValue('shoulder_lift_joint', robot_joints_values[1]); // this make the robot up
            robot.setJointValue('elbow_joint', robot_joints_values[2]); // the "gomito"
            robot.setJointValue('wrist_1_joint', robot_joints_values[3]); 
            robot.setJointValue('wrist_2_joint', robot_joints_values[4]);
            robot.setJointValue('wrist_3_joint', robot_joints_values[5]); //rotation only of the tooltip
            console.log('UR5 loaded normally!', robot);
        }

        // Rotatation of the mesh in order to stand on the floor
        robot.rotation.x = -Math.PI/2;
        // Robot in the center of the scene above the box
        robot.position.set(0, 0.4 , 0);


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

                let T_gripper = null;
                if(prova_inverse_kin) {
                    T_gripper = extract_T_from_q(final_q);
                    console.log("Entered 1");
                } else {
                    T_gripper = extract_T_from_q(robot_joints_values);
                    console.log("Entered 2");
                }
                const TCP_position = extract_position_from_T(T_gripper);
                const TCP_RPY = extract_RPY_from_T(T_gripper);


                const center_position = new THREE.Vector3();
                center.getWorldPosition(center_position);
                console.log("Real Position of the gripper:", center_position.x, center_position.y, center_position.z);
                console.log('Forward Kinematics Result of the gripper:', TCP_position);

                const quaternion_gripper = new THREE.Quaternion();
                center.getWorldQuaternion(quaternion_gripper);
                const RPY = new THREE.Euler();
                RPY.setFromQuaternion(quaternion_gripper, 'ZYX');
                console.log("Real Roll-pitch-yaw Gripper:", RPY.x, RPY.y, RPY.z);
                console.log('Roll-pitch-yaw calculation Result of the gripper:', TCP_RPY);

                // console.log("Computed T", T_gripper);
                // console.log("Real T", extract_T_from_oriented_point(center_position.x, center_position.y, center_position.z, RPY.x, RPY.y, RPY.z));
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

function extract_T_from_q(q) {

    // Place the robot above the box
    const T_y = new THREE.Matrix4().makeTranslation(0, block_Height, 0);

    // The URDF follows REP-103 conventions. Thus, we need to apply a rotation correction to the last joint orientation obtained by forward kinematics based on the original DH conventions
    const T_z = new THREE.Matrix4().makeRotationZ(Math.PI);

    // Three.js mesh rotation around x-axis in order to have the robot standing on the floor
    const T_x = new THREE.Matrix4().makeRotationX(-Math.PI/2);

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
        .multiply(T_y)
        .multiply(T_x)
        .multiply(T_z)
        .multiply(T01)
        .multiply(T12)
        .multiply(T23)
        .multiply(T34)
        .multiply(T45)
        .multiply(T56)
        .multiply(T6G);
    return T0G;
}

function extract_position_from_T(T){
    const x = T.elements[12];
    const y = T.elements[13];
    const z = T.elements[14];
    return {x, y, z};
}

function extract_RPY_from_T(T){
    const R = new THREE.Matrix4().extractRotation(T);
    const RPY = new THREE.Euler();
    RPY.setFromRotationMatrix(R, 'ZYX');
    const roll  = RPY.x;
    const pitch = RPY.y;
    const yaw   = RPY.z;
    return {roll, pitch, yaw};
}

function extract_T_from_oriented_point(x,y,z,roll,pitch,yaw) {
    const T = new THREE.Matrix4();
    const R = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(roll, pitch, yaw, 'ZYX'));
    T.copy(R);
    T.setPosition(x,y,z);
    return T;
}

function extract_pose_from_T(T) {
    const position = extract_position_from_T(T);
    const RPY = extract_RPY_from_T(T);
    return [
        position.x,
        position.y,
        position.z,
        RPY.roll,
        RPY.pitch,
        RPY.yaw
    ];
}

function normalize_Angle(angle) {

    while (angle>Math.PI) {
        angle -= 2 * Math.PI;
    }

    while (angle<-Math.PI) {
        angle += 2 * Math.PI;
    }

    return angle;
}

function get_pose_Error(targetPose, currentPose) {

    return [
        targetPose[0] - currentPose[0],
        targetPose[1] - currentPose[1],
        targetPose[2] - currentPose[2],

        normalize_Angle(targetPose[3] - currentPose[3]),
        normalize_Angle(targetPose[4] - currentPose[4]),
        normalize_Angle(targetPose[5] - currentPose[5])
    ];
}

function calculate_numerical_Jacobian(q, epsilon = 1e-4) {
    //const T_normal = extract_T_from_q(q);

    const T_plus_0 = extract_T_from_q(q.map((x, i) => i === 0 ? x + epsilon : x));
    const T_plus_1 = extract_T_from_q(q.map((x, i) => i === 1 ? x + epsilon : x));
    const T_plus_2 = extract_T_from_q(q.map((x, i) => i === 2 ? x + epsilon : x));
    const T_plus_3 = extract_T_from_q(q.map((x, i) => i === 3 ? x + epsilon : x));
    const T_plus_4 = extract_T_from_q(q.map((x, i) => i === 4 ? x + epsilon : x));
    const T_plus_5 = extract_T_from_q(q.map((x, i) => i === 5 ? x + epsilon : x));

    const T_minus_0 = extract_T_from_q(q.map((x, i) => i === 0 ? x - epsilon : x));
    const T_minus_1 = extract_T_from_q(q.map((x, i) => i === 1 ? x - epsilon : x));
    const T_minus_2 = extract_T_from_q(q.map((x, i) => i === 2 ? x - epsilon : x));
    const T_minus_3 = extract_T_from_q(q.map((x, i) => i === 3 ? x - epsilon : x));
    const T_minus_4 = extract_T_from_q(q.map((x, i) => i === 4 ? x - epsilon : x));
    const T_minus_5 = extract_T_from_q(q.map((x, i) => i === 5 ? x - epsilon : x));

    //const pose_normal = extract_pose_from_T(T_normal);

    const pose_plus_0 = extract_pose_from_T(T_plus_0);
    const pose_plus_1 = extract_pose_from_T(T_plus_1);
    const pose_plus_2 = extract_pose_from_T(T_plus_2);
    const pose_plus_3 = extract_pose_from_T(T_plus_3);
    const pose_plus_4 = extract_pose_from_T(T_plus_4);
    const pose_plus_5 = extract_pose_from_T(T_plus_5);

    const pose_minus_0 = extract_pose_from_T(T_minus_0);
    const pose_minus_1 = extract_pose_from_T(T_minus_1);
    const pose_minus_2 = extract_pose_from_T(T_minus_2);
    const pose_minus_3 = extract_pose_from_T(T_minus_3);
    const pose_minus_4 = extract_pose_from_T(T_minus_4);
    const pose_minus_5 = extract_pose_from_T(T_minus_5);

    let J = [
        [                pose_plus_0[0] - pose_minus_0[0],                 pose_plus_1[0] - pose_minus_1[0],                 pose_plus_2[0] - pose_minus_2[0],                 pose_plus_3[0] - pose_minus_3[0],                 pose_plus_4[0] - pose_minus_4[0],                 pose_plus_5[0] - pose_minus_5[0]],
        [                pose_plus_0[1] - pose_minus_0[1],                 pose_plus_1[1] - pose_minus_1[1],                 pose_plus_2[1] - pose_minus_2[1],                 pose_plus_3[1] - pose_minus_3[1],                 pose_plus_4[1] - pose_minus_4[1],                 pose_plus_5[1] - pose_minus_5[1]],
        [                pose_plus_0[2] - pose_minus_0[2],                 pose_plus_1[2] - pose_minus_1[2],                 pose_plus_2[2] - pose_minus_2[2],                 pose_plus_3[2] - pose_minus_3[2],                 pose_plus_4[2] - pose_minus_4[2],                 pose_plus_5[2] - pose_minus_5[2]],
        [normalize_Angle(pose_plus_0[3] - pose_minus_0[3]), normalize_Angle(pose_plus_1[3] - pose_minus_1[3]), normalize_Angle(pose_plus_2[3] - pose_minus_2[3]), normalize_Angle(pose_plus_3[3] - pose_minus_3[3]), normalize_Angle(pose_plus_4[3] - pose_minus_4[3]), normalize_Angle(pose_plus_5[3] - pose_minus_5[3])],
        [normalize_Angle(pose_plus_0[4] - pose_minus_0[4]), normalize_Angle(pose_plus_1[4] - pose_minus_1[4]), normalize_Angle(pose_plus_2[4] - pose_minus_2[4]), normalize_Angle(pose_plus_3[4] - pose_minus_3[4]), normalize_Angle(pose_plus_4[4] - pose_minus_4[4]), normalize_Angle(pose_plus_5[4] - pose_minus_5[4])],
        [normalize_Angle(pose_plus_0[5] - pose_minus_0[5]), normalize_Angle(pose_plus_1[5] - pose_minus_1[5]), normalize_Angle(pose_plus_2[5] - pose_minus_2[5]), normalize_Angle(pose_plus_3[5] - pose_minus_3[5]), normalize_Angle(pose_plus_4[5] - pose_minus_4[5]), normalize_Angle(pose_plus_5[5] - pose_minus_5[5])]
    ];
    J = J.map(row => row.map(x => x * (1/(2*epsilon))));
    return J;
}

function get_Tranpose_of_6x6_Matrix(J){
    const J_transpose = get_Identity_Matrix_6x6();
    for(let i=0; i<6; i++) {
        for(let j=0; j<6; j++){
            J_transpose[i][j]=J[j][i]
        }
    }
    return J_transpose
}

function get_Identity_Matrix_6x6(){
    const I = [
        [1,0,0,0,0,0],
        [0,1,0,0,0,0],
        [0,0,1,0,0,0],
        [0,0,0,1,0,0],
        [0,0,0,0,1,0],
        [0,0,0,0,0,1]
    ];
    return I
}

function get_Matrix_multiplication_6x6(A,B){
    const C = get_Identity_Matrix_6x6();
    C[0][0]=0;
    C[1][1]=0;
    C[2][2]=0;
    C[3][3]=0;
    C[4][4]=0;
    C[5][5]=0;

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            for (let k = 0; k < 6; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    
    return C;
}

function get_Matrix_Vector_multiplication_6x1(A,v){
    const result = [0,0,0,0,0,0];
    for (let i =0; i<6; i++){
        for(let j=0; j<6; j++){
            result[i] += A[i][j]*v[j];
        }
    }
    return result;
}

function get_Matrix_sum_6x6(A,B){
    const C = get_Identity_Matrix_6x6();
    C[0][0]=0;
    C[1][1]=0;
    C[2][2]=0;
    C[3][3]=0;
    C[4][4]=0;
    C[5][5]=0;

    for(let i=0; i<6; i++){
        for(let j=0; j<6;j++){
            C[i][j] = A[i][j] + B[i][j];
        }
    }
    return C;
}

function dumped_Least_Square(q,error_vector, lambda =0.05){
    const J = calculate_numerical_Jacobian(q);
    const JT= get_Tranpose_of_6x6_Matrix(J);
    const JJT= get_Matrix_multiplication_6x6(J,JT);
    //const I= get_Identity_Matrix_6x6();
    for (let i = 0; i < 6; i++) {
        JJT[i][i] += lambda * lambda;
    }

    //const Inv = get_inverse_Matrix(JJT);
    const JJT_Matrix = new Matrix(JJT);
    const JJT_Matrix_inverse = inverse(JJT_Matrix);
    const Inv = JJT_Matrix_inverse.to2DArray();

    const temp= get_Matrix_Vector_multiplication_6x1(Inv,error_vector);
    const result = get_Matrix_Vector_multiplication_6x1(JT,temp);
    return result;

}

function inverse_Kinematics(target_pose,initial_q, max_Iterations =100,position_tolerance=1e-4,orientation_tolerance=1e-4, lambda = 0.05){
    //const target_pose = extract_pose_from_T(target_T);
    let actual_q= [...initial_q];
    //let actual_q= initial_q;
    for(let it = 0; it < max_Iterations; it++){
        const actual_T= extract_T_from_q(actual_q);
        const actual_pose= extract_pose_from_T(actual_T);
        const pose_error = get_pose_Error(target_pose,actual_pose);

        const position_error = Math.sqrt(pose_error[0] ** 2 + pose_error[1] ** 2 + pose_error[2] ** 2);

        const orientation_error = Math.sqrt(pose_error[3] ** 2 + pose_error[4] ** 2 + pose_error[5] ** 2);

        if (position_error < position_tolerance && orientation_error < orientation_tolerance) {
            console.log("Inverse Kinematics converged in",it,"iterations");

            return actual_q;
        }

        const dq = dumped_Least_Square(actual_q,pose_error,lambda);
        for (let i = 0; i < 6; i++) {
            actual_q[i] += dq[i];
        }
    }
    console.warn("Inverse Kinematics did not converge");

    return actual_q;
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


    // Roll, Pitch, Yaw
    const e = new THREE.Euler();

    e.setFromRotationMatrix(R_corrected, 'ZYX');

    const roll  = e.x;
    const pitch = e.y;
    const yaw   = e.z;
    console.log("Roll_Gripper_calculated:", roll, "Pitch_Gripper_calculated:", pitch, "Yaw_Gripper_calculated:", yaw);


    return {position: {x, y, z}, orientation: orientation};
}