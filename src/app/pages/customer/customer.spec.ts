import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Customer } from './customer';

describe('Customer', () => {
  let component: Customer;
  let fixture: ComponentFixture<Customer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Customer],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Customer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
