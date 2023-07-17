import { NgModule ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import {NgxPaginationModule} from 'ngx-pagination'
import { MatDialogModule } from '@angular/material/dialog';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import {MatTabsModule} from '@angular/material/tabs';



import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { TokenInterceptor } from './token.interceptor';
import { ErrorPageComponent } from './error-page/error-page.component';
import { CorrectionDilogComponent } from './correction-dilog/correction-dilog.component';
import { ModelFullscreenComponent } from './model-fullscreen/model-fullscreen.component';
import { ToastrModule } from 'ngx-toastr';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModelWarningComponent } from './model-warning/model-warning.component';
import { QaDoComponent } from './qa-do/qa-do.component';
import { ActiveDirective } from './customDirectives/active.directive';
import { TestComponent } from './test/test.component';
import { GalleryComponent } from './gallery/gallery.component';
import { HotspotCorrectionComponent } from './hotspot-correction/hotspot-correction.component';
import { CorrectionImageComponent } from './correction-image/correction-image.component';





@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ErrorPageComponent,
    CorrectionDilogComponent,
    ModelFullscreenComponent,
    ModelWarningComponent,
    QaDoComponent,
    ActiveDirective,
    TestComponent,
    GalleryComponent,
    HotspotCorrectionComponent,
    CorrectionImageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatTooltipModule, 
    NgxPaginationModule,
    NgxImageZoomModule,
    MatTabsModule,
    ToastrModule.forRoot(),
    SweetAlert2Module.forRoot()
  ],
  providers: [{provide:HTTP_INTERCEPTORS,useClass:TokenInterceptor,multi:true},Title],
  bootstrap: [AppComponent] ,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }
