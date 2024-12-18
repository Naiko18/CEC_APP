import { Component, OnInit } from '@angular/core';
import { ServiceService } from '../service.service';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export function mayorDeEdadValidator(control: AbstractControl): ValidationErrors | null {
  const fechaNacimiento = new Date(control.value);
  const year2024 = new Date('2024-01-01');

  const edad = year2024.getFullYear() - fechaNacimiento.getFullYear();
  const diferenciaMes = year2024.getMonth() - fechaNacimiento.getMonth();
  const diferenciaDia = year2024.getDate() - fechaNacimiento.getDate();

  return edad >= 18 ? null : { menorDeEdad: true };

}

@Component({
  selector: 'app-mantenedor',
  templateUrl: './mantenedor.page.html',
  styleUrls: ['./mantenedor.page.scss'],
})

export class MantenedorPage implements OnInit {

  usuario: FormGroup; 
  usuarios: FormGroup[] = []; 
  showAlert = false;
  isEditing: boolean = false;
  editingUsuario: FormGroup | null = null;


  constructor(private service: ServiceService) {
    this.usuario = new FormGroup({
  
      nom_usuario: new FormControl('',[Validators.required,Validators.pattern("[a-z]{3,10}")]),
      contraseña: new FormControl('',[Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)]),
      rep_contraseña: new FormControl('',[Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)]),
      correo: new FormControl('',[Validators.required, Validators.email, Validators.pattern("[a-zA-Z0-9._%+-]+@duocuc.cl")]),
      rut: new FormControl('',[Validators.required, this.validarRut() ,Validators.pattern("[0-9]{7,8}-[0-9kK]{1}")]),
      fec_nacimiento: new FormControl('',[Validators.required, mayorDeEdadValidator]),
      genero: new FormControl('',[Validators.required]),
      pos_vehiculo: new FormControl('',[]),
      patente: new FormControl('',[Validators.pattern(/^[A-Z]{2} [A-Z]{2} \d{1,}$/)]),  
      cantidad_asientos: new FormControl('',[]),
      mod_vehi: new FormControl('',[]),  
      tip_user: new FormControl('',[Validators.required])
    },  
    { validators: this.passwordsMatchValidator('contraseña', 'rep_contraseña') });
   }

   ngOnInit() {
    this.obtenerUsuarios(); 
  }

  agregarUsuario() {
    if (this.usuario.valid) {
        const exito = this.service.agregarUsuario(this.usuario.value);
        if (exito) {
            this.obtenerUsuarios(); 
            this.resetForm();
        }
    } else {
        console.log('Formulario no válido:', this.usuario.errors);
    }
  }

  deleteUsuario(rut: string) {
    const result = this.service.eliminarUsuario(rut);
    if (result) {
      console.log('Usuario eliminado:', rut);
      this.obtenerUsuarios();
    } else {
      console.log('Usuario no encontrado para eliminar:', rut);
    }
  }

  editUsuario(usuario: FormGroup) {
    this.editingUsuario = usuario;
    this.isEditing = true; 
    this.usuario.patchValue({
      nom_usuario: usuario.get('nom_usuario')?.value,
      contraseña: usuario.get('contraseña')?.value,
      correo: usuario.get('correo')?.value,
      rut: usuario.get('rut')?.value,
      fec_nacimiento: usuario.get('fec_nacimiento')?.value,
      genero: usuario.get('genero')?.value
    });
  }

  confirmEdit() {
    if (this.editingUsuario) {
      this.service.modificarUsuario(this.editingUsuario.get('rut')?.value, this.usuario);
      this.isEditing = false; 
      this.editingUsuario = null; 
      this.obtenerUsuarios();
    }
  }

  resetForm() {
    this.usuario.reset();
  }

  obtenerUsuarios() {
    this.usuarios = this.service.obtenerUsuarios();
  }

  validarRut(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      let rut = control.value;
      
      if (!rut) return null; 
      
      rut = rut.replace(/\./g, '').replace(/-/g, '');
  
      if (rut.length < 8) {
        return { rutInvalido: true };
      }
  
      const cuerpo = rut.slice(0, -1);
      const dv = rut.slice(-1).toUpperCase();
  
      if (!/^\d+$/.test(cuerpo)) {
        return { rutInvalido: true };
      }
  
      let suma = 0;
      let multiplicador = 2;
  
      for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i], 10) * multiplicador;
        multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
      }
  
      const residuo = 11 - (suma % 11);
      let dvCalculado = '';
  
      if (residuo === 11) {
        dvCalculado = '0';
      } else if (residuo === 10) {
        dvCalculado = 'K';
      } else {
        dvCalculado = residuo.toString();
      }
  
      return dv === dvCalculado ? null : { rutInvalido: true };
    };
  }

  passwordsMatchValidator(controlName: string, matchingControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: boolean } | null => {
      const control = formGroup.get(controlName);
      const matchingControl = formGroup.get(matchingControlName);
  
      if (!control || !matchingControl) {
        return null;
      }
  
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ passwordsMismatch: true });
        return { passwordsMismatch: true };
      } else {
        matchingControl.setErrors(null); 
        return null;
      }
    };
  }

}
