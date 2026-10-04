import { CScene } from "./Controller/CScene.js"
import { VScene } from "./View/VScene.js";
import { Ammo_environment } from "./Model/Ammo_environment.js";

//Setup ammo environment
const My_Ammo = await Ammo();
Ammo_environment.getInstance(My_Ammo);

//Create the controller of the scene
const scene_controller = await CScene.getInstance();

//set the function for the animation loop
VScene.getInstance().get_renderer().setAnimationLoop((time) => scene_controller.animate(time));