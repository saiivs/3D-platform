import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgxPaginationModule} from 'ngx-pagination'
import { QaLandingPageComponent } from './qa-landing-page/qa-landing-page.component';
import { QaComponent } from './qa.component';
import { QaRoutingModule } from './qa-routing.module';
import { QaProductsComponent } from './qa-products/qa-products.component';
import { QaReviewsComponent } from './qa-reviews/qa-reviews.component';
import { QaAdminReviewComponent } from './qa-admin-review/qa-admin-review.component';
import { ScrollDownDirective } from './scroll-down.directive';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';





@NgModule({
  declarations: [
    QaComponent,
    QaLandingPageComponent,
    QaProductsComponent,
    QaReviewsComponent,
    QaAdminReviewComponent,
    ScrollDownDirective,

    
  ],
  imports: [
    CommonModule,
    QaRoutingModule,
    NgxPaginationModule,
    FormsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class QAModule { }
