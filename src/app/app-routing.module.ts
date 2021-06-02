import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleshipComponent } from './battleship.component';
import { LandingComponent } from './landing.component';

const routes: Routes = [
  { path: 'battleship', component: BattleshipComponent },
  { path: 'battleship/:gameState', component: BattleshipComponent },
  { path: '', component: LandingComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
