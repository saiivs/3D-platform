import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorPageComponent } from './error-page/error-page.component';
import { LoginGuardGuard } from './guards/login-guard.guard';
import { LoginComponent } from './login/login.component';
import { QaDoComponent } from './qa-do/qa-do.component';
import { TestComponent } from './test/test.component';
import { ActualFullScrenComponent } from './actual-full-scren/actual-full-scren.component';



const routes: Routes = [
  {path:"",component:LoginComponent,canActivate:[LoginGuardGuard]},
  {path:"QA_panel/:articleId/:clientId/:version",component:QaDoComponent},
  {path:"3d-model/viewer/:clientId/:client/:articleId/:version",component:ActualFullScrenComponent},
  {path:"test",component:TestComponent},
  {path:"admin",loadChildren:()=>import('./admin/admin.module').then((parent)=>parent.AdminModule)},
  {path:"modeler",loadChildren:()=>import('./modaler/modaler.module').then((parent)=>parent.ModalerModule)},
  {path:"QA",loadChildren:()=>import('./qa/qa.module').then((parent)=>parent.QAModule)},
  { path: 'error', component: ErrorPageComponent },
  { path: '**', redirectTo: 'error' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
