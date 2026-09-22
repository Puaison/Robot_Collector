import { MFloor } from "../Model/MFloor";
import { VFloor } from "../View/VFloor";
import { VScene } from "../View/VScene";
/**
 * This class is the controller of the floor object.
 * 
 * Responsibility: syncronizes the data (mesh and rigid body in Ammo env) of each cube placed on it and it is responsible to add the floor-mesh to the scene. 
 */
export class CFloor {
    static #instance = null;

    #ccubes=[];
    /**
     * Adds the mesh floor to the scene
     */
    constructor() {
        VScene.getInstance().add_mesh(VFloor.getInstance().get_Floor_mesh());

    }
    static getInstance() {
        if (CFloor.#instance === null) {
            CFloor.#instance = new CFloor();
            //MFloor.#instance.MFloor();
        }
        return CFloor.#instance;
    }

    get_CCubes(){
        return this.#ccubes;
    }

    add_CCube(CCube){
        this.#ccubes.push(CCube);
        VFloor.getInstance().add_Cube(CCube.get_vcube());
        MFloor.getInstance().add_Cube(CCube.get_mcube());
    }

    remove_CCube(CCube){
        let index = this.#ccubes.indexOf(CCube);
        this.#ccubes.splice(index,1);
        VFloor.getInstance().remove_Cube(CCube.get_vcube());
        MFloor.getInstance().remove_Cube(CCube.get_mcube());
    }

    search_CCube(id){
        for (const CCube of this.#ccubes) {
            if (CCube.get_ID() === id)
                return CCube;
        }
        return null;
    }

    syncronize_Ammo_to_mesh(){
        for (const CCube of this.#ccubes) {
            CCube.syncronize_Ammo_to_mesh();
        }
    }

    syncronize_mesh_to_Ammo(){
        for (const CCube of this.#ccubes) {
            CCube.syncronize_mesh_to_Ammo();
        }
    }
}