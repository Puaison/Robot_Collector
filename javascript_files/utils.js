export function normalize_Angle(angle) {

    while (angle>Math.PI) {
        angle -= 2 * Math.PI;
    }

    while (angle<-Math.PI) {
        angle += 2 * Math.PI;
    }

    return angle;
}

export function get_pose_Error(targetPose, currentPose) {

    return [
        targetPose[0] - currentPose[0],
        targetPose[1] - currentPose[1],
        targetPose[2] - currentPose[2],

        normalize_Angle(targetPose[3] - currentPose[3]),
        normalize_Angle(targetPose[4] - currentPose[4]),
        normalize_Angle(targetPose[5] - currentPose[5])
    ];
}