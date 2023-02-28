import { fromEvent, interval, merge} from 'rxjs';
import { filter, map, scan, } from 'rxjs/operators';

import "./style.css";

function main() {
  // ------------- Data types ------------------------
  type Position = Readonly<{
    x : number ,
    y : number ,
  }>;

  /*
  For rectangle objects will have a height and width
  for circles a radius
  */
  type dimensions = Readonly<{
    height: number,
    width: number,
  }>


//  ------------- essential constants ---------------------
const   
constants = {
  DEFAULT_HEIGHT_BACKGROUND : 30,
  FROG_SHIFT : 45,
  FROG_SIZE : 7.5,
  FrogInitialState :  <Position>{x : 15 , y: 600},
  LOG_SIZE : <dimensions>{height : 30, width : 60}, 
  LOG_SHIFT : 1, 
  CANVAS_LOWER_BOUND : 15,
  CANVAS_UPPER_BOUND : 615,
  FIRST_LOG : <Position>{x : 15, y : 270},
  SECOND_LOG: <Position>{x : 0, y : 225},
  CANVASSIZE : 615
} as const;


//  ------------- essential constants ---------------------





// ------------------ Classes ------------------------

// abstract class for a Body which is the basic framework of all the game objects 
abstract class Body{
  constructor(public readonly id : string,
              public readonly pos : Position,
              public readonly size : dimensions,
              public readonly movement : Movement,
              public readonly colour: string,
              ){}
}


//Models movement of game objects
class Movement{
  constructor(public readonly x_shift: number, public readonly y_shift : number){}
}

// Chid class of Movement. Specialised for logs
class FrogMovement extends Movement {
  constructor(public readonly x_shift: number, public readonly y_shift : number){
    super(x_shift, y_shift)
  }
}

//Child class of Movement specialised for logs
class RectMovement extends Movement {
  constructor(public readonly moveRight: boolean, shiftAmount : number){
    super(moveRight ? -shiftAmount : shiftAmount, 0)
  }
}

//Used to keep track of time
class Tick { 
  constructor(public readonly elapsed:number) {} 
};



class Frog extends Body{
  constructor(public readonly pos : Position, movement : FrogMovement){
    super("Frog", pos, <dimensions>{ height : constants.FROG_SIZE, width : 0}, movement, "green")
  }
}

class MovableRectangle extends Body{
  constructor(public readonly id : string, public readonly pos : Position, public readonly size : dimensions, 
    public readonly movement : Movement, public readonly colour : string){
      super('rect'.concat(id), pos, size, movement, colour)
  }
}


class StaticObject extends Body{
  constructor(public readonly id : string,
    public readonly pos : Position,
    public readonly size : dimensions,
    public readonly colour: string){
      super(id, pos, size,  new Movement(0, 0),colour)
    }
}

class GoalObject extends StaticObject{
  constructor(public readonly id : string, public readonly pos : Position){
    super(id, pos, <dimensions>{height : 30, width : 50},  "Green")

  }
}

class Restart
{
  constructor(){}
}



//Will trigger a stream that prompts the creation of a log object at a particular
//row

// ------------------- Classes --------------------



// ------------------ Our maing Game state ----------------------
type State = Readonly<{
  time: number,
  frog : Frog,
  logs : ReadonlyArray<MovableRectangle>,
  enemies : ReadonlyArray<MovableRectangle>
  goals: ReadonlyArray<GoalObject>
  exit : ReadonlyArray<Body>,
  objCount : number,
  score : number,
  inLog: boolean,
  achievedGoals : number,
  highscore : number,
  gameOver : boolean
}>;

const initialState : State = {
  time : 0,
  frog : createFrog(),
  logs: [],
  enemies: [],
  goals: [],
  exit: [],
  score : 0,
  objCount: 0,
  achievedGoals : 0,
  inLog : false,
  highscore : 0,
  gameOver : false
}

const goalArray: ReadonlyArray<GoalObject> = [
  new GoalObject(
    "goal1",
    <Position>{x : 570, y : 0}, 
  ), 
  new GoalObject(
    "goal2",
    <Position>{x : 410, y : 0}, 
  ),
  new GoalObject(
    "goal3",
    <Position>{x : 230, y : 0}, 
  ),
  new GoalObject(
    "goal4",
    <Position>{x : 0, y : 0}, )

  ]
// ------------------ Our maing Game state ----------------------



// ---------Functions to initalize static background objects----------------
  
//function to initialize game objects
  function initializeBackgroundObj(b : StaticObject) : Element{
    const ret = document.createElementNS(svg.namespaceURI, "rect");
    
    Object.entries({
      id : b.id,
      x: b.pos.x,
      y: b.pos.y,
      width: b.size.width,
      height: b.size.height,
      fill: b.colour,
    }).forEach(([key, val]) => ret.setAttribute(key, String(val)));
    
    return ret
  }

  function addBackgroundObjects(obj : Element): void{
    document.getElementById("background-layer")?.appendChild(obj);
  }

  function addForegroundObjects(obj : Element): void{
    document.getElementById("foreground-layer")?.appendChild(obj);
  }

  //helper function to initialize html object attributes. Taken from asteroids
  const
    attr = (e:Element, o:{ [key:string]: Object }) =>
      { for(const k in o) e.setAttribute(k,String(o[k])) };
// ---------Functions to initalize static background objects----------------



// ---------------- HTML and SVG sections -----------------------
const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;

// Example on adding an element
const frog = document.createElementNS(svg.namespaceURI, "circle");
frog.setAttribute("r", String(constants.FROG_SIZE));
frog.setAttribute("cx", String(constants.FrogInitialState.x));
frog.setAttribute("cy", String(constants.FrogInitialState.y));
frog.setAttribute("id", "frog");
frog.setAttribute(
  "style",
  "fill: green; stroke: green; stroke-width: 1px;"
);


//creating new sections for the foreground and background layer

//background layer
const backgroundLayer = document.createElementNS(svg.namespaceURI, "g");
backgroundLayer.setAttribute("id", "background-layer")
svg.append(backgroundLayer);

// Foreground layer : Overlap precedence over background layer
const foregroundLayer = document.createElementNS(svg.namespaceURI, "g");
foregroundLayer.setAttribute("id", "foreground-layer");
svg.append(foregroundLayer)


//Adding the frog to the foreground layer


// ---------------- HTML and SVG sections -----------------------


//  ----- Functions creating our frog player  --------
 

function createFrog() : Frog{
  return new Frog(constants.FrogInitialState, new FrogMovement(0, 0))
}
// ----- Creating our frog player --------


// ---------------- Creating the logs for the game ---------------------
function createMovableRect(s : State, Row : number, size : dimensions, movement : RectMovement, color : string) : MovableRectangle {
  return (color ==="brown" ? !movement.moveRight ? new MovableRectangle
  (String(s.objCount), <Position>{
    x : 0,
    y : 270 - ((Row % 6) * 45)
  }, size, movement, color) : new MovableRectangle
  (String(s.objCount), <Position>{
    x : 615,
    y : 270 - ((Row % 6) * 45)
  }, size, movement, color)
  : !movement.moveRight ? new MovableRectangle
  (String(s.objCount), <Position>{
    x : 0,
    y : 535 - ((Row % 6) * 45)
  }, size, movement, color) : new MovableRectangle
  (String(s.objCount), <Position>{
    x : 615,
    y : 535 - ((Row % 6) * 45)
  }, size, movement, color))
}




// ------------------ static objects -----------------

// Serves as the platform over which the frog can move
const startBoundary = new StaticObject("startBoundary", <Position>{x : 0, y : 585}, <dimensions>{width : 615, height: constants.DEFAULT_HEIGHT_BACKGROUND},"purple");
addBackgroundObjects(initializeBackgroundObj(startBoundary))


//Section to be fille up by the frog object to gain points


//Boundary between road and river
const roadRiverBoundary = new StaticObject("roadRiverBoundary", <Position>{x : 0, y : 315} , <dimensions>{width: 615, height: constants.DEFAULT_HEIGHT_BACKGROUND}, "purple");
addBackgroundObjects(initializeBackgroundObj(roadRiverBoundary))

//River section: Frog dies if it lands on the river
const River = new StaticObject("River", <Position>{x : 0, y : 0}, <dimensions>{width: 615, height: 315}, "lightblue")
addBackgroundObjects(initializeBackgroundObj(River));

// ------------------ static objects -----------------


//Adding our frog player
addForegroundObjects(frog);


const getShiftamount = (pos : number, shift: number): number => 
  Math.sign(shift) > 0 ? Math.min((constants.CANVAS_UPPER_BOUND - pos - 15), Math.abs(shift)) : 
 Math.min((pos - constants.CANVAS_LOWER_BOUND) , Math.abs(shift))



// -----------------Function to move objects ---------------------------
function moveObj(o : Body, moveFrog?: Movement) : Body{
  if(moveFrog)
  {
      return <Frog>{
      ...o,
      pos : <Position>{x : o.pos.x + Math.sign(moveFrog.x_shift) * getShiftamount(o.pos.x, moveFrog.x_shift) , y : o.pos.y + Math.sign(moveFrog.y_shift) * getShiftamount(o.pos.y, moveFrog.y_shift)}
    }
  }

  else{
    return <MovableRectangle>{
      ...o,
      pos : <Position>{x : o.pos.x + o.movement.x_shift ,  y : o.pos.y + o.movement.y_shift}
    }
  }

}


// --------------------- Functions to check for collisions ---------------------------

const logInBound = (s : Body) =>  
  s.pos.x - s.size.width  <= constants.CANVAS_UPPER_BOUND &&
  s.pos.x + s.size.width  >= constants.CANVAS_LOWER_BOUND

const overlap = (frogPosition : Position, log : Body): boolean => 
((log.pos.y) <= (frogPosition.y-constants.FROG_SIZE) && 
((frogPosition.y + constants.FROG_SIZE) <= (log.pos.y + log.size.height))) &&
 ((log.pos.x) <= (frogPosition.x - constants.FROG_SIZE)  && 
 (frogPosition.x + constants.FROG_SIZE) <= (log.pos.x + log.size.width))
//

 // --------------------- Functions to check for collisions ---------------------------

// --------------------- Function to check if game over || proceed to next level ---------------------

const inRiver = (s : State) : boolean => {
  if(s.frog.pos.y < 315){
    return true
  }else{
    return false
  }
}

const checkHighScore = (currentHighScore : number) => (currentScore : number) =>
currentHighScore > currentScore ? currentHighScore : currentScore;

// --------------------- Function to check if game over ---------------------

 // ------------------------ Our tick function ----------------------------------------

const tick = (s:State,elapsed:number) => {
  const not = <T>(f:(x:T)=>boolean)=>(x:T)=>!f(x);
  const expiredLogs:Body[] = s.logs.filter(not(logInBound));
  const  activeLogs: MovableRectangle[] = s.logs.filter(logInBound);
  const newHighScore = checkHighScore(s.highscore)

  //Now for the enemies

  //Expired enemies(out of canvas bound)
  const expiredEnemies: Body[] = s.enemies.filter(not(logInBound))

  //Active enemies
  const activeEnemies: MovableRectangle[] =s.enemies.filter(logInBound)


  //Const overlapping enemies
  const OverlapEnemies: MovableRectangle = activeEnemies.filter((l : MovableRectangle) => overlap(s.frog.pos, l))[0]
  
  //Check which logs overlap with our Frog 
  const OverlapLog : MovableRectangle = activeLogs.filter((l : MovableRectangle) => overlap(s.frog.pos, l))[0];
  
  //Objctive squares already visited
  const achievedGoals: Body = s.goals.filter((g : GoalObject) => overlap(s.frog.pos, g))[0];
  
  //Remaining squares to be visited
  const remainingGoals : GoalObject[] = s.goals.filter((g : GoalObject) => !(overlap(s.frog.pos, g)))


  if ((inRiver(s) && !OverlapLog && !achievedGoals) || OverlapEnemies){
    return <State>{
      ...s, 
      gameOver : true
    }
  }


  if(OverlapLog){

    return <State>
    {
      ...s, 
      //frog: inBounds(s.frog.pos, new LogMovement()) ? s.frog : moveObj(s.frog, new LogMovement()), 
      frog : moveObj(s.frog, OverlapLog.movement),
      logs:activeLogs.map((log : MovableRectangle) => moveObj(log)), 
      enemies : activeEnemies.map((log : MovableRectangle) => moveObj(log)),
      inLog : true,
      exit:expiredLogs.concat(expiredEnemies),
      highscore: newHighScore(s.score),
      score : !s.inLog ? s.score + 1 : s.score,
      time:elapsed
    }
  }

  else if(achievedGoals){
      return <State>
      {...s,
        frog : createFrog(),  
        logs:activeLogs.map((log : MovableRectangle) => moveObj(log)),
        enemies: activeEnemies.map((log : MovableRectangle) => moveObj(log)),
        goals : remainingGoals, 
        exit:expiredLogs.concat(achievedGoals).concat(expiredEnemies),
        inlog: true,
        highscore : newHighScore(s.score + 100),
        score: s.score + 100,
        achievedGoals: s.achievedGoals + 1,
        time:elapsed
      }
    }
  else if(expiredEnemies){
    return <State>
    {...s,  
      logs:activeLogs.map((log : MovableRectangle) => moveObj(log)),
      enemies: activeEnemies.map((log : MovableRectangle) => moveObj(log)),
      exit:expiredLogs.concat(expiredEnemies),
      inLog : false,
      time:elapsed
    }
  }
  else{
    return <State>
    {...s,  
      logs:activeLogs.map((log : MovableRectangle) => moveObj(log)),
      enemies: activeEnemies.map((log : MovableRectangle) => moveObj(log)),
      exit:expiredLogs,
      inLog : false,
      time:elapsed
    }
  }
}


// ------------------------ Our tick function ----------------------------------------


// -----------------Function to move objects ---------------------------



// ---------------- Frog controls and movement --------------------

type Key = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'KeyR';

//used to trigger movement of the frog - Up/Down/Left/Rights

const observeKey = <T>(k:Key, result:()=>T)=>
    fromEvent<KeyboardEvent>(document, "keydown")
      .pipe(
        filter(({code})=>code === k),
        filter(({repeat})=>!repeat),
        map(result)); 

const 
   shiftLeft = observeKey('ArrowLeft', () => new FrogMovement(-1 * constants.FROG_SHIFT, 0)),
   shiftRight = observeKey('ArrowRight', () => new FrogMovement(constants.FROG_SHIFT, 0)),
   shiftUp = observeKey( 'ArrowUp', () => new FrogMovement(0, -1 * constants.FROG_SHIFT)),
   shiftDown = observeKey('ArrowDown', () => new FrogMovement(0, constants.FROG_SHIFT)),
   restartGame = observeKey('KeyR', () => new Restart());

  
// ---------------- Frog controls and movement --------------------

//  ----------------- Helper functions for the state reducer ----------------------

const checkIfGoalExists = (g1 : GoalObject) => (g2 : GoalObject) => g1 === g2;

type MovableRectangleGenerator = (S : State) => MovableRectangle

//  ----------------- Helper functions for the state reducer ----------------------


// --------------- Game state reducer --------------------------
function reduceState(s : State,  e : Tick | FrogMovement |  MovableRectangleGenerator | GoalObject | Restart) : State{
    if(e instanceof Restart)
      return <State>{
        ...initialState,
        highscore : s.highscore, 
        restart : true,
        exit: s.exit.concat(s.enemies).concat(s.goals).concat(s.logs).concat(s.goals),
        gameOver : false
      } 
    else if(s.gameOver){
      return <State>{
        ...initialState,
        highscore : s.highscore, 
        restart : false,
        exit: s.exit.concat(s.enemies).concat(s.goals).concat(s.logs).concat(s.goals),
        gameOver : true
      } 
    }
    else if (e instanceof FrogMovement){
        return <State>{
            ...s,
            //frog: inBounds(s.frog.pos, e) ? s.frog : moveObj(s.frog, e),
            frog : moveObj(s.frog, e), 
            score : s.inLog ? s.score + 1 : s.score,
            highscore : s.inLog ? checkHighScore(s.highscore)(s.score + 1) : s.highscore
          }
      }
  else if( typeof e === 'function'){
    const log = e(s);
    if (log.colour === "brown"){
      return <State>
        {
          ...s, 
          logs: s.logs.concat([e(s)]),
          objCount : s.objCount + 1
        }
      }else{
        return <State>
        {
          ...s, 
          enemies: s.enemies.concat([e(s)]),
          objCount : s.objCount + 1
        }

      }
  }
  else if (e instanceof GoalObject){
    return <State>
    {
      ...s, 
      goals: s.goals.filter(checkIfGoalExists(e)).length ? s.goals : s.goals.concat(e)
    }
  }

  else{ 
    return tick(s, e.elapsed)
  }
}
// --------------- Game state reducer --------------------------


 // ----------------- Our function to update the view of the game ---------------

const renderScore = (s : State) => {
  const highscore = document.getElementById("highScore");
  const score = document.getElementById("currentScore");
  if (score) score.innerText = String(s.score);
  if(highscore) highscore.innerText = String(s.highscore);

}


function renderObjects(b : readonly Body[]){
  b.forEach((b : Body) =>{
    const createLogView = () => {
      const v = document.createElementNS(svg.namespaceURI, "rect")!;
      v.setAttribute("id", b.id); 
      v.setAttribute("fill", b.colour)
      
      if (b instanceof GoalObject){
        v.setAttribute("height", `${b.size.height}`)
        v.setAttribute("width", `${b.size.width}`)
        v.classList.add("Goals")
      }
      
      if(b instanceof MovableRectangle){
        v.setAttribute("height", `${b.size.height}`)
        v.setAttribute("width", `${b.size.width}`)
        v.classList.add("logs")
      }
      
      
      addBackgroundObjects(v)
      return v;
    }
  
    const v = document.getElementById(b.id) || createLogView();
    v.setAttribute("x",String(b.pos.x))
    v.setAttribute("y",String(b.pos.y))
    addBackgroundObjects(v)
  })

}

function updateView(s : State){

  //Get svg canvas
  const svg = document.getElementById("svgCanvas")!;


  if(s.gameOver){
    
    const gameOver  = document.getElementById("GameOver")
    if(gameOver) document.getElementById("foreground-layer")?.removeChild(gameOver);

    const v = document.createElementNS(svg.namespaceURI, "text")!;

    attr(v,{
      x: constants.CANVASSIZE/6,
      y: constants.CANVASSIZE/2,
      font: 50,
      class: "gameover",
      id: "GameOver"
    });

    v.textContent = "Game Over";
    foregroundLayer.appendChild(v);
  }
  
  else{


    //Remove the game over text
    const gameOver  = document.getElementById("GameOver")
    if(gameOver) document.getElementById("foreground-layer")?.removeChild(gameOver);

    //render the score
    renderScore(s);


    //Update frog movements
    const frog = document.getElementById("frog");
    frog?.setAttribute("cx", `${s.frog.pos.x}`);
    frog?.setAttribute("cy", `${s.frog.pos.y}`);

    if(frog) document.getElementById("foreground-layer")?.appendChild(frog);

    //Render our log and goal objects
    renderObjects(s.logs)

    //render our goal objects
    renderObjects(s.goals)


    //render our enemy objects
    renderObjects(s.enemies)
}

s.exit.forEach(o=>{
  const v = document.getElementById(o.id);
  if(v) document.getElementById("background-layer")?.removeChild(v)
})


}
  

// ----------------- Our function to update the view of the game ---------------



// --------------------- Streams ------------------------------- 
// s : State, Row : number, size : dimensions, movement : LogMovement
const generateRectObjects = (colour : string) => (row : number) => (height : number) => (width: number) => (shiftRight : boolean) => 
(shiftAmount : number) => (s : State) : MovableRectangle => 
createMovableRect(
  s,
  row, 
  <dimensions>{height : height, width : width},
  new RectMovement(shiftRight, shiftAmount), 
  colour
)

const Logs = generateRectObjects("brown");
const Enemies = generateRectObjects("yellow")

//Creating our log objects
const row1logs = Logs(0)(30)(50)(false)(1)
const row2logs = Logs(1)(30)(90)(true)(1)
const row3logs = Logs(2)(30)(90)(false)(1)
const row4logs = Logs(3)(30)(90)(true)(1)
const row5logs = Logs(4)(30)(90)(false)(1)
const row6logs = Logs(5)(30)(180)(true)(1)


//Creating our enemy objects
const row1enemies = Enemies(0)(30)(30)(false)(4)
const row2enemies = Enemies(1)(30)(30)(false)(4)
const row3enemies = Enemies(2)(30)(30)(true)(4)
const row4enemies = Enemies(3)(30)(30)(false)(4)
const row5enemies = Enemies(4)(30)(30)(true)(4)




//Creating our enemy objects

//Keeps track of the game time
// at every tick we will keep on moving each of our logs and enemies
const interval$ = interval(10).pipe(
  map(elapsed => new Tick(elapsed))
);


//Need to generate a stream of logs after a set amount of time

const MovableRectangleStream$ = (f : MovableRectangleGenerator) => (ival : number) =>
interval(ival).pipe(
  map(i => f)
)

//Generating logs in intervals
const FirstRowLogs$ = MovableRectangleStream$(row1logs)(3000)
const SecondRowLogs$ = MovableRectangleStream$(row2logs)(3000)
const ThirdRowLogs$ = MovableRectangleStream$(row3logs)(3000)
const FourthRowLogs$ = MovableRectangleStream$(row4logs)(3000)
const FifthRowLogs$ = MovableRectangleStream$(row5logs)(3000)
const SixthRowLogs$ = MovableRectangleStream$(row6logs)(6000)


//Generating enemies
const FirstRowEnemies$ = MovableRectangleStream$(row1enemies)(3000)
const SecondRowEnemies$ = MovableRectangleStream$(row2enemies)(3000)
const ThirdRowEnemies$ = MovableRectangleStream$(row3enemies)(3000)
const FourthRowEnemiess$ = MovableRectangleStream$(row4enemies)(3000)
const FifthRowEnemies$ = MovableRectangleStream$(row5enemies)(3000)



const LogStream$ = merge(FirstRowLogs$, SecondRowLogs$, ThirdRowLogs$, FourthRowLogs$,
   FifthRowLogs$, SixthRowLogs$);

const enemyStream$ = merge(FirstRowEnemies$, SecondRowEnemies$, ThirdRowEnemies$,
  FourthRowEnemiess$, FifthRowEnemies$, restartGame)

// generating squares which will serve as the objective of the frog
//increments the point
//They dissapear if the frog visits one of them
// Periodically generate new goal squares
const generateGoalSquares$ = interval(6000).pipe(
  map(i => goalArray[i % goalArray.length])
)

const userInputStream$ = merge(shiftDown, shiftLeft, shiftRight, shiftUp);


const play$ = merge(interval$, LogStream$,userInputStream$, generateGoalSquares$, enemyStream$).pipe(
  scan(reduceState, initialState), 
).subscribe(updateView)
 




// For highlighting keys corresponding to frog movmenents
// taken from tim's asteroids example with some minor modifications
type Event = 'keydown' | 'keyup';

function showKeys() {
  function showKey(k: Key) {
    const arrowKey = document.getElementById(k)!,
      o = (e: Event) =>
        fromEvent<KeyboardEvent>(document, e).pipe(
          filter(({ code }) => code === k)
        );
    o('keydown').subscribe((e) => arrowKey.classList.add('highlight'));
    o('keyup').subscribe((_) => arrowKey.classList.remove('highlight'));
  }
  showKey('ArrowLeft');
  showKey('ArrowRight');
  showKey('ArrowUp');
  showKey('ArrowDown');
  showKey('KeyR');
}

setTimeout(showKeys, 0); //
// --------------------- Streams -------------------------------  


}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
