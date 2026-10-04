import { rest_pose,support_robot_base_block_height,robot_initial_joints_values,max_iterations, epsilon_position, epislon_orientation } from '../javascript_files/config.js';
import { MRobot } from '../Model/MRobot.js';
import { VRobot } from '../View/VRobot.js';
import { VScene } from '../View/VScene.js';
import { CGripper } from './CGripper.js';
/**
 * This class is the controller of the robot. It assists the process of loading correctly the informations and syncronizing them between the View and Model Packages.
 * 
 * Responsibility: It loads the gripper and syncronizes the data at the beginning. It contains all the data (used by CScene) for correctly managing the robot and the gripper between the Model and View Packages
 * @see MRobot
 * @see VRobot
 * @see CGripper
 */
export class CRobot{
    /** @type {MRobot} The MRobot object managed by this controller */
    #mrobot=null;
    /** @type {VRobot} The VRobot object managed by this controller */
    #vrobot=null;
    /** @type {CGripper} The CGripper object managed by this controller */
    #cgripper=null; // From here we can access both vgripper and mgripper
    /** @type {Array_of_float} The robot configuration in which it is waiting for input */
    #rest_q=null; 

    /**
     * Create the robot both in the View and in the Model packages. It will be placed at the center of the world frame (and the base parallel to the ground) with a vertical offset due to the support block
     * @param {float} offset height of the support base block for the robot
     */
    constructor(offset = support_robot_base_block_height) {
        this.#vrobot = new VRobot(offset);
        this.#mrobot = new MRobot(offset);
        this.#cgripper= new CGripper();
    }
    /**
     * Method that loads the URDF Mesh of the Robot and of the Gripper and that syncronizes values between the View and the Model Package
     */
    async load_CRobot(){
        //Wait the gripper to correctly load
        await this.#cgripper.load_CGripper(this.#vrobot.get_loader());
        //Assign to the kinematic model of the robot the gripper
        this.#mrobot.set_MGripper(this.#cgripper.get_MGripper()); //Now when the MRobot is queried, it will also take into account the gripper for the direct kinematics
        
        // Compute the joints' configuration for the rest pose 
        this.#rest_q=this.#mrobot.inverse_Kinematics(rest_pose,robot_initial_joints_values,max_iterations, epsilon_position, epislon_orientation);
        //Set the robot in the rest pose
        this.#vrobot.set_last_q_configuration(this.#rest_q);
        this.#mrobot.set_last_q_configuration(this.#rest_q);

        //Wait the mesh of the robot to correctly load
        await this.#vrobot.load_VRobot();
        // Add the mesh of the robot to the scene
        VScene.getInstance().add_mesh(this.#vrobot.get_robot_mesh());
        // Add the gripper mesh to the hierarchical model of the robot mesh
        this.#vrobot.get_robot_mesh().joints["wrist_3_joint"].add(this.#cgripper.get_VGripper().get_gripper_mesh());
        //Set the gripper to the open configuration
        this.#cgripper.get_VGripper().set_last_gripper_value(0.0);
        this.#cgripper.get_MGripper().set_last_gripper_value(0.0);
    }

    get_CGripper(){
        return this.#cgripper;
    }

    get_VRobot() {
        return this.#vrobot;
    }

    get_MRobot() {
        return this.#mrobot;
    }

    get_rest_q(){
        return this.#rest_q;
    }
}