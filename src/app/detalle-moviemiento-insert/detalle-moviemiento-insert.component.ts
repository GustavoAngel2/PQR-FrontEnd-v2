import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DetalleMovService } from '../data.service';


@Component({
  selector: 'app-detalle-moviemiento-insert',
  templateUrl: './detalle-moviemiento-insert.component.html',
  styleUrls: ['./detalle-moviemiento-insert.component.css']
})
export class DetalleMoviemientoInsertComponent {
  idMovimiento: number = 0;
  codigo: string = '';
  cantidad: number = 0;
  costo: number = 0;
  usuarioActualiza: number = 0;

  constructor(
    public dialogRef: MatDialogRef<DetalleMoviemientoInsertComponent>,
    private detalleMovService: DetalleMovService
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  insertar(): void {
    const nuevoDetalleMov = {
      idMovimiento: this.idMovimiento,
      codigo: this.codigo,
      cantidad: this.cantidad,
      costo: this.costo,  
      usuarioActualiza: this.usuarioActualiza 
    };

    // Aquí asumo que tienes un método en tu servicio para insertar el departamento
    this.detalleMovService.insertarDetalleMov(nuevoDetalleMov).subscribe({
      next: (response) => {
        // Puedes cerrar la modal y/o actualizar la tabla aquí si es necesario
        this.dialogRef.close(response);
        location.reload();
      },
      error: (error) => {
        // Manejar el error aquí
        console.error('Hubo un error al insertar el almacen', error);
      }
    });
  }
}
