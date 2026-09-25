import { inverse_Kinematics } from "./inverse_kinematics";
import { normalize_angle_enhanced} from "./utils";

// Height of the block where the robot is placed

export const block_Height = 0.4;

// DH parameters for UR5

export const DH_A = [
    0.0,
    -0.425,
    -0.39225,
    0.0,
    0.0,
    0.0
];

export const DH_D = [
    0.089159,
    0.0,
    0.0,
    0.10915,
    0.09465,
    0.0823
];

export const DH_ALPHA = [
    Math.PI/2,
    0.0,
    0.0,
    Math.PI/2,
    -Math.PI/2,
    0.0
];

export const robot_initial_joints_values=[
     -Math.PI/2, 
     -Math.PI/2, 
     0, 
     0, 
     -Math.PI/2, 
     0
 ];

export const prova_inverse_kin = true;

export const epsilon_position = 1e-4;

export const epislon_orientation = 1e-2;

export const max_iterations = 100;

// calculate rest pose
export const rest_pose = [0.1,1.52,0.1,0,0,Math.PI/2];
// const temp_rest_q =inverse_Kinematics(rest_pose,robot_initial_joints_values,max_iterations, epsilon_position, epislon_orientation);
// export const rest_q = temp_rest_q.map(angle => normalize_angle_enhanced(angle));

// Floor setup
export const floor_rows = 20;
export const floor_coloumns = 20;
export const floor_tile_size = 0.1;
export const floor_tile_height = 0.05;
export const floor_Width = floor_coloumns * floor_tile_size;   // 2.0
export const floor_Height = floor_tile_size;       // 0.05