
/**
 * Function used to normalize an angle to be in the interval of -PI and +PI
 * @param {float} angle 
 * @returns Normalized angle between -PI and +PI
 */
export function normalize_angle_enhanced(angle){
    return ((angle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}

/**
 * Function used to compute the shortest distance between two angles, taking into account the circular nature of angles.
 * @param {float} from 
 * @param {float} to 
 * @returns The shortest distance between two angles
 */
export function shortest_angle_difference(from, to) {
    return Math.atan2(Math.sin(to - from),Math.cos(to - from));
}

export function get_pose_Error(targetPose, currentPose) {

    return [
        targetPose[0] - currentPose[0],
        targetPose[1] - currentPose[1],
        targetPose[2] - currentPose[2],

        shortest_angle_difference(currentPose[3],targetPose[3]),
        shortest_angle_difference(currentPose[4],targetPose[4]),
        shortest_angle_difference(currentPose[5],targetPose[5])
    ];
}