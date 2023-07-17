import {  NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModalerGuard } from '../guards/modaler.guard';
import { ModalerLandingPageComponent } from './modaler-landing-page/modaler-landing-page.component';
import { ModalerProductsComponent } from './modaler-products/modaler-products.component';
import { ModalerComponent } from './modaler.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { ModelFullscreenComponent } from '../model-fullscreen/model-fullscreen.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { InteractiveChatComponent } from '../admin/interactive-chat/interactive-chat.component';
import { ModelerCorrectionViewComponent } from './modeler-correction-view/modeler-correction-view.component';

const route:Routes = [
  {path:"",component:ModalerComponent,canActivate:[ModalerGuard],
  children:[
    {path:"",component:ModalerLandingPageComponent},
    {path:"modaler-products/:id",component:ModalerProductsComponent},
    {path:"reviews/:articleId/:clientId/:version",component:ReviewsComponent},
    {path:"model-FullScreen/:articleId/:clientId/:version",component:ModelFullscreenComponent},
    {path:"model-correction/:articleId/:clientId/:version",component:ModelerCorrectionViewComponent},
    {path:"Invoice/:rollNo",component:InvoiceComponent}
  ]}
]

@NgModule({
  imports:[[RouterModule.forChild(route)]],
  exports:[RouterModule]
})

export class ModalerRoutingModule{

}
