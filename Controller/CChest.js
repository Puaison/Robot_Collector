import { MChest } from "../Model/MChest";
import { VChest } from "../View/VChest";
import { VScene } from "../View/VScene";

export class CChest{
    #mchest = null;
    #vchest = null;

    #ccubes=[];

    constructor(position=[0.85,0,0],width_of_the_chest= 0.3,depth_of_the_chest= 0.3,height_of_the_chest= 0.2,thickness_of_panels= 0.005) {
        this.#vchest= new VChest(width_of_the_chest,depth_of_the_chest,height_of_the_chest,thickness_of_panels);
        this.#vchest.get_Chest_mesh().position.x = position[0];
        this.#vchest.get_Chest_mesh().position.y = position[1];
        this.#vchest.get_Chest_mesh().position.z = position[2];
        VScene.getInstance().add_mesh(this.#vchest.get_Chest_mesh());

        this.#mchest= new MChest(width_of_the_chest,depth_of_the_chest,height_of_the_chest,thickness_of_panels);
    }

    get_vchest() {
        return this.#vchest;
    }

    get_mchest() {
        return this.#mchest;
    }

    get_Cubes(){
        return this.#ccubes;
    }

    add_Cube(CCube) {
        this.#ccubes.push(CCube);
        this.#vchest.add_Cube(CCube.get_vcube());
        this.#mchest.add_Cube(CCube.get_mcube());
    }

    syncronize_Ammo_to_mesh(){
        for (const CCube of this.#ccubes) {
            CCube.syncronize_Ammo_to_mesh();
        }
    }
}