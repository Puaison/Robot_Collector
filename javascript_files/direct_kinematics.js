import * as THREE from 'three';
import { block_Height, DH_A, DH_D,  DH_ALPHA } from "./config.js"

export function DHMatrix(a, d, alpha, q_i) {
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

export function extract_T_from_q(q) {

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

export function extract_position_from_T(T){
    const x = T.elements[12];
    const y = T.elements[13];
    const z = T.elements[14];
    return {x, y, z};
}

export function extract_RPY_from_T(T){
    const R = new THREE.Matrix4().extractRotation(T);
    const RPY = new THREE.Euler();
    RPY.setFromRotationMatrix(R, 'XYZ');
    const roll  = RPY.x;
    const pitch = RPY.y;
    const yaw   = RPY.z;
    return {roll, pitch, yaw};
}

export function extract_pose_from_T(T) {
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

export function extract_T_from_oriented_point(x,y,z,roll,pitch,yaw) {
    const T = new THREE.Matrix4();
    const R = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(roll, pitch, yaw, 'XYZ'));
    T.copy(R);
    T.setPosition(x,y,z);
    return T;
}