import { CScene } from "./Controller/CScene"
import { VScene } from "./View/VScene";
import { Ammo_environment } from "./Model/Ammo_environment";

const My_Ammo = await Ammo();
Ammo_environment.getInstance(My_Ammo);

// console.log(CScene.getInstance());
// console.log(CScene.getInstance().animate);

// async function start(){
//     await CScene.getInstance();
// }
const scene_controller = await CScene.getInstance();

VScene.getInstance().get_renderer().setAnimationLoop((time) => scene_controller.animate(time));

//start();