import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { AdminLandingPageComponent } from './admin-landing-page/admin-landing-page.component';
import { AdminReviewComponent } from './admin-review/admin-review.component';
import { AdminComponent } from './admin.component';
import { ProductsComponent } from './products/products.component';

const routes:Routes=[
{path:"",component:AdminComponent,canActivate:[AuthGuard],
children:[
  {path:"",component:AdminLandingPageComponent},
  {path:"products/:id",component:ProductsComponent},
  {path:"reviews/:articleId/:clientId",component:AdminReviewComponent}
]}


]


@NgModule({
  imports: [[RouterModule.forChild(routes)]],
  exports: [RouterModule]
})

export class AdminRoutingModule{}
