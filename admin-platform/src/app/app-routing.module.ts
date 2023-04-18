import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorPageComponent } from './error-page/error-page.component';
import { LoginGuardGuard } from './guards/login-guard.guard';
import { LoginComponent } from './login/login.component';


const routes: Routes = [
  {path:"",component:LoginComponent,canActivate:[LoginGuardGuard]},
  {path:"admin",loadChildren:()=>import('./admin/admin.module').then((parent)=>parent.AdminModule)},
  {path:"modaler",loadChildren:()=>import('./modaler/modaler.module').then((parent)=>parent.ModalerModule)},
  {path:"QA",loadChildren:()=>import('./qa/qa.module').then((parent)=>parent.QAModule)},
  { path: 'error', component: ErrorPageComponent },
  { path: '**', redirectTo: 'error' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
