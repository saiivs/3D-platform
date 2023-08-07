import {  NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QAGuardGuard } from '../guards/qa-guard.guard';
import { QaAdminReviewComponent } from './qa-admin-review/qa-admin-review.component';
import { QaLandingPageComponent } from './qa-landing-page/qa-landing-page.component';
import { QaProductsComponent } from './qa-products/qa-products.component';
import { QaReviewsComponent } from './qa-reviews/qa-reviews.component';
import { QaComponent } from './qa.component';
import { ModelFullscreenComponent } from '../model-fullscreen/model-fullscreen.component';
import { QaProfileComponent } from './qa-profile/qa-profile.component';
import { ApprovedModelsComponent } from './approved-models/approved-models.component';



const route:Routes = [
{path:"",component:QaComponent,canActivate:[QAGuardGuard],
children:[
  {path:"",component:QaLandingPageComponent},
  {path:"Qa-products/:id",component:QaProductsComponent},
  {path:"reviews/:articleId/:clientId/:version",component:QaReviewsComponent},
  {path:"admin/:articleId/:clientId/:version",component:QaAdminReviewComponent},
  {path:"model-FullScreen/:articleId/:clientId/:version",component:ModelFullscreenComponent},
  {path:"approved-models",component:ApprovedModelsComponent},
  {path:"profile",component:QaProfileComponent}
]}
]

@NgModule({
  imports:[[RouterModule.forChild(route)]],
  exports:[RouterModule]
})

export class QaRoutingModule{

}
