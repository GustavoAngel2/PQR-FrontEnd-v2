import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutasUpdateComponent } from './rutas-update.component';

describe('RutasUpdateComponent', () => {
  let component: RutasUpdateComponent;
  let fixture: ComponentFixture<RutasUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RutasUpdateComponent]
    });
    fixture = TestBed.createComponent(RutasUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
