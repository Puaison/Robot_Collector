export class VChest{
    #width;
    #height;
    #depth;
    #thickness;

    #body_mesh = null;

    #vcubes = [];

    constructor(width_of_the_chest= 0.3,depth_of_the_chest= 0.3,height_of_the_chest= 0.2,thickness_of_panels= 0.005){
        this.#body_mesh = new THREE.Group();
        const paper_material = new THREE.MeshStandardMaterial({color: 0xBA8940});
        
        const bottom_panel_geometry = new THREE.BoxGeometry(width_of_the_chest,thickness_of_panels,depth_of_the_chest);
        const bottom_panel = new THREE.Mesh(bottom_panel_geometry,paper_material);
        bottom_panel.position.y = thickness_of_panels/2;
        this.#body_mesh.add(bottom_panel);
    
        const lateral_panel_type_1_geometry = new THREE.BoxGeometry(width_of_the_chest,height_of_the_chest,thickness_of_panels);
        const lateral_panel_type_2_geometry = new THREE.BoxGeometry(thickness_of_panels,height_of_the_chest,depth_of_the_chest);
    
        const lateral_panel_type_1_1_mesh =  new THREE.Mesh(lateral_panel_type_1_geometry,paper_material);
        //lateral_panel_type_1_1_mesh.position.x= -width_of_the_chest/2;
        lateral_panel_type_1_1_mesh.position.y= height_of_the_chest/2;
        lateral_panel_type_1_1_mesh.position.z= -depth_of_the_chest/2;
        //lateral_panel_type_1_1_mesh.rotation.y = Math.PI/2;
        this.#body_mesh.add(lateral_panel_type_1_1_mesh);
        
        const lateral_panel_type_1_2_mesh =  new THREE.Mesh(lateral_panel_type_1_geometry,paper_material);
        //lateral_panel_type_1_2_mesh.position.x= width_of_the_chest/2;
        lateral_panel_type_1_2_mesh.position.y= height_of_the_chest/2;
        lateral_panel_type_1_2_mesh.position.z= depth_of_the_chest/2;
        //lateral_panel_type_1_2_mesh.rotation.y = Math.PI/2;
        this.#body_mesh.add(lateral_panel_type_1_2_mesh);
    
        const lateral_panel_type_2_1_mesh =  new THREE.Mesh(lateral_panel_type_2_geometry,paper_material);
        lateral_panel_type_2_1_mesh.position.x= -width_of_the_chest/2;
        lateral_panel_type_2_1_mesh.position.y= height_of_the_chest/2;
        //lateral_panel_type_2_1_mesh.position.z= -depth_of_the_chest/2;
        //lateral_panel_type_2_1_mesh.rotation.y = Math.PI/2;
        this.#body_mesh.add(lateral_panel_type_2_1_mesh);
        
        const lateral_panel_type_2_2_mesh =  new THREE.Mesh(lateral_panel_type_2_geometry,paper_material);
        lateral_panel_type_2_2_mesh.position.x= width_of_the_chest/2;
        lateral_panel_type_2_2_mesh.position.y= height_of_the_chest/2;
        //lateral_panel_type_2_2_mesh.position.z= depth_of_the_chest/2; 
        //lateral_panel_type_2_2_mesh.rotation.y = Math.PI/2;
        this.#body_mesh.add(lateral_panel_type_2_2_mesh);
    }

    get_Chest_mesh(){
        return this.#body_mesh;
    }

    get_Cubes(){
        return this.#vcubes;
    }

    add_Cube(VCube){
        this.#vcubes.push(VCube);
    }

}