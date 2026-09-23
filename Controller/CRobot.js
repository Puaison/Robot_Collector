import { rest_q,block_Height } from '../javascript_files/config';
import { MRobot } from '../Model/MRobot';
import { VRobot } from '../View/VRobot';
import { VScene } from '../View/VScene';
import { CGripper } from './CGripper';
/**
 * This class is the controller of the robot. It assists the process of loading correctly the informations and syncronizing them between the View and Model Packages
 * 
 * Responsibility: It loads the gripper and syncronizes the data at the beginning. It contains all the data (used by CScene) for correctly managing the robot and the gripper between the Model and View Packages
 */
export class CRobot{
    #mrobot=null;
    #vrobot=null;
    #cgripper=null; // From here we can access both vgripper and mgripper
    #cube_collected=null; //Maybe not necessary as managed by CScene

    constructor(offset = block_Height) {
        this.#vrobot = new VRobot(offset);
        this.#mrobot = new MRobot(offset);
    }
    /**
     * Method that loads the URDF Mesh of the Robot and of the Gripper and that syncronizes value between the View and the Model Package
     */
    async load_CRobot(){
        await this.#vrobot.load_VRobot();
        VScene.getInstance().add_mesh(this.#vrobot.get_robot_mesh());
        this.#cgripper= new CGripper();
        await this.#cgripper.load_CGripper(this.#vrobot.get_loader());
        this.#vrobot.get_robot_mesh().joints["wrist_3_joint"].add(this.#cgripper.get_VGripper().get_gripper_mesh());

        this.#mrobot.set_MGripper(this.#cgripper.get_MGripper()) //Now if we query the MRobot, it will also take into account the gripper for the direct kinematics
        this.#vrobot.set_last_q_configuration(rest_q);
        this.#mrobot.set_last_q_configuration(rest_q);
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
}