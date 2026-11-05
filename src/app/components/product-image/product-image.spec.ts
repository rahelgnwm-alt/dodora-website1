import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductImage } from './product-image';

describe('ProductImage', () => {
  let component: ProductImage;
  let fixture: ComponentFixture<ProductImage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductImage],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductImage);
    fixture.componentRef.setInput('src', 'https://example.com/product.jpg');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
