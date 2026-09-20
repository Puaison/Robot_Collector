import * as THREE from 'three';
import { normalize_Angle } from "./javascript_files/utils.js"
import { robot_initial_joints_values,prova_inverse_kin, max_iterations, epsilon_position, epislon_orientation, rest_q, floor_rows, floor_coloumns, floor_tile_size, floor_tile_height } from './javascript_files/config.js';
import { extract_T_from_q, extract_position_from_T, extract_RPY_from_T } from './javascript_files/direct_kinematics.js';
import { inverse_Kinematics } from './javascript_files/inverse_kinematics.js';
import {ur5robot, ur5gripper, renderer, floor_Visual, load_Robot, load_Gripper, animate,move_Threejs_Robot,scene, open_close_Threejs_Gripper,ur5finger_sensor_left_mesh,ur5finger_sensor_right_mesh,ur5finger_sensor_left_Ammo, ur5finger_sensor_right_Ammo, collectable_cube_mesh, collectable_cube_Ammo,create_collectable_object,set_cube_Ammo,set_cube_mesh,gripper_closed_value} from './javascript_files/scene_controller.js'

async function init() {
    await load_Robot();
    await load_Gripper();
    const mid_pose = [0.5,0.3,0.5,-Math.PI/2,0,-Math.PI/2];
    let temp_q =inverse_Kinematics(mid_pose,rest_q,max_iterations, epsilon_position, epislon_orientation);
    const mid_q = temp_q.map(angle => normalize_Angle(angle));

    const final_pose = [0.5,0.02,0.485,-Math.PI/2,0,-Math.PI/2]; // 0.015
    temp_q=inverse_Kinematics(final_pose,rest_q,max_iterations, epsilon_position, epislon_orientation);
    const final_q=temp_q.map(angle => normalize_Angle(angle));
    //await move_Threejs_Robot(robot_initial_joints_values, rest_q,ur5robot, 5000);
    await move_Threejs_Robot(rest_q,mid_q,ur5robot,1000);
    await move_Threejs_Robot(mid_q,final_q,ur5robot,1000);

    // Collectable object
    const collectable=create_collectable_object();
    set_cube_mesh(collectable[0]);  
    set_cube_Ammo(collectable[1]);
    //


    await open_close_Threejs_Gripper(0,0.6,ur5gripper,1000);

    const move_pose = [0.90,0.3,0.0,-Math.PI/2,0,-Math.PI/2];
    temp_q=inverse_Kinematics(move_pose,final_q,max_iterations, epsilon_position, epislon_orientation);
    const move_q=temp_q.map(angle => normalize_Angle(angle));

    await move_Threejs_Robot(final_q,move_q,ur5robot,1000);

    await open_close_Threejs_Gripper(gripper_closed_value,0.0,ur5gripper,5000);

    // PLOT
    const center = ur5gripper.links["dummy_center_indicator_link"];

    let T_gripper = null;
    if(prova_inverse_kin) {
        T_gripper = extract_T_from_q(final_q);
    } else {
        T_gripper = extract_T_from_q(robot_initial_joints_values);
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
}


renderer.setAnimationLoop(animate);


init();