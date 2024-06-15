enum Movement{TurnL,TurnR, FollowLine, TurnU, Stopped,Unknown}
enum Color { Red, Green, Blue, None, Black, White, Yellow }

const InfraR: DigitalPin= DigitalPin.P13;
const InfraL: DigitalPin = DigitalPin.P14;
const InfraC: DigitalPin = DigitalPin.P15;

//8, 12
const wheelSenzorL:DigitalPin=DigitalPin.P12;
const wheelSenzorR:DigitalPin=DigitalPin.P8;
pins.setPull(InfraL, PinPullMode.PullUp);
pins.setPull(InfraR, PinPullMode.PullUp);
pins.setPull(InfraC, PinPullMode.PullUp);

pins.setPull(wheelSenzorL, PinPullMode.PullUp);
pins.setPull(wheelSenzorR, PinPullMode.PullUp);

let WheelPulsesL:number=0;
let WheelPulsesR:number=0;

let OnLine:boolean=false;
let PositionCurr:string="";
let PositionPrev:string="";
let PositionPrevCounter:number=0;

let InfraLValue: boolean;
let InfraRValue: boolean;
let InfraCValue: boolean;

let loopStopped:boolean=false;
let showLineSensors:boolean=false; //switch to display line infra sensors state on display
let stopOnTurn0:boolean=false; //switch to true to stop - for testing 
let stopOnTurn1: boolean = false;//switch to true to stop - for testing 
let stopOnFollowLineSet:boolean=false;
let testMotorSinc:boolean=false;//switch on if motor test expected
let detectNotOnTable:boolean=true;
let detectNotOnLine: boolean = true;

let WheelPulsesCrossAllowed:number=0;
let TurnPhase:number=0;

const PrevCnt:number=6;
const DefaultMovementOnCross:Movement=Movement.TurnR;
let MovementOnCross:Movement=DefaultMovementOnCross;
let MovementCurrent:Movement=Movement.Stopped;
let MovementPrev: Movement = MovementCurrent;

MotorsRun(0, 0);









function PositionPrevWrite(s:string)
{
    if (PositionPrev==s)
    {
        PositionPrevCounter++;
    }
    else
    {
        PositionPrevCounter=0;

    }
    PositionPrev=s;
}



function GetColor(hue:number, defaultColor:Color):Color
{
    if (hue > 330 || hue < 20) return Color.Red;
    if (hue > 120 && hue < 180) return Color.Green;
    if (hue > 30 && hue < 120 ) return Color.Yellow;
    if (hue > 210 && hue < 270) return Color.Blue;
    //if (hue >= 180 && hue < 190) return Color.White; //198
    return defaultColor;
}
function GetColorsStr(colors:Color[]) :string
{
    let colorsStr:string="";
    for (let i = 0; i < colors.length;i++)
    {
        if (colors[i]==Color.None) return colorsStr;
        if (colors[i]==Color.Red) colorsStr+="R";
        if (colors[i] == Color.Blue) colorsStr += "B";
        if (colors[i]==Color.Green) colorsStr+="G";
        if (colors[i]==Color.Black) colorsStr+="N";
        if (colors[i] == Color.White) colorsStr += "W";
    }
    return colorsStr;
}

function GetColorStr(color: Color): string {
    if (color == Color.None) return "-";
    if (color == Color.Red) return "R";
    if (color == Color.Blue) return "B";
    if (color == Color.Green) return "G";
    if (color == Color.Black) return  "N";
    if (color == Color.White) return  "W";
    if (color == Color.Yellow) return "Y";
    
    return "/";
}

function ShowMovement(mov:Movement)
{
    //return;
    let currentLSpeed=MotorLSpeed;
    let currentRSpeed=MotorRSpeed;
    MotorsRun(0,0);
    let charToShow:string="/";
    switch(mov){
        case Movement.TurnL:
            charToShow="<";
            break;
        case Movement.TurnR:
            charToShow=">";
            break;
        case Movement.FollowLine:
            charToShow="^";
            break;
        case Movement.TurnU:
            charToShow="v";
            break;
        case Movement.Stopped:
            charToShow="-";
            break;
        default:
            charToShow="/";
            
    }
    basic.showString(charToShow,0);
    MotorsRun(currentLSpeed,currentRSpeed);
}

function MovementCurrentSet(mov:Movement)
{
    MovementCurrent=mov;

}

pins.onPulsed(wheelSenzorL,PulseValue.High,()=>{
    WheelPulsesL++;
    WheelPulsesCrossAllowed++;

});
pins.onPulsed(wheelSenzorR, PulseValue.High, () => {
    WheelPulsesR++;

});



input.onButtonPressed(Button.A, function() {
    if(testMotorSinc)
    {
        MotorsRun(-120,-120);
        return;
    }
    loopStopped=true;
    
    let hue = PlanetX_Basic.readColor();
    basic.showNumber(hue);
    basic.showString(GetColorStr(GetColor(hue,Color.None)));
    
    /*
    if (MovementCurrent == Movement.TurnL) basic.showString("<");
    if (MovementCurrent == Movement.TurnR) basic.showString(">");
    if (MovementCurrent == Movement.FollowLine) basic.showString("^");
    */
    
    loopStopped=false;

})
input.onButtonPressed(Button.B, function () {
    if (testMotorSinc) {
        MotorsRun(0, 0);
        return;
    }
    loopStopped=true;
    if (MovementOnCross == Movement.TurnL) basic.showString("<");
    if (MovementOnCross == Movement.TurnR) basic.showString(">");
    if (MovementOnCross == Movement.FollowLine) basic.showString("^");
    pause(200);
    ShowMovement(MovementCurrent);

    loopStopped=false;
    /*
    loopStopped=true;
    basic.showString(GetColorStr(Colors[0]));
    basic.clearScreen();
    loopStopped=false;
    */
})





basic.forever(function() {
    if(testMotorSinc)return;//testing motors
    if(loopStopped) return;
    InfraLValue= pins.digitalReadPin(InfraL)==1;
    InfraCValue=pins.digitalReadPin(InfraC)==1;
    InfraRValue=pins.digitalReadPin(InfraR)==1;


    if(showLineSensors){
        //show infra sensors state on display
        if (InfraLValue) led.plot(0,0); else led.unplot(0,0);
        if (InfraCValue) led.plot(2, 4); else led.unplot(2,4);
        if (InfraRValue) led.plot(4,0); else led.unplot(4,0);
    }



    PositionCurr=(InfraLValue?"1":"0") + (InfraCValue?"1":"0") + (InfraRValue?"1":"0");
    
    //detect out of line 
    if(detectNotOnLine)
    {
        if (PositionCurr == "000" && PositionPrev == "000" && PositionPrevCounter > PrevCnt && MovementCurrent==Movement.FollowLine )
        {
            //do nothing if turning
            //if(!(MovementCurrent==Movement.TurnL || MovementCurrent==Movement.TurnR || MovementCurrent==Movement.TurnU))
            //{
                //out of line
                //long time 000
                OnLine=false;
                MovementCurrentSet(Movement.Stopped);
                MotorsRun(0,0);
                ShowMovement(MovementCurrent);
            //}

        }
    }
    if(detectNotOnTable)
    {
        if (PositionCurr == "111" && PositionPrev == "111" && PositionPrevCounter > PrevCnt * 2 && MovementCurrent !=Movement.Stopped) {
            //probably not on the table, stop it for each casses
            OnLine=false;
            MovementCurrentSet(Movement.Stopped);
            MotorsRun(0, 0);
            ShowMovement(MovementCurrent);
    

        }
    }
    if(MovementCurrent==Movement.Stopped && PositionCurr=="010")
    {
        //stopped, however on the line by central sensor, then MotorRun
        //reset to basic first
        MovementOnCross=DefaultMovementOnCross;
        TurnPhase=0;
        WheelPulsesL=0;
        WheelPulsesR=0;
        WheelPulsesCrossAllowed=0;
        MovementCurrentSet(Movement.FollowLine);
    }
    if (MovementCurrent == Movement.FollowLine)
    {
        
        if (OnLine) {

            if (PositionCurr == "110" || PositionCurr == "100") {

                MotorsRun(0, -100);
            }
            if (PositionCurr == "011" || PositionCurr == "001") {

                MotorsRun(-100, 0);
            }

        

            //work with colors in stright  and on line only
            
            let hue=PlanetX_Basic.readColor();
            let color: Color = GetColor(hue, Color.Black);
            //work with the single color, instead of sequences
            if (color == Color.Green) MovementOnCross = Movement.TurnL;
            if (color == Color.Blue)
            { 
                //don't use blue because detected wrongly
            }
            if (color == Color.Yellow) MovementOnCross = Movement.FollowLine;
            if (color==Color.Red){ 
                MovementCurrentSet(Movement.TurnU);
                TurnPhase=0;
            }
            
            

        }

        InfraLValue = pins.digitalReadPin(InfraL) == 1;
        InfraCValue = pins.digitalReadPin(InfraC) == 1;
        InfraRValue = pins.digitalReadPin(InfraR) == 1;
        PositionCurr = (InfraLValue ? "1" : "0") + (InfraCValue ? "1" : "0") + (InfraRValue ? "1" : "0");

        //follow the line
        if (PositionCurr == "010") {

            OnLine=true;
            
            MotorsRun(-120, -120);
        }
        if (PositionCurr == "000" && OnLine) {
            MotorsRun(-120, -120);
 
        }



        if ((PositionCurr == "111" || PositionCurr == "101") && OnLine && WheelPulsesCrossAllowed>10) {
            //on cross 
            TurnPhase=0;
            MovementCurrentSet(MovementOnCross);
            //MovementOnCross=DefaultMovementOnCross;
            MotorsRun(0,0);
            
 
        }


    }

    if(MovementCurrent==Movement.TurnU)
    {
        //180 turning
        //rotate at least 12 signals and wait till central sensor cross the line
        if(TurnPhase==0)
        {
            WheelPulsesL=0;
            WheelPulsesR=0;
            TurnPhase=1;
            MotorsRun(120,-120);
            MovementOnCross= DefaultMovementOnCross;

        }
        if(TurnPhase==1 && (WheelPulsesL>12|| WheelPulsesR>12 ) && InfraCValue)
        {
            MotorsRun(0,0);
            MovementCurrentSet(Movement.FollowLine);
        }

    }

    if (MovementCurrent == Movement.TurnL || MovementCurrent== Movement.TurnR)
    {
        /*
                1.move three signals forward to achieve the line aprox
                2. rotate at least 6 signals 
                3. rotate til middle sensor identify the line
                4. continue stright
        
                */
                
        if (TurnPhase == 0) {
            if(stopOnTurn0)
            {
                MotorsRun(0,0);
                basic.showString("P0");
                pause(1000);
                ShowMovement(MovementCurrent);
            }
            WheelPulsesL = 0;
            WheelPulsesR = 0;
            TurnPhase = 1;
            MotorsRun(-120, -120);
        }
        /*
        if(TurnPhase==1 && stopOnTurn1)
        {
            MotorsRun(0,0);
            pause(1);
            basic.showNumber(WheelPulsesL);
            pause(1000);
            MotorsRun(-120,-120);
            pause(100);
        }
        */
        if ( TurnPhase == 1 && (WheelPulsesL >= 3 || WheelPulsesR >= 3)) {
            if (stopOnTurn1) {
                MotorsRun(0, 0);
                basic.showString("1");
                pause(1000);
            }
            WheelPulsesL = 0;
            WheelPulsesR = 0;
            TurnPhase = 2;
            if (MovementCurrent == Movement.TurnL)
                MotorsRun(120, -120);
            else
                MotorsRun(-120, 120);
        }
        
        if (TurnPhase == 2 && (WheelPulsesL > 6 || WheelPulsesR > 6) && (InfraRValue && MovementCurrent == Movement.TurnR || InfraLValue && MovementCurrent == Movement.TurnL)) {
            
            //TurnPhase = 3; //not necessary because turn alread finished
            MotorsRun(0, 0);
            MovementOnCross=DefaultMovementOnCross;
            MovementCurrentSet(Movement.FollowLine);
        }
    }



    PositionPrevWrite(PositionCurr);
    if(MovementCurrent!=MovementPrev)
    {
        MovementPrev=MovementCurrent;
        ShowMovement(MovementCurrent);
    }







        
})