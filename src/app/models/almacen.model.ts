export interface Almacen {
    Id: number;
    Nombre: string;
    Direccion: string;
    UsuarioActualiza: String;
    FechaAct:Date;
    FechaReg:Date;
  }

  export interface ApiResponse {
    StatusCode: number;
    success: boolean;
    fecha: string;
    message: string;
    response: {
      data: Almacen[]; };
  }

  export interface UpdateAlmacen{
    Id: number;
    Nombre: string;
    Direccion: string;
    Usuario: number;
  }

   export interface deleteAlmacenes{
     Id: number;
   }
  