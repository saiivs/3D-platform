import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendService } from './services/backend.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private inject:Injector) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let authService = this.inject.get(BackendService);
    let jwtToken = request.clone({
      setHeaders:{
        Authorise:authService.getToken()
      }
    })
    
    return next.handle(jwtToken);
  }
}
