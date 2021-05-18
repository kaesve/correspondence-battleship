import { X, Y, add, sub, mul, div } from './math';



export class ShipTemplate {
  constructor(public name: string, public cells: number[][]) {
  }

  public static Parse(name: string, templateString: string) : ShipTemplate {
    const absoluteCells : { type: string, p: number[] }[] = templateString
      .split('\n')
      .map((line, y) => line
        .split('')
        .map((type, x) => ({ type, p: [ x, y ] }))
      )
      .flat();

    const center = absoluteCells.find(cell => cell.type === 'o');
    if (center) {

      const relativeCells = absoluteCells
        .filter(({ type }) => type === 'x' || type === 'o')
        .map(({ p }) => sub(p, center.p))
  
      return new ShipTemplate(name, relativeCells);
    } else {
      throw new Error("Cannot parse ship template without center: " + templateString)
    }   
  }
}


export const shipTypes : ShipTemplate[] = [
  ShipTemplate.Parse('Carrier', `xoxxx`),
  ShipTemplate.Parse('Battleship', `xoxx`),
  ShipTemplate.Parse('Cruiser', `oxx`),
  ShipTemplate.Parse('Submarine', `xoxxx`),
  ShipTemplate.Parse('Destroyer', `ox`),
];


class GameState {
  constructor(
    public turn: number,
    public player: number,
    public playerShips: boolean[][],
    public opponentShips: boolean[][],
    public playerHits: boolean[][],
    public opponentHits: boolean[][],
  ) { }

  public applyMove() {
    
  }
}

// const createGame = ()