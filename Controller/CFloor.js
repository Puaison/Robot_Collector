import { MFloor } from "../Model/MFloor.js";
import { VFloor } from "../View/VFloor.js";
import { VScene } from "../View/VScene.js";
/**
 * This class is the controller of the floor object.
 * 
 * Responsibility: syncronizes the data (mesh and rigid body in Ammo env) of each cube placed on it and it is responsible to add the floor-mesh to the scene.
 * @see CCube
 * @see MFloor
 * @see VFloor
 * @see VScene
 */
export class CFloor {
    /** @type {CFloor} Singleton Instance of this class */
    static #instance = null;
    /** @type {Array_of_CCube} The collections of cubes that are on the floor*/
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
        VFloor.getInstance().add_VCube(CCube.get_VCube());
        MFloor.getInstance().add_MCube(CCube.get_MCube());
    }

    remove_CCube(CCube){
        let index = this.#ccubes.indexOf(CCube);
        this.#ccubes.splice(index,1);
        VFloor.getInstance().remove_VCube(CCube.get_VCube());
        MFloor.getInstance().remove_MCube(CCube.get_MCube());
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