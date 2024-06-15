
const MotorR = magicbit.Motors.M4;
const MotorL = magicbit.Motors.M1;
let MotorLSpeed:number=0;
let MotorRSpeed:number=0;
let MotorRCorrection: number = 1.1;//1.25; //lmotor faster then correct the right motor speed
let MotorLCorrection: number = 1;//0.75;


function MotorLRun(speed: number) {
    MotorLSpeed=speed;
    if(speed!=0)
        magicbit.MotorRun(MotorL, speed * MotorLCorrection);
    else
        magicbit.MotorStop(MotorL);
}
function MotorRRun(speed: number) {
    MotorRSpeed=speed;
    if(speed!=0)
        magicbit.MotorRun(MotorR, speed * MotorRCorrection);
    else
        magicbit.MotorStop(MotorR);
}

function MotorsRun(speedL: number, speedR: number) {
    MotorLRun(speedL);
    MotorRRun(speedR);
}

