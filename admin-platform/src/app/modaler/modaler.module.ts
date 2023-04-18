import { NgModule ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgxPaginationModule} from 'ngx-pagination'
import { ModalerComponent } from './modaler.component';
import { ModalerRoutingModule } from './modaler-routing.module';
import { ModalerLandingPageComponent } from './modaler-landing-page/modaler-landing-page.component';
import { ModalerProductsComponent } from './modaler-products/modaler-products.component';
import { ReviewsComponent } from './reviews/reviews.component';





@NgModule({
  declarations: [
    ModalerComponent,
    ModalerLandingPageComponent,
    ModalerProductsComponent,
    ReviewsComponent,
    
  ],
  
  imports: [
    CommonModule,
    ModalerRoutingModule,
    NgxPaginationModule,
    
  ],

  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class ModalerModule { }
