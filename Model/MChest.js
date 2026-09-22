import { MCube } from './MCube';
export class MChest {
    #width;
    #height;
    #depth;
    #thickness;

    #mcubes=[];
    constructor(width_of_the_chest= 0.3,depth_of_the_chest= 0.3,height_of_the_chest= 0.2,thickness_of_panels= 0.005){
        this.#width=width_of_the_chest;
        this.#depth=depth_of_the_chest;
        this.#height=height_of_the_chest;
        this.#thickness=thickness_of_panels;
    }

    get_Cubes(){
        return this.#mcubes;
    }

    add_Cube(MCube){
        this.#mcubes.push(MCube);
    }
}