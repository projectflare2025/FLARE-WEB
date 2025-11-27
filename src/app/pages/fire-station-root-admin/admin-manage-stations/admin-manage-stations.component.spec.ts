import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManageStationsComponent } from './admin-manage-stations.component';

describe('AdminManageStations', () => {
  let component: AdminManageStationsComponent;
  let fixture: ComponentFixture<AdminManageStationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManageStationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManageStationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
