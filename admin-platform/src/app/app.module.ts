import { NgModule ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { MatDialogModule } from '@angular/material/dialog';



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




@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ErrorPageComponent,
    CorrectionDilogComponent,
    ModelFullscreenComponent,
    ModelWarningComponent

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
    ToastrModule.forRoot(),
    SweetAlert2Module.forRoot()
  ],
  providers: [{provide:HTTP_INTERCEPTORS,useClass:TokenInterceptor,multi:true},Title],
  bootstrap: [AppComponent] ,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }
