import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ArticulosService } from '../data.service';
import { articulos, deleteCArticulos } from '../models/articulo.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ArticulosInsertComponent } from '../articulos-insert/articulos-insert.component';
import { ArticulosUpdateComponent } from '../articulos-update/articulos-update.component';

@Component({
  selector: 'app-articulos',
  templateUrl: './articulos.component.html',
  styleUrls: ['./articulos.component.css']
})
export class ArticulosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['Id', 'Codigo', 'Descripcion', 'UM', 'Usuario','Costo','Precio','Fecha Registro','Fecha Actualiza','Acciones'];
  dataSource: MatTableDataSource<articulos>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private articulosService: ArticulosService, public dialog:MatDialog) {
    this.dataSource = new MatTableDataSource<articulos>(); // Inicializa dataSource como una instancia de MatTableDataSource
  }

  ngOnInit() {
    this.getData();
  }

  getData(){
    this.dataSource.filterPredicate = (data: articulos, filter: string) => {
      return data.Descripcion.toLowerCase().includes(filter) || 
             data.Id.toString().includes(filter); // Puedes añadir más campos si es necesario
    };
    this.articulosService.getArticulos().subscribe({
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
  abrirInsertarModal() {
    const dialogRef = this.dialog.open(ArticulosInsertComponent, {
      width: '550px',
      // Puedes pasar datos al componente de la modal si es necesario
    });

    dialogRef.afterClosed().subscribe(result => {
      if ( result == 'reload'){
        this.getData()
      }
    });
  }
  eliminarArticulo(Id: number) {
    // Aquí puedes agregar una confirmación antes de eliminar si lo deseas
    if (confirm('¿Estás seguro de que deseas eliminar este departamento?')) {
      this.articulosService.deleteArticulos(Id).subscribe({
        next: (response) => {
          console.log(response);
          this.dataSource.data = this.dataSource.data.filter((articulo: articulos) => articulo.Id !== Id);
        },
        error: (error) => {
          // Manejar el error aquí
          console.error('Hubo un error al eliminar el departamento', error);
        }
      });
    }
  }
  abrirEditarModal(articulos: articulos) {
    const dialogRef = this.dialog.open(ArticulosUpdateComponent, {
      width: '550px',
      data: articulos // Pasa el objeto de departamento a la modal
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'reload') {
        this.getData();
      }
    });
  }
}
