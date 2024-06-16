//konfigurace motorů a zakladni funkce v motor.ts
enum Pohyb{Doleva,Doprava, SledujCaru, Otocit, Zastaveno,Unknown}
enum Color { Red, Green, Blue, None, Black, White, Yellow }


//senzor ve stavu 1 kdyz na care nebo ve vzduchu, stav 0 kdyz je na stole mimo caru
const InfraR: DigitalPin= DigitalPin.P13;//senzory detekce čary
const InfraL: DigitalPin = DigitalPin.P14;
const InfraC: DigitalPin = DigitalPin.P15;


const wheelSenzorL:DigitalPin=DigitalPin.P12;//senzor otaceni L kolecka
const wheelSenzorR: DigitalPin = DigitalPin.P8;//senzor otaceni P kolecka
pins.setPull(InfraL, PinPullMode.PullUp);
pins.setPull(InfraR, PinPullMode.PullUp);
pins.setPull(InfraC, PinPullMode.PullUp);

pins.setPull(wheelSenzorL, PinPullMode.PullUp);
pins.setPull(wheelSenzorR, PinPullMode.PullUp);

let WheelPulsesL:number=0;//počítadlo pulsů otačení kolečka
let WheelPulsesR:number=0;

let OnLine:boolean=false;//true jestliže je na čáře
let PositionCurr:string="";//stav senzorů detekujících čáru
let PositionPrev:string="";//předchozí stav senzorů čáry
let PositionPrevCounter:number=0;//počet opakování předchozího stavu
const PrevCnt:number=6;//pocet opakovani stavu senzoru pro detekci mimo caru a zvednuti ze stolu

let InfraLValue: boolean;
let InfraRValue: boolean;
let InfraCValue: boolean;

let loopStopped:boolean=false;
let showLineSensors:boolean=false; //když true, zobrazí detekci senzorů na displayi
let stopOnTurn0:boolean=false; //zapnout při testování 
let stopOnTurn1: boolean = false;//zapnout při testování
let testMotorSinc:boolean=false;//zapnout pro testování motoru tlacitkem a/b
let detectNotOnTable:boolean=true;//detekce auticka na stole
let detectNotOnLine: boolean = true;//detekce auticka na čáře

let PulzyProKrizovatku:number=0;//detekce krizovatky povolena po urcitem poctu pulzukola
const KrizovatkaPovolenaPo:number = 10;
let FazeOtaceni:number=0; 

const DefaultPohybNaKrizovatce:Pohyb=Pohyb.Doprava;
let PohybNaKrizovatce:Pohyb=DefaultPohybNaKrizovatce;
let PohybSoucasny:Pohyb=Pohyb.Zastaveno;
let PohybPredchozi: Pohyb = PohybSoucasny;

MotorsRun(0, 0);








//zaznamena posledni stav senzoru cary, kdyz se nemeni, funkce zvysuje pocitadlo
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
//udalost nastane kdyz probehne otoceni kolecka o jeden pulz
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
    //zobrazi barvu nad kterou je senzor
    let hue = PlanetX_Basic.readColor();
    basic.showNumber(hue);
    basic.showString(GetColorStr(GetColor(hue,Color.None)));
    
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
})





basic.forever(function() {
    if(testMotorSinc)return;//testovani motorů
    if(loopStopped) return;

    //přečte stav senzoru čary
    InfraLValue= pins.digitalReadPin(InfraL)==1;
    InfraCValue=pins.digitalReadPin(InfraC)==1;
    InfraRValue=pins.digitalReadPin(InfraR)==1;


    if(showLineSensors){
        //zobrazit stav senzorů cary na display mc:b, pouze pokud povoleno showLineSensors
        if (InfraLValue) led.plot(0,0); else led.unplot(0,0);
        if (InfraCValue) led.plot(2, 4); else led.unplot(2,4);
        if (InfraRValue) led.plot(4,0); else led.unplot(4,0);
    }


    //prevede stav senzoru cary na string( např. 000 || 001)
    PositionCurr=(InfraLValue?"1":"0") + (InfraCValue?"1":"0") + (InfraRValue?"1":"0");
    
    //detekovat jestli na care 
    if(detectNotOnLine)
    {
        //kdyz ma sledovat caru a pri tom senzory ve stavu 000 po dlouhou dobu, nastane kdyz vyjede z cary
        if (PositionCurr == "000" && PositionPrev == "000" && PositionPrevCounter > PrevCnt && PohybSoucasny==Pohyb.SledujCaru )
        {

            OnLine=false;
            PohybSoucasnySet(Pohyb.Zastaveno);
            MotorsRun(0,0);
            ShowMovement(PohybSoucasny);


        }
    }

    //detekovat jestli je na stole
    if(detectNotOnTable)
    {
        //pokud dlouho 111 predpoklada se zvednuti ze stolu
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

        

            //barvy detekuj pouze v režimu Pohyb.SledujCaru
            
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
        //opakovane nacteni stavu senzorů čary, protože detekce barvy trva dlouho
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



        if ((PositionCurr == "111" || PositionCurr == "101") && OnLine && PulzyProKrizovatku > KrizovatkaPovolenaPo) {
            //na křižovatce 
            FazeOtaceni=0;
            PohybSoucasnySet(PohybNaKrizovatce);
            PohybNaKrizovatce=DefaultPohybNaKrizovatce;//nastav přísti pohyb na krizovatce na default
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
                3. pokračovat v otáčení a začít kontrolovat detekci senzorů čár
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
            //PohybNaKrizovatce=DefaultPohybNaKrizovatce;
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