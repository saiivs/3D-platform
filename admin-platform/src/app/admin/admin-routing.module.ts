import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { AdminLandingPageComponent } from './admin-landing-page/admin-landing-page.component';
import { AdminReviewComponent } from './admin-review/admin-review.component';
import { AdminComponent } from './admin.component';
import { ProductsComponent } from './products/products.component';
import { ModelerStatusComponent } from './modeler-status/modeler-status.component';
import { ClientModelerListComponent } from './client-modeler-list/client-modeler-list.component';
import { ModelFullscreenComponent } from '../model-fullscreen/model-fullscreen.component';
import { ArchiveClientsComponent } from './archive-clients/archive-clients.component';
import { AllModelsComponent } from './all-models/all-models.component';
import { InteractiveChatComponent } from './interactive-chat/interactive-chat.component';

const routes:Routes=[
{path:"",component:AdminComponent,canActivate:[AuthGuard],
children:[
  {path:"",component:AdminLandingPageComponent},
  {path:"products/:id",component:ProductsComponent},
  {path:"reviews/:articleId/:clientId",component:AdminReviewComponent},
  {path:"interactive-section/:articleId/:clientId/:version",component:InteractiveChatComponent},
  {path:"modeler-status",component:ModelerStatusComponent},
  {path:"client_modelers/:clientId",component:ClientModelerListComponent},
  {path:"model-FullScreen/:articleId/:clientId",component:ModelFullscreenComponent},
  {path:"archive",component:ArchiveClientsComponent},
  {path:"models/:modelerId",component:AllModelsComponent}
]}
]


@NgModule({
  imports: [[RouterModule.forChild(routes)]],
  exports: [RouterModule]
})

export class AdminRoutingModule{}
