export class Ammo_environment{
    static #instance = null;

    #my_ammo=null;

    #world=null;

    constructor(){
        
    }

    static getInstance() {
        if (Ammo_environment.#instance === null) {
            Ammo_environment.#instance = new Ammo_environment();
            Ammo_environment.#instance.configure_Ammo_environment();
        }
        return Ammo_environment.#instance;
    }

    async configure_Ammo_environment(){
        this.#my_ammo = await Ammo();

        const collision_confinguration= new this.#my_ammo.btDefaultCollisionConfiguration();
        const collision_dispatcher =new this.#my_ammo.btCollisionDispatcher(collision_confinguration);
        const dbvt_Broadphase = new this.#my_ammo.btDbvtBroadphase();
        const solver =new this.#my_ammo.btSequentialImpulseConstraintSolver();
        this.#world = new this.#my_ammo.btDiscreteDynamicsWorld(
            collision_dispatcher,
            dbvt_Broadphase,
            solver,
            collision_confinguration
        );
        this.#world.setGravity(new this.#my_ammo.btVector3(0, -9.0, 0));
    }

    get_World(){
        return this.#world;
    }

    get_Ammo(){
        return this.#my_ammo;
    }
}