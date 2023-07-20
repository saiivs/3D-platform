import { NgModule ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgxPaginationModule} from 'ngx-pagination'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ModalerComponent } from './modaler.component';
import { ModalerRoutingModule } from './modaler-routing.module';
import { ModalerLandingPageComponent } from './modaler-landing-page/modaler-landing-page.component';
import { ModalerProductsComponent } from './modaler-products/modaler-products.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { BankFormComponent } from './bank-form/bank-form.component';


import { MatDialogModule } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';
import { ModelerCorrectionViewComponent } from './modeler-correction-view/modeler-correction-view.component';
import {MatTabsModule} from '@angular/material/tabs';
import { ModelerProfileComponent } from './modeler-profile/modeler-profile.component';
import { FlexLayoutModule } from '@angular/flex-layout';







@NgModule({
  declarations: [
    ModalerComponent,
    ModalerLandingPageComponent,
    ModalerProductsComponent,
    ReviewsComponent,
    InvoiceComponent,
    BankFormComponent,
    ModelerCorrectionViewComponent,
    ModelerProfileComponent,
  ],
  
  imports: [
    CommonModule,
    ModalerRoutingModule,
    NgxPaginationModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule ,
    MatInputModule,
    MatTabsModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
  ],

  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class ModalerModule { }
