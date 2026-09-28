import {Ammo_environment} from './Ammo_environment.js';
import { floor_Width, floor_Height } from '../javascript_files/config.js';
/**
 * This class represents the floor in the Ammo environment. It is a Singleton class as only one floor can be present. 
 * 
 * Responsibility: it gathers informations necessary for managing and modelling the rigid body of the floor in the Singleton Ammo physics world. It also remebers which cubes are placed on it.
 * @see MCube
 */
export class MFloor{
    /** @type {MFloor} the singleton instance of this class */
    static #instance = null;
    /** @type {Array_of_MCube} The collections of cubes that are on the floor*/
    #mcubes=[];
    /** @type {btRigidBody} This is the rigid body of the floor in the Singleton Ammo physics world, and contains all the physical informations (size,mass,inertia) */
    #floor_Ammo = null;

    constructor(){
        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();
        //Create a Ammo-box with the same dimension of the visual floor in three.js
        const floor_Shape_Ammo = new Ammo.btBoxShape(new Ammo.btVector3(floor_Width/2,floor_Height/2,floor_Width/2));

        const floor_Transform_Ammo = new Ammo.btTransform(); 
        floor_Transform_Ammo.setIdentity();
        //set the upper part of the floor to be in the Y=0
        floor_Transform_Ammo.setOrigin(new Ammo.btVector3(0,-floor_Height/2,0));
        const floor_initial_Transform_Ammo = new Ammo.btDefaultMotionState(floor_Transform_Ammo); //this is the initial transformation of the flsoor

        const floor_inertia_Ammo = new Ammo.btVector3(0, 0, 0); // No inertia for the floor

        //floor_Shape_Ammo.calculateLocalInertia(1,floor_inertia_Ammo);

        const floor_info = new Ammo.btRigidBodyConstructionInfo( //Gathering Info for constructing the floor
            0,                  // mass = 0
            floor_initial_Transform_Ammo, //initial position
            floor_Shape_Ammo, // shape of the object
            floor_inertia_Ammo
        );

        this.#floor_Ammo = new Ammo.btRigidBody(floor_info); //Finally, create the rigid body with the info described above
        Ammo_environment.getInstance().get_World().addRigidBody(this.#floor_Ammo);
    }
    /**
     * Returns the single instance of the class MFloor
     * @returns {MFloor} Singleton instance of MFloor
     */
    static getInstance() {
        if (MFloor.#instance === null) {
            MFloor.#instance = new MFloor();
            //MFloor.#instance.MFloor();
        }
        return MFloor.#instance;
    }

    get_MCubes(){
        return this.#mcubes;
    }

    get_Floor_Ammo(){
        return this.#floor_Ammo;
    }

    add_MCube(MCube){
        this.#mcubes.push(MCube);
    }

    remove_MCube(MCube){
        const index = this.#mcubes.indexOf(MCube);
        this.#mcubes.splice(index,1);
    }

    search_MCube(id){
        for (const MCube of this.#mcubes) {
            if (MCube.get_ID() === id)
                return MCube;
        }
        return null;
    }
}