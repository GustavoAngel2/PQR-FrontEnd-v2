import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { AlmacenesService } from '../data.service';
import { Almacen, UpdateAlmacen } from '../models/almacen.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DeleteMenuComponent } from '../delete-menu/delete-menu.component';
import { dialogParameters } from '../models/dialog.model';
import { DialogsComponent } from '../dialogs/dialogs.component';

@Component({
  selector: 'app-almacenes',
  templateUrl: './almacenes.component.html',
  styleUrls: ['./almacenes.component.css']
})

export class AlmacenesComponent implements OnInit, AfterViewInit {
  almacen: UpdateAlmacen = {
    Id: 0,
    Nombre: '',
    Direccion: '',
    Usuario: 0,
    Encargado: 0
  };
  dialogBody: dialogParameters = {
    title:'test',
    message:'This is a test',
    buttons:'ok'
  }
  datosCargados: boolean = false;

  displayedColumns: string[] = ['Id', 'Nombre', 'Direccion', 'Encargado', 'Usuario', 'FechaAct', 'FechaReg', 'Acciones'];
  dataSource: MatTableDataSource<Almacen>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  

  constructor(private AlmacenesService: AlmacenesService, public dialog: MatDialog,) {
    this.dataSource = new MatTableDataSource<Almacen>();
  }

  nombreAlmacen: string = '';
  direccion: string = '';
  usuario: number = 0;
  encargado: number = 0;

  insertar(): void {
    const nuevoAlmacen = {
      nombre: this.nombreAlmacen,
      direccion: this.direccion,
      usuario: this.usuario,
      encargado: this.encargado
    };

    this.AlmacenesService.insertarAlmacenes(nuevoAlmacen).subscribe({
      next: (response) => {
        console.log(response)
        this.getData();
        this.limpiar();
        this.dialogBody = {
          title : 'Almacenes',
          message: 'Registro insertado correctamente!',
          buttons:'ok'
        }
        this.showDialog(this.dialogBody)
      },
      error: (error) => {
        console.error('Hubo un error al insertar el almacen', error);
      }
    });
  }

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.dataSource.filterPredicate = (data: Almacen, filter: string) => {
      return data.Nombre.toLowerCase().includes(filter) || 
             data.Id.toString().includes(filter);
    };

    this.AlmacenesService.getAlmacenes().subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response); 
        if (response && Array.isArray(response) && response.length > 0) {
          this.dataSource.data = response;
        } else {
          console.log('no contiene datos');
        }
      },
      error: (error) => {
        console.error(error);
      }
    });

    
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  abrirDeleteDialog(Id: number, Name: string) {
    const dialogRef = this.dialog.open(DeleteMenuComponent, {
      width: '550px',
      data: Name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == "yes") {
        this.AlmacenesService.deleteAlmacenes(Id).subscribe({
          next: (response) => {
            this.getData();
          },
          error: (error) => {
            console.error('Hubo un error al eliminar el almacén', error);
          }
        });
      }
    });
  }

  showDialog(data:dialogParameters) {
    const dialogRef = this.dialog.open(DialogsComponent, {
      width: '550px',
      data: data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == "yes") {
        this.getData();
      }
    });
  }

  actualizar(): void {
    const almacenActualizado: UpdateAlmacen = {
      Id: this.almacen.Id,
      Nombre: this.nombreAlmacen,
      Direccion: this.direccion,
      Usuario: this.usuario,
      Encargado: this.encargado
    };
  
    console.log('Actualizando almacen:', almacenActualizado);
    this.AlmacenesService.updateAlmacenes(almacenActualizado).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.dialogBody = {
          title : 'Almacenes',
          message: 'Registro modificado correctamente!',
          buttons:'ok'
        }
        this.showDialog(this.dialogBody)
        this.getData(); // Actualizar datos después de la actualización
        this.limpiar();
      },
      error: (error) => {
        console.error('Error al actualizar el almacen', error);
      }
    });
  }

  cargarDatos(almacen: UpdateAlmacen) {
    this.almacen.Id = almacen.Id; // Asignar el ID al objeto almacen
    this.nombreAlmacen = almacen.Nombre;
    this.direccion = almacen.Direccion;
    this.usuario = almacen.Usuario;
    this.encargado = almacen.Encargado;
    this.datosCargados = true;
  }

  limpiar(): void{
    this.nombreAlmacen = "";
    this.direccion = "";
    this.usuario = 0;
    this.encargado = 0;
    this.datosCargados =false;
  }
}