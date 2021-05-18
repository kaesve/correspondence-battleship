import { Component, ElementRef } from '@angular/core';

import * as Battleship from '../lib/battleship';
import { X, Y, add, sub, mul, div, rot90 } from '../lib/math';


const applyRotation = (p: number[], rotations: number) => {
  let rotatedP = p;
  const correctedRotations = ((rotations % 4) + 4) % 4;
  for (let i = 0; i < correctedRotations; ++i) {
    rotatedP = rot90(rotatedP);
  }

  return rotatedP;
}

class Cell {
  hasPlayerShip: Battleship.ShipTemplate | null = null;
  hasOpponentShip = false;
  hasPlayerHit = false;
  hasOpponentHit = false;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'battleship-client';
  gameCanvas = null;

  gameDim = [10, 10];

  gameBoard : Cell[][] = [];

  activeCell : number[] | null = null;
  activeShipTemplate : Battleship.ShipTemplate | null = null;
  rotationCount = 0;

  constructor(private elRef:ElementRef) {
    this.gameBoard = [];
    while (this.gameBoard.length < this.gameDim[1]) {
      const row = [];
      while (row.length < this.gameDim[0]) {
        row.push(new Cell());
      }
      this.gameBoard.push(row);
    }
  }

  shipTypes = Battleship.shipTypes;

  shipsUsed = Object.fromEntries(Battleship.shipTypes.map((type) => [type.name, false]));

  ngAfterViewInit() {
    const c = this.elRef.nativeElement.querySelector('canvas');
  }

  moveCursor(point: number[], cell: Cell) {
    this.activeCell = point;
  }


  selectShip(template: Battleship.ShipTemplate) {
    if (!this.shipsUsed[template.name]) {
      this.activeShipTemplate = template;
    }
  }

  isFillTarget(p: number[]) {
    if (this.activeCell == null || this.activeShipTemplate == null) {
      return false;
    } else {
      const relativeP = sub(p, this.activeCell);
      return this.activeShipTemplate.cells.some((cell) => {
        const rotatedCell = applyRotation(cell, this.rotationCount);
        return relativeP[X] == rotatedCell[X] && relativeP[Y] == rotatedCell[Y];
      });
    }
  }

  rotate(n: number) {
    this.rotationCount += n;
  }

  canPut() {
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
  }

  applyAction() {
    if (this.canPut()) {
      const { cells, name } = this.activeShipTemplate as Battleship.ShipTemplate;
      cells.forEach((cell) => {
        const rotatedCell = applyRotation(cell, this.rotationCount);
        const absoluteCell = add(rotatedCell, this.activeCell as number[]);
        const boardCell = this.gameBoard[absoluteCell[Y]][absoluteCell[X]];
        boardCell.hasPlayerShip = this.activeShipTemplate;
      });

      this.shipsUsed[name] = true;
      this.activeCell = null;
      this.activeShipTemplate = null;
    }
  }
}
