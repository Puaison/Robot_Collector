import { MCube } from './MCube';
/**
 * This class represents one chest and the relative informations of a chest
 * @see MCube
 */
export class MChest {
    #ID;
    #width;
    #height;
    #depth;
    /** @type {float} Thickness of each paper-panel that composes the chest*/
    #thickness;
    /** @type {Array_of_MCube} Array containing all the MCube leaved in this specific chest*/
    #mcubes=[];
    constructor(id=1,width_of_the_chest= 0.3,depth_of_the_chest= 0.3,height_of_the_chest= 0.2,thickness_of_panels= 0.005){
        this.#ID=id;
        this.#width=width_of_the_chest;
        this.#depth=depth_of_the_chest;
        this.#height=height_of_the_chest;
        this.#thickness=thickness_of_panels;
    }

    get_MCubes(){
        return this.#mcubes;
    }
    get_ID() {
        return this.#ID;
    }

    add_MCube(MCube){
        this.#mcubes.push(MCube);
    }
}