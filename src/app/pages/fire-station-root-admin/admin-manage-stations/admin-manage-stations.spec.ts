import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManageStations } from './admin-manage-stations';

describe('AdminManageStations', () => {
  let component: AdminManageStations;
  let fixture: ComponentFixture<AdminManageStations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManageStations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManageStations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
