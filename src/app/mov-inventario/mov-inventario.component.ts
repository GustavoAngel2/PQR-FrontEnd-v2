import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { UpdateMovInventario } from '../models/movInventario.model';
import { movInventarioService } from '../data.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DetalleMovService } from '../data.service';
import { DeleteMenuComponent } from '../delete-menu/delete-menu.component';
import { AlmacenesService } from '../data.service';
import { TiposMovService } from '../data.service';
import { ArticulosService } from '../data.service';
import { DetalleMov } from '../models/detalleMov.model';
import { Observable } from 'rxjs';
import { AutorizarMov } from '../data.service';
import { EstadosService } from '../data.service';
import { startWith, map } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { SearchMovModel } from '../models/detalleMov.model';
import { ToastrService } from 'ngx-toastr';
import { currentUser, AuthService } from '../auth.service';

@Component({
  selector: 'app-mov-inventario',
  templateUrl: './mov-inventario.component.html',
  styleUrls: ['./mov-inventario.component.css']
})
export class MovInventarioComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['Id', 'Codigo', 'Cantidad','Costo' , 'FechaActualiza', 'UsuarioActualiza'];
  dataSource: MatTableDataSource<DetalleMov>;
  idTipoMov: number = 0;
  idAlmacen: number = 0;
  idDestino: number = 0;
  ComboTipoMov:any;
  ComboAlmacen:any;
  tipoMov: UpdateMovInventario = {
    Id: 0,
    idAlmacen: 0,
    idTipoMov: 0,
    usuarioActualiza: 0,
  };
  datosCargados: boolean = false;
  isOnStepOne: boolean = true;
  isOnStepTwo: boolean = false;
  isOnStepThree: boolean = false;
  Estado:any;
  comboEstados: any[] =[];
  idMovimiento: any;
  codigo: string = '';
  cantidad: number = 0;
  costo: number = 0;
  ComboMov:any;
  ComboCodigo:any;
  IdEstadoControl = new FormControl('');
  IdMovControl = new FormControl('');
  CodigoControl = new FormControl('');
  IdArticuloControl = new FormControl('');

  selectedArticulo: any;  // Declarar la propiedad selectedArticulo
  selectedCodigo:any ;
  filteredArticulosCod!: Observable<any[]>;
  filteredArticulos!: Observable<any[]>;
  loggedUser: currentUser = { Id: '', NombreUsuario: '', IdRol: '', Rol: '' }

  search: SearchMovModel = {
    IdAlmacen : 0,
    FechaFin : '2024-01-01',
    FechaInicio : '2024-12-30'
  };
  

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private movInventarioService: movInventarioService,
    public dialog: MatDialog,
    private almacenesService: AlmacenesService,
    private tiposMovService: TiposMovService,
    private detalleMovService: DetalleMovService,
    private articulosService: ArticulosService,
    private estadosService: EstadosService,
    private AutorizarService: AutorizarMov,
    private toastr: ToastrService,
    private authService: AuthService
  ) {
    this.dataSource = new MatTableDataSource<DetalleMov>();
    this.loggedUser = authService.getCurrentUser();
  }

  ngOnInit() {
    
    this.filteredArticulos = this.IdArticuloControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterArticulos(value || ''))
    );

    this.filteredArticulosCod = this.CodigoControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterArticulosCod(value || ''))
    );

    this.IdArticuloControl.valueChanges.subscribe(value => {
      if (!value) {
        this.clearArticuloFields();
      }
    });

    this.CodigoControl.valueChanges.subscribe(value => {
      if (!value) {
        this.clearArticuloFields();
      }
    });

    this.getData();
   
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

  getData() {

    this.movInventarioService.getMovInventario(this.search).subscribe((data: any) => {
      this.ComboMov = data;
      console.log(this.ComboMov);
    });

    this.articulosService.getArticulos().subscribe((data2: any) => {
      this.ComboCodigo = data2;
      console.log(this.ComboCodigo);
    });

    this.tiposMovService.getTiposMov().subscribe((data: any) => {
      this.ComboTipoMov = data;
      console.log(this.ComboTipoMov);
    });

    this.almacenesService.getAlmacenes().subscribe((data2: any) => {
      this.ComboAlmacen = data2;
      console.log(this.ComboAlmacen);
    });
    this.estadosService.getEstados().subscribe((data6: any) => {
      this.comboEstados = data6;
      console.log(this.comboEstados);
    });
  }

  abrirDeleteDialog(Id: number, Name: string) {
    const dialogRef = this.dialog.open(DeleteMenuComponent, {
      width: '550px',
      data: Name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == "yes") {
        this.detalleMovService.deleteDetalleMov(Id).subscribe({
          next: (response) => {
            if(response.StatusCode == 200){
              this.toastr.success(response.response.data, 'Movimientos de inventario');
            } else {
              this.toastr.error(response.response.data,'Movimientos de inventario')
            }
            this.updateTable();
          },
          error: (error) => {
            console.error('Hubo un error al eliminar el almacén', error);
          }
        });
      }
    });
  }

  Autorizar() {
    const autorizar: { Id: number; Estatus: string } = {
      Id: this.idMovimiento,
      Estatus: '1'
    };
  
    console.log('Actualizando estado del ticket:', autorizar);
    this.AutorizarService.AutorizarMov(autorizar).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.getData(); // Actualizar datos después de la actualización
        if (response.StatusCode === 200) {
          this.toastr.success(response.message.toString(), 'Movimiento');
        } else {
          this.toastr.error(response.message.toString(), 'Movimiento ');
        }
      },
      error: (error) => {
        console.error('Error al actualizar el estado del ticket', error);
      }
    });
 /*    window.location.reload(); */
  }
  


  cargarDatos(elemento: any) {
    this.tipoMov.Id = elemento.Id;
    this.tipoMov.idAlmacen = elemento.IdAlmacen;
    this.tipoMov.idTipoMov = elemento.IdTipoMov;
    this.tipoMov.usuarioActualiza = elemento.Usuario;

    this.idTipoMov = elemento.IdTipoMov;
    this.idAlmacen = elemento.IdAlmacen;

    this.datosCargados = true;
    console.log(elemento);
  }

  insertarMov(): void {
    const nuevoMovInv = {
      idTipoMov: this.idTipoMov,
      idAlmacen: this.idAlmacen,
      idDestino: this.idDestino,
      usuarioActualiza: parseInt(this.loggedUser.Id,10)
    };
    this.movInventarioService.insertMovInventario(nuevoMovInv).subscribe({
      next: (response) => {
        console.log(response)
        console.log(nuevoMovInv)
        if(response.StatusCode == 200){
          this.toastr.success(response.message, 'Movimientos de inventario');
          this.idMovimiento = response.response.data;
          this.isOnStepOne = false
          this.isOnStepTwo = true
          this.getData();
        } else {
          this.toastr.error(response.message,'Movimientos de inventario')
        }
      },
      error: (error) => {
        console.error('Hubo un error al insertar el almacen', error);
      }
    });
  }

  insertarDetalleMov() {
    const nuevoDetalleMov = {
      idMovimiento: this.idMovimiento,
      codigo: this.codigo,
      cantidad: this.cantidad,
      costo: this.costo,
      usuarioActualiza: parseInt(this.loggedUser.Id,10)
    };
  
    console.log('Attempting to insert new detalle mov:', nuevoDetalleMov);
  
    this.detalleMovService.insertarDetalleMov(nuevoDetalleMov).subscribe({
      next: (response) => {
        console.log(response)
        if(response.StatusCode == 200){
          this.toastr.success(response.response.data, 'Movimientos de inventario');
        } else {
          this.toastr.error(response.response.data,'Movimientos de inventario')
        }
        this.updateTable();
      },
      error: (error) => {
        console.error('Error inserting detalle mov:', error);
        // Additional error handling logic, if needed
      }
    });
  }

  actualizar() {
    this.tipoMov.idAlmacen = this.idAlmacen;
    this.tipoMov.idTipoMov = this.idTipoMov;
    this.tipoMov.usuarioActualiza = parseInt(this.loggedUser.Id,10);
    this.movInventarioService.updateMovInventario(this.tipoMov).subscribe({
      next: (response) => {
        if(response.StatusCode == 200){
          this.toastr.success(response.response.Msg, 'Movimientos de inventario');
        } else {
          this.toastr.error(response.response.Msg,'Movimientos de inventario')
        }
        this.getData();
      },
      error: (error) => {
        console.error('Error al actualizar el almacen', error);
      }
    });
  }

  updateTable(){
    this.detalleMovService.getDetalleMov(this.idMovimiento).subscribe({
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

  articuloCodSelected(event: any) {
    const articuloCod = event.option.value;
    console.log('Artículo seleccionado:', articuloCod);
    this.selectedCodigo = articuloCod;
    this.selectedArticulo = articuloCod;
    this.codigo = articuloCod.Codigo;
    
  }
  
  displayArticuloCodFn(articulo: any): string {
    return articulo && articulo.Codigo ? articulo.Codigo : '';
  }
  
  private _filterArticulosCod(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.ComboCodigo.filter((option: any) => option.Codigo.toLowerCase().includes(filterValue));
  }

  private clearArticuloFields() {
    this.codigo = '';
    this.selectedCodigo = null;
    this.selectedArticulo = null;
  }

  reload(){
    this.Autorizar()
    window.location.reload()
  }

  articuloSelected(event: any) {
    const articulo = event.option.value;
    console.log(articulo);
    this.codigo = articulo.Codigo;  // Asegúrate de asignar el código del artículo aquí
    this.selectedCodigo = articulo;
    this.selectedArticulo = articulo;
    this.costo = articulo.Precio;
    console.log(articulo.Precio);
  }
  displayArticuloFn(articulo: any): string {
    return articulo ? articulo.Descripcion : '';
  }
  private _filterArticulos(value: any): any[] {
    const filterValue = (typeof value === 'string' ? value : '').toLowerCase();
    return this.ComboCodigo.filter((option:any) => option.Descripcion.toLowerCase().includes(filterValue));
  }
}
