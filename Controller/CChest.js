import { MChest } from "../Model/MChest.js";
import { VChest } from "../View/VChest.js";
import { VScene } from "../View/VScene.js";
/**
 * This class is the controller of a particular Chest object and it is responsible to add the Chest-mesh to the scene.
 * 
 * Responsibility: syncronizes the data (mesh and rigid body in Ammo env) of each cube placed in it and it is responsible to add the chest-mesh to the scene.
 * @see MChest
 * @see VChest
 * @see CCube
 * @see VScene
 */
export class CChest{
    #ID;
    /** @type {MChest} The MChest object managed by this controller */
    #mchest = null;
    /** @type {VChest} The VChest object managed by this controller */
    #vchest = null;
    /** @type {Array_of_CCube} The collections of cubes that are in the chest*/
    #ccubes=[];

    constructor(id=1,position=[0.85,0,0],width_of_the_chest= 0.3,depth_of_the_chest= 0.3,height_of_the_chest= 0.2,thickness_of_panels= 0.005) {
        this.#ID=id;
        this.#vchest= new VChest(id,width_of_the_chest,depth_of_the_chest,height_of_the_chest,thickness_of_panels);
        this.#vchest.get_Chest_mesh().position.x = position[0];
        this.#vchest.get_Chest_mesh().position.y = position[1];
        this.#vchest.get_Chest_mesh().position.z = position[2];
        VScene.getInstance().add_mesh(this.#vchest.get_Chest_mesh());

        this.#mchest= new MChest(id,width_of_the_chest,depth_of_the_chest,height_of_the_chest,thickness_of_panels);
    }

    get_VChest() {
        return this.#vchest;
    }

    get_MChest() {
        return this.#mchest;
    }

    get_CCubes(){
        return this.#ccubes;
    }

    get_ID() {
        return this.#ID;
    }

    add_CCube(CCube) {
        this.#ccubes.push(CCube);
        this.#vchest.add_VCube(CCube.get_VCube());
        this.#mchest.add_MCube(CCube.get_MCube());
    }

    syncronize_Ammo_to_mesh(){
        for (const CCube of this.#ccubes) {
            CCube.syncronize_Ammo_to_mesh();
        }
    }
}