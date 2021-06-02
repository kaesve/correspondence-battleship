import { Component, ElementRef } from '@angular/core';


@Component({
  selector: 'landing-page',
  templateUrl: './landing.component.html',
  styleUrls: ['./app.component.scss']
})
export class LandingComponent {
  title = 'battleship-client';

  constructor(private elRef:ElementRef) {
  }

}
