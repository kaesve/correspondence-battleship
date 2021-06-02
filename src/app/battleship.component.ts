import { Component, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';

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
  title = 'battleship-client';
  mode = 'lobby';
  gameCanvas = null;

  playerName = new FormControl('Admiral De Ruyter');

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

    console.log('hello', this.gameBoard)
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
    if (this.shipsUsed[template.name]) {
      this.removeShip(template.name);
    }
    this.activeShipTemplate = template;
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

  hasShips() {
    return Object.values(this.shipsUsed).some(used => !used);
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
}
