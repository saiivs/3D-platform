import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { BackendService } from '../services/backend.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private backEndService:BackendService,private router:Router){

  }

  canActivate():any{
    if(window.sessionStorage.getItem('userToken')&&localStorage.getItem("userRole") == "admin"){
      this.backEndService.checkUser().subscribe((response)=>{
        if(response.prevent){
          return false;
        }else{
          return true;
        }
      })
    }else{
      this.router.navigate(['pageNotFound'])
      return false;
    }

  }

}
