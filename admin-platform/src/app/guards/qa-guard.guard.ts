import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { BackendService } from '../services/backend.service';

@Injectable({
  providedIn: 'root'
})
export class QAGuardGuard implements CanActivate {

  constructor(private backEndService:BackendService,private router:Router){

  }

  canActivate():any{
    if(localStorage.getItem("userToken")&&localStorage.getItem("userRole") == "QA"){
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
