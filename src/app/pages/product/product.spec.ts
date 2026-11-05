import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PRODUCTS } from '../../data/products.data';
import { Product } from './product';

describe('Product', () => {
  let component: Product;
  let fixture: ComponentFixture<Product>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Product],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Product);
    fixture.componentRef.setInput('handle', PRODUCTS[0].handle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
