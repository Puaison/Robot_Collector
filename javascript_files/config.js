

// Height of the Support robot base block where the robot is placed

export const support_robot_base_block_height = 0.4;

// DH parameters for UR5 robot

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
// Initial joints' configuration from which it is computed the rest joints' configuration through inverse kinematics
export const robot_initial_joints_values=[
     -Math.PI/2, 
     -Math.PI/2, 
     0, 
     0, 
     -Math.PI/2, 
     0
 ];
//Values used in the convergence of the inverse kinematics iterative algorithm
//Max accetable error between the target position and the current position computed by the inverse kinematics iterative algorithm
export const epsilon_position = 1e-4;
//Max accetable error between the target RPY orientation and the current RPY orientation computed by the inverse kinematics iterative algorithm
export const epislon_orientation = 1e-2;
//Mat iterations of the inverse kinematics iterative algorithm
export const max_iterations = 100;

// The fixed rest pose
export const rest_pose = [0.1,1.52,0.1,0,0,Math.PI/2];

// Floor values setup
export const floor_rows = 20;
export const floor_coloumns = 20;
export const floor_tile_size = 0.1;
export const floor_tile_height = 0.05;
export const floor_Width = floor_coloumns * floor_tile_size;   // 2.0
export const floor_Height = floor_tile_size;       // 0.05