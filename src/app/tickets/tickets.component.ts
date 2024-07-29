import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { ClientesService, TicketsSevice, DetalleTicketService, TiposMovService, ArticulosService, AlmacenesService } from '../data.service';
import { DetalleTicket } from '../models/detalleTicket.model';
import { DeleteMenuComponent } from '../delete-menu/delete-menu.component';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService,currentUser } from '../auth.service';


@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css']
})
export class TicketsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['Id', 'IdTicket', 'Codigo', 'Articulo', 'Cantidad', 'PrecioVenta', 'Total', 'Usuario', 'Estatus', 'Acciones'];
  dataSource: MatTableDataSource<DetalleTicket>;

  // Tickets
  IdSucursal: number = 0;
  IdCliente: number = 0;
  IdVendedor: number = 0;
  Usuario: number = 0;

  // Detalle tickets
  idTicket: any;
  totalTicket: number = 0;
  idArticulo: any;
  codigo: any;
  Descripcion: any;
  cantidad: number = 0;
  precioVenta: number = 0;
  usuario: number = 0;
  ComboCodigo: any[] = [];
  ComboTicket: any;
  detalleticket: any[] = [];
  ComboSucursales: any;
  ComboTipoMov: any;
  filteredArticulos!: Observable<any[]>;
  ComboClientes: any[] = [];
  filteredClientes!: Observable<any[]>;
  filteredArticulosCod!: Observable<any[]>;
  isOnStepOne = true;
  isOnStepTwo = false;
  fechaInicio: string = '';
  fechaFin: string = '';
  dateHandler: Date = new Date();
  dateHandler2: Date = new Date();
  isTicketFormVisible= true;
  loggedInUser: currentUser = { Id: '', NombreUsuario: '' ,Rol:'', IdRol:''};


  // New ticket
  IdSucursalControl = new FormControl('');
  IdClienteControl = new FormControl('');
  IdVendedorControl = new FormControl('');
  IdUsusarioControl = new FormControl('');

  // New ticket detail
  IdTicketControl = new FormControl('');
  IdArticuloControl = new FormControl('');
  CodigoControl = new FormControl('');
  CantidadControl = new FormControl('');
  PrecioControl = new FormControl('');
  IdUsuarioDetalleControl = new FormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  selectedArticulo: any;  // Declarar la propiedad selectedArticulo
  selectedCliente: any;  // Declarar la propiedad selectedCliente
  selectedCodigo:any ;

  constructor(
    private ticketsService: TicketsSevice,
    public dialog: MatDialog,
    private almacenesService: AlmacenesService,
    private articulosService: ArticulosService,
    private tiposMovService: TiposMovService,
    private authService: AuthService, 
    private detalleticketService: DetalleTicketService,
    private clientesService: ClientesService,
    private toastr: ToastrService
  ) {
    this.dataSource = new MatTableDataSource<DetalleTicket>();
  }

  ngOnInit() {
    this.getData();
    this.loggedInUser = this.authService.getCurrentUser(); // Obtener el usuario logeado
    console.log('Usuario logeado:', this.loggedInUser);
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

    this.filteredClientes = this.IdClienteControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClientes(value || ''))
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.refreshUI();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getData(){
    this.detalleticketService.getDetalleTicket(this.idTicket).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response); 
        if (response && Array.isArray(response) && response.length > 0) {
          this.dataSource.data = response;
          this.totalTicket = response[0].TotalTicket; 
        } else {
          console.log('no contiene datos');
          this.totalTicket = 0; 
        }
      },
      error: (error) => {
        console.error(error);
        this.totalTicket = 0; 
      }
    });
    this.articulosService.getArticulos().subscribe((data2: any) => {
      this.ComboCodigo = data2;
      console.log(this.ComboCodigo);
    });
    this.almacenesService.getAlmacenes().subscribe((data3: any) => {
      this.ComboSucursales = data3;
      console.log(this.ComboSucursales);
    });
    this.tiposMovService.getTiposMov().subscribe((data4: any) => {
      this.ComboTipoMov = data4;
      console.log(this.ComboTipoMov);
    });
    this.clientesService.getClientes().subscribe((data5: any) => {
      this.ComboClientes = data5;
      console.log(this.ComboClientes);
    });
    this.dataSource.filterPredicate = (data: DetalleTicket, filter: string) => {
      return data.Articulo.toString().includes(filter);
    };
/*  */
  }
  
  eliminarDetalle(Id: number,Name: string) {
    const dialogRef = this.dialog.open(DeleteMenuComponent, {
      width: '550px',
      data: Name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == "yes") {
        this.detalleticketService.deleteDetalleTicket(Id).subscribe({
          next: (response) => {
            console.log(response);
            this.dataSource.filterPredicate = (data: DetalleTicket, filter: string) => {
              return data.Articulo.toString().toLowerCase().includes(filter.toLowerCase());
            };
            if (response.StatusCode === 200) {
              this.idTicket = response.response.data;
              this.getData(); // Llama a getData para obtener los detalles del ticket recién insertado
              this.toggleUI();
              this.isTicketFormVisible = false;
              this.toastr.success(response.response.MSG, 'Punto de venta');
            } else {
              this.toastr.error(response.response.MSG, 'Punto de venta');
            }
            this.getData()
          },
          error: (error) => {
            console.error('Hubo un error al eliminar el elemento del ticket', error);
          }
        });
      }
    });
  }
  insertarTicket(): void {
    console.log('IdCliente antes de insertar:', this.IdCliente);
    const nuevoTicket = {
        IdSucursal: this.IdSucursal,
        IdCliente: this.IdCliente,
        IdVendedor: parseInt(this.loggedInUser.Id, 10),
        usuario: parseInt(this.loggedInUser.Id, 10)
    };

    this.ticketsService.insertarTickets(nuevoTicket).subscribe({
        next: (response) => {
            console.log(response);
            
            if (response.StatusCode === 200) {
                this.toastr.success(response.response.Msg, 'Punto de venta');
                this.idTicket = response.response.data; // Asigna el idTicket del response
                console.log('Nuevo idTicket:', this.idTicket);

                // Oculta el formulario de ticket y muestra el formulario de detalle de ticket
                this.isTicketFormVisible = false;

                // Mueve la lógica de obtención de detalles del ticket aquí
                if (this.idTicket) {
                    this.detalleticketService.getDetalleTicket(this.idTicket).subscribe({
                        next: (data: any) => {
                            this.detalleticket = data;
                            console.log('Detalles del ticket:', this.detalleticket);
                        },
                        error: (error) => {
                            console.error('Hubo un error al obtener los detalles del ticket', error);
                        }
                    });
                }
            } else {
                this.toastr.error(response.response.Msg, 'Punto de venta');
            }
        },
        error: (error) => {
            console.error('Hubo un error al insertar el ticket', error);
        }
    });
}


format() {
  this.fechaInicio = this.formatDate(this.dateHandler);
  this.fechaFin = this.formatDate(this.dateHandler2);
}
formatDate(date: Date): string {
  const day = this.padZero(date.getDate());
  const month = this.padZero(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

  refrescarPagina(): void {
    this.exportToPDF()
    window.location.reload();
  }


  exportToPDF(): void {
    const doc = new jsPDF();
    const columns = this.displayedColumns.filter(column => column !== 'Acciones').map(col => this.getColumnName(col));
    const rows = this.dataSource.filteredData.map(ticket => [
      ticket.Id,
      ticket.idTicket,
      ticket.codigo,
      ticket.cantidad,
      ticket.Estatus,
      ticket.usuario
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows
    });

    doc.save('Tickets.pdf');
  }


  private getColumnName(column: string): string {
    switch (column) {
      case 'Id': return 'ID';
      case 'Sucursal': return 'Sucursal';
      case 'Cliente': return 'Cliente';
      case 'Vendedor': return 'Vendedor';
      case 'Fecha': return 'Fecha';
      case 'Estatus': return 'Estatus';
      case 'usuario': return 'Usuario';
      default: return column;
    }
  }

  insertarDetalleTicket() {
    const nuevoDetalleTicket = {
        idTicket: this.idTicket,
        codigo: this.codigo,
        cantidad: this.cantidad,
        precioVenta: this.precioVenta,
        usuario: parseInt(this.loggedInUser.Id, 10)
    };

    if (this.idTicket) {
        // Si this.idTicket tiene un valor, continuar con la solicitud GET
        this.detalleticketService.getDetalleTicket(this.idTicket).subscribe({
            next: (data: DetalleTicket[]) => {
                this.detalleticket = data;
                console.log('Detalles del ticket:', nuevoDetalleTicket);
                
                // Luego, continuar con la inserción del detalle del ticket
                this.detalleticketService.insertDetalleTicket(nuevoDetalleTicket).subscribe({
                    next: (response) => {
                      console.log('este es el response: ', response)
                        if (response.StatusCode === 200) {
                            this.toastr.success(response.response.data.toString(), 'Punto de Venta');
                        } else {
                            this.toastr.error(response.response.data.toString(), 'Punto de Venta');
                        }
                        this.getData();
                    },
                    error: (error) => {
                        console.error('Hubo un error al insertar el detalle del ticket', error);
                    }
                });
                this.clearArticuloFields();
            },
            error: (error) => {
                console.error('Error al obtener detalle del ticket:', error);
            }
        });
    } else {
        console.error('idTicket no está definido');
    }
}

  
  terminar(){
    this.toggleUI();
    this.clearDetalleTicket();
  }
  
  toggleUI() {
    this.isOnStepTwo = !this.isOnStepTwo;
    this.isOnStepOne = !this.isOnStepOne;
    this.refreshUI();
    this.isTicketFormVisible=true;
  }

  refreshUI() {
    if (this.isOnStepTwo) {
      this.IdClienteControl.disable();
      this.IdSucursalControl.disable();
      this.IdUsusarioControl.disable();
      this.IdVendedorControl.disable();

      this.CantidadControl.enable();
      this.IdUsuarioDetalleControl.enable();
      this.IdTicketControl.disable();
      this.IdArticuloControl.enable();
      this.CodigoControl.enable();
      this.PrecioControl.disable();
    } else {
      this.IdClienteControl.enable();
      this.IdSucursalControl.enable();
      this.IdUsusarioControl.enable();
      this.IdVendedorControl.enable();

      this.CantidadControl.enable();
      this.IdUsuarioDetalleControl.enable();
      this.IdTicketControl.disable();
      this.IdArticuloControl.enable();
      this.CodigoControl.enable();
      this.PrecioControl.disable();
    }
  }

  articuloSelected(event: any) {
    const articulo = event.option.value;
    console.log(articulo);
    this.idArticulo = articulo.Id;
    this.codigo = articulo.Codigo;  // Asegúrate de asignar el código del artículo aquí
    this.selectedCodigo = articulo;
    this.selectedArticulo = articulo;
    console.log(articulo.Precio);
    this.precioVenta = articulo.Precio;
  }

  displayArticuloFn(articulo: any): string {
    return articulo ? articulo.Descripcion : '';
  }
  
  private _filterArticulos(value: any): any[] {
    const filterValue = (typeof value === 'string' ? value : '').toLowerCase();
    return this.ComboCodigo.filter(option => option.Descripcion.toLowerCase().includes(filterValue));
  }

  clienteSelected(event: any) {
    const cliente = event.option.value;
    console.log(cliente);
    this.IdCliente = cliente.Id;
    console.log(cliente.Id);
    this.IdClienteControl.updateValueAndValidity();
    this.selectedCliente = cliente;
  }


  displayClienteFn(cliente: any): string {
    return cliente ? cliente.Nombre : '';
  }
  
  private _filterClientes(value: any): any[] {
    const filterValue = (typeof value === 'string' ? value : '').toLowerCase();
    return this.ComboClientes.filter(option => option.Nombre.toLowerCase().includes(filterValue));
  }

  articuloCodSelected(event: any) {
    const articuloCod = event.option.value;
    console.log('Artículo seleccionado:', articuloCod);
    this.selectedCodigo = articuloCod;
    this.selectedArticulo = articuloCod;
    this.codigo = articuloCod.Codigo;
    this.precioVenta = articuloCod.Precio;
    console.log('Id del artículo:', articuloCod.Id);
    console.log('Código del artículo:', articuloCod.Codigo);
    console.log('Precio del artículo:', articuloCod.Precio);
  }
  
  displayArticuloCodFn(articulo: any): string {
    return articulo && articulo.Codigo ? articulo.Codigo : '';
  }
  
  private _filterArticulosCod(value: any): any[] {
    if (typeof value !== 'string') {
      return [];
    }
    const filterValue = value.toLowerCase();
    return this.ComboCodigo.filter(option => option.Codigo.toLowerCase().includes(filterValue));
  }

  private clearArticuloFields() {
    this.idArticulo = '';
    this.codigo = '';
    this.selectedCodigo = null;
    this.selectedArticulo = null;
    this.precioVenta = 0;
    this.cantidad =0;
  }
  
  private clearDetalleTicket(){
    this.idTicket=0;
      this.idArticulo = '';
      this.codigo = '';
      this.selectedCodigo = null;
      this.selectedArticulo = null;
      this.precioVenta = 0;
      this.cantidad =0;
    }
  }

