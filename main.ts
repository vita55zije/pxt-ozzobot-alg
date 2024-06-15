//konfigurace motorů a zakladni funkce v motor.ts
enum Pohyb{Doleva,Doprava, SledujCaru, Otocit, Zastaveno,Unknown}
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
let showLineSensors:boolean=false; //když true, zobrazí detekci senzorů na displayi
let stopOnTurn0:boolean=false; //zapnout při testování 
let stopOnTurn1: boolean = false;//zapnout při testování
let testMotorSinc:boolean=false;//zapnout při testování
let detectNotOnTable:boolean=true;//detekce auticka na stole
let detectNotOnLine: boolean = true;//detekce auticka na čáře

let PulzyProKrizovatku:number=0;//detekci krizovatky po urcitem mnozstvi pulzu kola
let FazeOtaceni:number=0;

const PrevCnt:number=6;
const DefaultPohybNaKrizovatce:Pohyb=Pohyb.Doprava;
let PohybNaKrizovatce:Pohyb=DefaultPohybNaKrizovatce;
let PohybSoucasny:Pohyb=Pohyb.Zastaveno;
let PohybPredchozi: Pohyb = PohybSoucasny;

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
    //if (hue >= 180 && hue < 190) return Color.White; //198 //senzor bílou NEDETEKUJE
    return defaultColor;
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

function ShowMovement(mov:Pohyb)
{
    //return;
    let currentLSpeed=MotorLSpeed;
    let currentRSpeed=MotorRSpeed;
    MotorsRun(0,0);
    let charToShow:string="/";
    switch(mov){
        case Pohyb.Doleva:
            charToShow="<";
            break;
        case Pohyb.Doprava:
            charToShow=">";
            break;
        case Pohyb.SledujCaru:
            charToShow="^";
            break;
        case Pohyb.Otocit:
            charToShow="v";
            break;
        case Pohyb.Zastaveno:
            charToShow="-";
            break;
        default:
            charToShow="/";
            
    }
    basic.showString(charToShow,0);
    MotorsRun(currentLSpeed,currentRSpeed);
}

function PohybSoucasnySet(mov:Pohyb)
{
    PohybSoucasny=mov;

}

pins.onPulsed(wheelSenzorL,PulseValue.High,()=>{
    WheelPulsesL++;
    PulzyProKrizovatku++;

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
    if (PohybSoucasny == Pohyb.Doleva) basic.showString("<");
    if (PohybSoucasny == Pohyb.Doprava) basic.showString(">");
    if (PohybSoucasny == Pohyb.SledujCaru) basic.showString("^");
    */
    
    loopStopped=false;

})
input.onButtonPressed(Button.B, function () {
    if (testMotorSinc) {
        MotorsRun(0, 0);
        return;
    }
    loopStopped=true;
    if (PohybNaKrizovatce == Pohyb.Doleva) basic.showString("<");
    if (PohybNaKrizovatce == Pohyb.Doprava) basic.showString(">");
    if (PohybNaKrizovatce == Pohyb.SledujCaru) basic.showString("^");
    pause(200);
    ShowMovement(PohybSoucasny);

    loopStopped=false;
    /*
    loopStopped=true;
    basic.showString(GetColorStr(Colors[0]));
    basic.clearScreen();
    loopStopped=false;
    */
})





basic.forever(function() {
    if(testMotorSinc)return;//testovani motorů
    if(loopStopped) return;
    InfraLValue= pins.digitalReadPin(InfraL)==1;
    InfraCValue=pins.digitalReadPin(InfraC)==1;
    InfraRValue=pins.digitalReadPin(InfraR)==1;


    if(showLineSensors){
        //zobrazit stav motorů ma display mc:b
        if (InfraLValue) led.plot(0,0); else led.unplot(0,0);
        if (InfraCValue) led.plot(2, 4); else led.unplot(2,4);
        if (InfraRValue) led.plot(4,0); else led.unplot(4,0);
    }



    PositionCurr=(InfraLValue?"1":"0") + (InfraCValue?"1":"0") + (InfraRValue?"1":"0");
    
    //detekovat čáru 
    if(detectNotOnLine)
    {
        if (PositionCurr == "000" && PositionPrev == "000" && PositionPrevCounter > PrevCnt && PohybSoucasny==Pohyb.SledujCaru )
        {
            //do nothing if turning
            //if(!(PohybSoucasny==Pohyb.Doleva || PohybSoucasny==Pohyb.Doprava || PohybSoucasny==Pohyb.Otocit))
            //{
                //out of line
                //long time 000
                OnLine=false;
                PohybSoucasnySet(Pohyb.Zastaveno);
                MotorsRun(0,0);
                ShowMovement(PohybSoucasny);
            //}

        }
    }
    if(detectNotOnTable)
    {
        if (PositionCurr == "111" && PositionPrev == "111" && PositionPrevCounter > PrevCnt * 2 && PohybSoucasny !=Pohyb.Zastaveno) {
            //nejspíše není na stole
            OnLine=false;
            PohybSoucasnySet(Pohyb.Zastaveno);
            MotorsRun(0, 0);
            ShowMovement(PohybSoucasny);
    

        }
    }
    if(PohybSoucasny==Pohyb.Zastaveno && PositionCurr=="010")
    {
        //přechod z režimu zastaveno do rezimu sleduj caru, kdyz prostredni senzor detekuje čáru
        //vše resetovat
        PohybNaKrizovatce=DefaultPohybNaKrizovatce;
        FazeOtaceni=0;
        WheelPulsesL=0;
        WheelPulsesR=0;
        PulzyProKrizovatku=0;
        PohybSoucasnySet(Pohyb.SledujCaru);
    }
    if (PohybSoucasny == Pohyb.SledujCaru)
    {
        
        if (OnLine) {

            if (PositionCurr == "110" || PositionCurr == "100") {

                MotorsRun(0, -100);
            }
            if (PositionCurr == "011" || PositionCurr == "001") {

                MotorsRun(-100, 0);
            }

        

            //barvy pouze na rovné čáře
            
            let hue=PlanetX_Basic.readColor();
            let color: Color = GetColor(hue, Color.Black);
            //pracovat jen s 1 barvou, senzor špatně detekuje sekvenci barev jdoucích po sobě
            if (color == Color.Green) PohybNaKrizovatce = Pohyb.Doleva;
            if (color == Color.Blue)
            { 
                //nepoužívat modrou barvu, senzor špatně detekuje
            }
            if (color == Color.Yellow) PohybNaKrizovatce = Pohyb.SledujCaru;
            if (color==Color.Red){ 
                PohybSoucasnySet(Pohyb.Otocit);
                FazeOtaceni=0;
            }
            
            

        }

        InfraLValue = pins.digitalReadPin(InfraL) == 1;
        InfraCValue = pins.digitalReadPin(InfraC) == 1;
        InfraRValue = pins.digitalReadPin(InfraR) == 1;
        PositionCurr = (InfraLValue ? "1" : "0") + (InfraCValue ? "1" : "0") + (InfraRValue ? "1" : "0");

        //sleduj čáru
        if (PositionCurr == "010") {

            OnLine=true;
            
            MotorsRun(-120, -120);
        }
        if (PositionCurr == "000" && OnLine) {
            MotorsRun(-120, -120);
 
        }



        if ((PositionCurr == "111" || PositionCurr == "101") && OnLine && PulzyProKrizovatku>10) {
            //na křižovatce 
            FazeOtaceni=0;
            PohybSoucasnySet(PohybNaKrizovatce);
            //PohybNaKrizovatce=DefaultPohybNaKrizovatce;
            MotorsRun(0,0);
            
 
        }


    }

    if(PohybSoucasny==Pohyb.Otocit)
    {
        //otočení o 180
        //otočit o 12 pulsů, pak kontrolovat detekci prostředního senzoru čáry
        if(FazeOtaceni==0)
        {
            WheelPulsesL=0;
            WheelPulsesR=0;
            FazeOtaceni=1;
            MotorsRun(120,-120);
            PohybNaKrizovatce= DefaultPohybNaKrizovatce;

        }
        if(FazeOtaceni==1 && (WheelPulsesL>12|| WheelPulsesR>12 ) && InfraCValue)
        {
            MotorsRun(0,0);
            PohybSoucasnySet(Pohyb.SledujCaru);
        }

    }

    if (PohybSoucasny == Pohyb.Doleva || PohybSoucasny== Pohyb.Doprava)
    {
        /*
                1. posunout 3 pulsy do předu(senzory nejsou přesně pod koly)
                2. otočit o nejméně 6 pulsů
                3. pokračovat v otáčení a začít kontrolovat detekci prostředního senzoru čáry
                4. pokračovat rovně z křižovatky
        
                */
                
        if (FazeOtaceni == 0) {
            if(stopOnTurn0)
            {
                MotorsRun(0,0);
                basic.showString("P0");
                pause(1000);
                ShowMovement(PohybSoucasny);
            }
            WheelPulsesL = 0;
            WheelPulsesR = 0;
            FazeOtaceni = 1;
            MotorsRun(-120, -120);
        }

        if ( FazeOtaceni == 1 && (WheelPulsesL >= 3 || WheelPulsesR >= 3)) {
            if (stopOnTurn1) {
                MotorsRun(0, 0);
                basic.showString("1");
                pause(1000);
            }
            WheelPulsesL = 0;
            WheelPulsesR = 0;
            FazeOtaceni = 2;
            if (PohybSoucasny == Pohyb.Doleva)
                MotorsRun(120, -120);
            else
                MotorsRun(-120, 120);
        }
        
        if (FazeOtaceni == 2 && (WheelPulsesL > 6 || WheelPulsesR > 6) && (InfraRValue && PohybSoucasny == Pohyb.Doprava || InfraLValue && PohybSoucasny == Pohyb.Doleva)) {
            
            //FazeOtaceni = 3; //není nutné, otočka už provedena
            MotorsRun(0, 0);
            PohybNaKrizovatce=DefaultPohybNaKrizovatce;
            PohybSoucasnySet(Pohyb.SledujCaru);
        }
    }



    PositionPrevWrite(PositionCurr);
    if(PohybSoucasny!=PohybPredchozi)
    {
        PohybPredchozi=PohybSoucasny;
        ShowMovement(PohybSoucasny);
    }







        
})