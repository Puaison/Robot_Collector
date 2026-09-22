import { rest_q,block_Height } from '../javascript_files/config';
import { MRobot } from '../Model/MRobot';
import { VRobot } from '../View/VRobot';
import { VScene } from '../View/VScene';
import { CGripper } from './CGripper';
import { rest_q } from '../javascript_files/config';

export class CRobot{
    #mrobot=null;
    #vrobot=null;
    #cgripper=null; // From here we can access both vgripper and mgripper
    #cube_collected=null;

    constructor(offset = block_Height) {
        this.#vrobot = new VRobot(offset);
        this.#mrobot = new MRobot(offset);
    }

    async load_CRobot(){
        await this.#vrobot.load_VRobot();
        VScene.getInstance().add_mesh(this.#vrobot.get_robot_mesh());
        this.#cgripper= new CGripper();
        await this.#cgripper.load_CGripper(this.#vrobot.get_loader());
        this.#vrobot.get_robot_mesh().joints["wrist_3_joint"].add(this.#cgripper.get_vgripper().get_gripper_mesh());

        this.#mrobot.set_gripper(this.#cgripper.get_mgripper()) //Now if we query the MRobot, it will also take into account the gripper for the direct kinematics
        this.#vrobot.set_last_q_configuration(rest_q);
        this.#mrobot.set_last_q_configuration(rest_q);
        this.#cgripper.get_vgripper().set_last_gripper_value(0.0);
        this.#cgripper.get_mgripper().set_last_gripper_value(0.0);
    }

    get_cgripper(){
        return this.#cgripper;
    }
}