import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminProducts } from './admin-products';

describe('AdminProducts', () => {
  let component: AdminProducts;
  let fixture: ComponentFixture<AdminProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProducts],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
