import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginGuardGuard implements CanActivate {

  constructor(private router:Router){

  }

  checkUrl():any{
    let role = localStorage.getItem('userRole');
    if(role == 'admin'){
      role = "admin"
      return role
    }else if(role == '3D'){
      role = "modaler"
      return role;
    }else if(role == 'QA'){
      role = "QA"
      return role
    }
  }

  canActivate():any{
    if(localStorage.getItem('userToken')){
      let url = this.checkUrl();
      this.router.navigate([url])
    }else{
      return true;
    }
  }


}
