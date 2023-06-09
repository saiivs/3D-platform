import { NgModule ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgxPaginationModule} from 'ngx-pagination';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';




import { AdminLandingPageComponent } from './admin-landing-page/admin-landing-page.component';
import { ProductsComponent } from './products/products.component';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';

import { AdminReviewComponent } from './admin-review/admin-review.component';
import { ModelerStatusComponent } from './modeler-status/modeler-status.component';
import { ClientModelerListComponent } from './client-modeler-list/client-modeler-list.component';
import { ArchiveClientsComponent } from './archive-clients/archive-clients.component';
import { AllModelsComponent } from './all-models/all-models.component';
import { InteractiveChatComponent } from './interactive-chat/interactive-chat.component';




@NgModule({
  declarations: [
    AdminComponent,
    AdminLandingPageComponent,
    ProductsComponent,
    AdminReviewComponent,
    ModelerStatusComponent,
    ClientModelerListComponent,
    ArchiveClientsComponent,
    AllModelsComponent,
    InteractiveChatComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    NgxPaginationModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTooltipModule
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]

})
export class AdminModule { }
