import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLanding } from './admin-landing';

describe('AdminLanding', () => {
  let component: AdminLanding;
  let fixture: ComponentFixture<AdminLanding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLanding],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLanding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
