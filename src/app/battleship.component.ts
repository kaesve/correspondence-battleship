import { Component, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import * as Battleship from '../lib/battleship';
import { X, Y, add, sub, rot90 } from '../lib/math';


const applyRotation = (p: number[], rotations: number) => {
  let rotatedP = p;
  const correctedRotations = ((rotations % 4) + 4) % 4;
  for (let i = 0; i < correctedRotations; ++i) {
    rotatedP = rot90(rotatedP);
  }

  return rotatedP;
}

class Cell {
  hasPlayerShip: string | null = null;
  hasOpponentShip = false;
  hasPlayerHit = false;
  hasOpponentHit = false;
}

@Component({
  selector: 'battleship-page',
  templateUrl: './battleship.component.html',
  styleUrls: ['./battleship.component.scss']
})
export class BattleshipComponent {
  
  whoStarts = 0;
  winner : number | null = null;
  player = 0;
  mode = 'lobby';

  gameDim = [10, 10];
  gameBoard : Cell[][] = [];

  shipTypes = Battleship.shipTypes;
  shipsUsed = Object.fromEntries(Battleship.shipTypes.map((type) => [type.name, false]));

  activeCell : number[] | null = null;
  activeShipTemplate : Battleship.ShipTemplate | null = null;
  rotationCount = 0;

  constructor(private route: ActivatedRoute, private elRef:ElementRef) {
    this.whoStarts = Math.round(Math.random());
    this.gameBoard = [];
    while (this.gameBoard.length < this.gameDim[1]) {
      const row = [];
      while (row.length < this.gameDim[0]) {
        row.push(new Cell());
      }
      this.gameBoard.push(row);
    }
  }

  ngOnInit() {
    const rawState = new URL(window.location.href).searchParams.get('s');
    
    if (rawState) {
      console.log('Parsing state');
      this.parseState(rawState);
    }

    // For easy debugging
    (window as any).component = this;
  }

  serializeCell(cell: Cell) : string {
    const binary = Object.values(cell)
      .map((v) => Number(Boolean(v)).toString())
      .join('');

    return parseInt(binary, 2).toString(16);
  }

  serializeBoard(board : Cell[][]) : string {
    return board.flat()
      .map(this.serializeCell)
      .join('');
  }

  parseCell(rawState: string) : Cell {
    const state = parseInt(rawState, 16);
    return {
      hasPlayerShip: 1 & (state >> 3) ? '🚢' : null,
      hasOpponentShip: Boolean(1 & (state >> 2)),
      hasPlayerHit: Boolean(1 & (state >> 1)),
      hasOpponentHit: Boolean(1 & (state >> 0)),
    };
  }

  parseState(rawState: string) {
    // const decoded = atob(rawState)
    this.whoStarts = parseInt(rawState[0]);
    const fields = rawState
      .substr(1)
      .split('')
      .map((f) => parseInt(f, 16))
      .map((f) => [
        (f >> 3) & 1,
        (f >> 2) & 1,
        (f >> 1) & 1,
        (f >> 0) & 1,
      ]);

    const [ p0Ships, p0Shots, p0Hits, p1Ships, p1Shots, p1Hits ] = fields
      .reduce(([ p0Ships, p0Shots, p0Hits, p1Ships, p1Shots, p1Hits ], cell) => [
        p0Ships + cell[0],
        p0Shots + cell[2],
        p0Hits + cell[2] * cell[1],
        p1Ships + cell[1],
        p1Shots + cell[3],
        p1Hits + cell[2] * cell[1],
      ], [ 0, 0, 0, 0, 0, 0 ]);

    if (p0Ships === 0) {      
      this.player = 0;
    } else if(p1Ships === 0) {
      this.player = 1;
    } else {
      this.mode = "game";
      this.player = (p0Shots + p1Shots + this.whoStarts) % 2;
      
      if (p0Ships === p1Hits) {
        this.mode = "over";
        this.winner = 1;
      } else if (p1Ships === p0Hits) {
        this.mode = "over";
        this.winner = 0;
      }
    }



    for (let y = 0; y < this.gameDim[Y]; ++y) {
      for (let x = 0; x < this.gameDim[X]; ++x) {
        const f = fields[x + y*this.gameDim[X]];
        this.gameBoard[y][x] = {
            hasPlayerShip: f[1] ? '🚢' : null,
            hasOpponentShip: Boolean(f[0]),
            hasPlayerHit: Boolean(f[3]),
            hasOpponentHit: Boolean(f[2]),
          };
      }
    }

    console.log(fields);
  }

  getStateUrl() {
    const state = this.whoStarts.toString() + this.serializeBoard(this.gameBoard);
    const url = new URL(window.location.href);
    url.searchParams.set('s', state);
    return url.toString();
  }


  moveCursor(point: number[], cell: Cell) {
    this.activeCell = point;
  }


  selectShip(template: Battleship.ShipTemplate) {
    if (this.shipsUsed[template.name]) {
      this.removeShip(template.name);
    }
    this.activeShipTemplate = template;
  }

  isFillTarget(p: number[]) {
    if (this.mode === 'lobby') {
      if (this.activeCell == null || this.activeShipTemplate == null) {
        return false;
      } else {
        const relativeP = sub(p, this.activeCell);
        return this.activeShipTemplate.cells.some((cell) => {
          const rotatedCell = applyRotation(cell, this.rotationCount);
          return relativeP[X] == rotatedCell[X] && relativeP[Y] == rotatedCell[Y];
        });
      }
    } else {
      return this.activeCell && this.activeCell[X] === p[X] && this.activeCell[Y] === p[Y];
    }
  }

  rotate(n: number) {
    this.rotationCount += n;
  }

  hasShips() {
    return Object.values(this.shipsUsed).some(used => !used);
  }

  canPut() {
    if (this.mode === 'lobby') {
      if (this.activeCell == null || this.activeShipTemplate == null) {
        return false;
      }
  
      return this.activeShipTemplate.cells.every((cell) => {
        const rotatedCell = applyRotation(cell, this.rotationCount);
        const absoluteCell = add(rotatedCell, this.activeCell as number[]);
  
        const isInBound = 0 <= absoluteCell[X] && absoluteCell[X] < this.gameDim[X]
          && 0 <= absoluteCell[Y] && absoluteCell[Y] < this.gameDim[Y];
  
        if (!isInBound) {
          return false;
        } else {
          const boardCell = this.gameBoard[absoluteCell[Y]][absoluteCell[X]];
          return !boardCell.hasPlayerShip;
        }
      });
    } else if (this.mode === 'game') {
      if (this.activeCell) {
        const boardCell = this.gameBoard[this.activeCell[Y]][this.activeCell[X]];
        return !boardCell.hasPlayerHit;
      }

    }

    return false;
  }

  placeShip(cursor: number[], template: Battleship.ShipTemplate) {
    const { cells, name } = template;
    cells.forEach((cell) => {
      const rotatedCell = applyRotation(cell, this.rotationCount);
      const absoluteCell = add(rotatedCell, cursor);
      const boardCell = this.gameBoard[absoluteCell[Y]][absoluteCell[X]];
      boardCell.hasPlayerShip = name;
    });

    this.shipsUsed[name] = true;
  }

  removeShip(name: string) {
    for (let y = 0; y < this.gameDim[Y]; ++y) {
      for (let x = 0; x < this.gameDim[X]; ++x) {
        const boardCell = this.gameBoard[y][x];
        if (boardCell.hasPlayerShip == name) {
          boardCell.hasPlayerShip = null;
        };
      }
    }

    this.shipsUsed[name] = false;
  }

  applyAction() {
    if (this.mode === 'lobby') {
      if (this.canPut()) {
        this.placeShip(this.activeCell as number[], this.activeShipTemplate as Battleship.ShipTemplate);
        this.activeCell = null;
        this.activeShipTemplate = null;
      } else if (!this.activeShipTemplate && this.activeCell) {
        const boardCell = this.gameBoard[this.activeCell[Y]][this.activeCell[X]];
        if (boardCell.hasPlayerShip) {
          this.activeShipTemplate = this.shipTypes.find((ship) => ship.name === boardCell.hasPlayerShip) || null;
          this.removeShip(boardCell.hasPlayerShip);
        }
      }
    } else if (this.mode === 'game') {
      if (this.canPut()) {
        const cursor = this.activeCell as number[];
        const boardCell = this.gameBoard[cursor[Y]][cursor[X]];
        boardCell.hasPlayerHit = true;

        this.mode = 'url';
      }
    }
  }

  shipWidth(shipTemplate: Battleship.ShipTemplate) {
    let min = Infinity, max = -Infinity;
    shipTemplate.cells.forEach((cell) => {
      min = Math.min(min, cell[X]);
      max = Math.max(max, cell[X]);
    });

    return `calc(var(--unit) * ${1 + max - min})`;
  }
  shipHeight(shipTemplate: Battleship.ShipTemplate) {
    let min = Infinity, max = -Infinity;
    shipTemplate.cells.forEach((cell) => {
      min = Math.min(min, cell[Y]);
      max = Math.max(max, cell[Y]);
    });

    return `calc(var(--unit) * ${1 + max - min})`;
  }

  submitPlan() {
    if (this.player === 0) {
      this.mode = 'url';
    } else if (this.player === 1) {
      this.mode = this.whoStarts === 0 ? 'url' : 'game';
    }
  }
}
