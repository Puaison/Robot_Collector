import { rest_pose,support_robot_base_block_height,robot_initial_joints_values,max_iterations, epsilon_position, epislon_orientation } from '../javascript_files/config';
import { MRobot } from '../Model/MRobot';
import { VRobot } from '../View/VRobot';
import { VScene } from '../View/VScene';
import { CGripper } from './CGripper';
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
     * Method that loads the URDF Mesh of the Robot and of the Gripper and that syncronizes value between the View and the Model Package
     */
    async load_CRobot(){
        await this.#cgripper.load_CGripper(this.#vrobot.get_loader());
        this.#mrobot.set_MGripper(this.#cgripper.get_MGripper()); //Now if we query the MRobot, it will also take into account the gripper for the direct kinematics
        //From now on the robot will use also the gripper in the direct kinematic function
        this.#rest_q=this.#mrobot.inverse_Kinematics(rest_pose,robot_initial_joints_values,max_iterations, epsilon_position, epislon_orientation);
        this.#vrobot.set_last_q_configuration(this.#rest_q);
        this.#mrobot.set_last_q_configuration(this.#rest_q);

        await this.#vrobot.load_VRobot();
        VScene.getInstance().add_mesh(this.#vrobot.get_robot_mesh());
        this.#vrobot.get_robot_mesh().joints["wrist_3_joint"].add(this.#cgripper.get_VGripper().get_gripper_mesh());
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