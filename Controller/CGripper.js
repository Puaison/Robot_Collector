import { MGripper } from "../Model/MGripper";
import { VGripper } from "../View/VGripper";
import { VScene } from "../View/VScene";

export class CGripper{
    #mgripper=null;
    #vgripper=null;
    constructor(){

    }

    async load_CGripper(loader) {
        this.#vgripper= new VGripper()
        this.#vgripper.set_loader(loader);
        await this.#vgripper.load_Gripper();
        //VScene.getInstance().add_mesh(this.#vgripper.get_gripper_mesh());
        this.#mgripper= new MGripper(this.#vgripper.get_finger_sensor_left_mesh(),this.#vgripper.get_finger_sensor_right_mesh());
    }

    get_vgripper(){
        return this.#vgripper;
    }

    get_mgripper(){
        return this.#mgripper;
    }
}