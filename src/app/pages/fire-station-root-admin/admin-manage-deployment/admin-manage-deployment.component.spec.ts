import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManageDeploymentComponent } from './admin-manage-deployment.component';

describe('AdminManageDeploymentComponent', () => {
  let component: AdminManageDeploymentComponent;
  let fixture: ComponentFixture<AdminManageDeploymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManageDeploymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManageDeploymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
