import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DetallePerfilService } from '../data.service';
import { DetallePerfil, UpdateDetallePerfil } from '../models/detallePerfil.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RolesService } from '../data.service';
import { ModulosService } from '../data.service';
import { DeleteMenuComponent } from '../delete-menu/delete-menu.component';
import { AuthService, currentUser } from '../auth.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-detalle-perfil',
  templateUrl: './detalle-perfil.component.html',
  styleUrls: ['./detalle-perfil.component.css']
})
export class DetallePerfilComponent implements OnInit, AfterViewInit {
  detPerfil: UpdateDetallePerfil={
    Id: 0,
    idPerfil:0,
    idModulo: 0,
    acceso: 0,
    usuarioActualiza: 0,
    estatus: 0
  }

  datosCargados: boolean = false;
  
  displayedColumns: string[] = ['id', 'nombreModulo', 'rol', 'acceso', "fechaRegistro", 'fechaActualiza', "UsuarioActualiza",'Acciones'];
  dataSource: MatTableDataSource<DetallePerfil>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private DetallePerfilService: DetallePerfilService, 
    public dialog:MatDialog, 
    private modulosService: ModulosService, 
    private authService: AuthService  ,
    private rolesService :RolesService,
    private toastr: ToastrService
    
  ) {
    this.dataSource = new MatTableDataSource<DetallePerfil>(); // Inicializa dataSource como una instancia de MatTableDataSource
  }

  idPerfil: number = 0;
  idModulo: number = 0;
  acceso: number = 0;
  usuarioActualiza: number = 0;
  ComboRol : any;
  ComboModulo:any;

  loggedInUser: currentUser = { Id: '', NombreUsuario: '' ,Rol:'', IdRol:''};


  ngOnInit() {
    this.getData();
    this.loggedInUser = this.authService.getCurrentUser(); // Obtener el usuario logeado
    console.log('Usuario logeado:', this.loggedInUser);
  }


    ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  
  // Método para realizar el filtrado
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getData(){

    this.rolesService.getRoles().subscribe((data: any) => {
      this.ComboRol = data;
      console.log(this.ComboRol)
    });
     this.modulosService.getModulos().subscribe((data2: any) => {
      this.ComboModulo = data2;
      console.log(this.ComboModulo)
    });

    this.dataSource.filterPredicate = (data: DetallePerfil, filter: string) => {
      return data.id.toString(0).includes(filter); // Puedes añadir más campos si es necesario
    };
    
    this.DetallePerfilService.getDetallePerfil().subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response); 
        if (response && Array.isArray(response)&&response.length>0) {
          this.dataSource.data = response; // Asigna los datos al atributo 'data' de dataSource
        } else {
          console.log('no contiene datos');
        }
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  abrirDeleteDialog(Id: number , Name: string) {
    const dialogRef = this.dialog.open(DeleteMenuComponent, {
      width: '550px',
      data: Name
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == "yes"){
        this.DetallePerfilService.deleteDetallePerfil(Id).subscribe({
          next: (response) => {
            if(response.StatusCode == 200){
              this.toastr.success(response.message, 'Detalle Eliminado');
            } else {
              this.toastr.error(response.message,'No se pudo eliminar Detalle ')
            }
            this.getData();
          },
          error: (error) => {
            console.error('Hubo un error al eliminar el Detalle', error);
          }
        });
        this.getData()
      }
    });
  }
  insertar(): void {
    const nuevoDetallePerfil = {
      idPerfil: this.idPerfil,
      idModulo: this.idModulo,
      acceso: this.acceso,
      usuarioActualiza: parseInt(this.loggedInUser.Id, 10),
    };
    if(this.idPerfil == 0 && this.idModulo == 0 && this.acceso == 0){
      this.toastr.error('No deje los datos en blanco','Almacenes')
    } else {
    this.DetallePerfilService.insertarDetallePerfil(nuevoDetallePerfil).subscribe({
      next: (response) => {
        this.getData();
        this.idPerfil = 0;
        this.idModulo = 0;
        this.acceso = 0;
        if(response.StatusCode == 200){
          this.toastr.success(response.message, 'Detalle Perfil');
        } else {
          this.toastr.error(response.message,'Detalle Perfil')
        }
      },
      error: (error) => {
        console.error('Hubo un error al insertar el almacen: ', error);
      }
    });
  }
}

  actualizar(): void {
    const detallePerfilActualizado: UpdateDetallePerfil = {
      Id: this.detPerfil.Id,
      idPerfil: this.idPerfil,
      idModulo: this.idModulo,
      acceso:this.acceso,
      usuarioActualiza: parseInt(this.loggedInUser.Id, 10),
      estatus:1
    };
  
    console.log('Actualizando almacen:', detallePerfilActualizado);
    this.DetallePerfilService.updateDetallePerfil(detallePerfilActualizado).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.getData(); // Actualizar datos después de la actualización
        this.limpiar();
        if(response.StatusCode == 200){
          this.toastr.success(response.message, 'Detalle Perfil');
        } else {
          this.toastr.error(response.message,'Detalle Perfil')
        }
      },
      error: (error) => {
        console.error('Error al actualizar el Detalle', error);
      }
    });
  }


  eliminarDetallePerfil(Id: number) {
    if (confirm(`¿Estás seguro de que deseas eliminar esta informacion del perfil con id: ${Id} ?`)) {
      this.DetallePerfilService.deleteDetallePerfil(Id).subscribe({
        next: (response) => {
          this.dataSource.data = this.dataSource.data.filter((DetallePerfil: DetallePerfil) => DetallePerfil.id !== Id);
          this.getData();
        },
        error: (error) => {
          
          console.error('Hubo un error al eliminar la informacion de este perfil :', error);
        }
      });
    }
  }
  
  cargarDatos(detallePerfil:UpdateDetallePerfil) {
    this.detPerfil.Id = detallePerfil.Id
    this.datosCargados = true;
    console.log(detallePerfil.Id)
  }
  limpiar(): void{
    this.datosCargados =false;
  }
}