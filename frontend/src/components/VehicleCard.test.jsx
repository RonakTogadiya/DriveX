import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VehicleCard from './VehicleCard';
import { AuthProvider } from '../context/AuthContext';
import { vi } from 'vitest';
import carIcon from '../assets/vehicle-icons/car.svg';

// Mock context module
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, setUser: vi.fn() }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

const mockListingWithNoImage = {
  _id: '1',
  name: 'No Image Car',
  type: 'CAR',
  brand: 'Toyota',
  model: 'Camry',
  year: '2022',
  fuelType: 'PETROL',
  isAvailable: true,
  pricePerDay: 50,
};

const mockListingWithImage = {
  ...mockListingWithNoImage,
  _id: '2',
  name: 'Image Car',
  imageUrl: 'https://example.com/broken.jpg',
};

const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('VehicleCard', () => {
  it('displays the fallback logo when imageUrl is strictly missing', () => {
    const { container } = renderWithRouter(<VehicleCard listing={mockListingWithNoImage} />);
    
    // It should render an image element but using fallback SVG, or we check for the SVG class
    const fallbackImg = screen.getByAltText('No Image Car');
    expect(fallbackImg).toBeInTheDocument();
    expect(fallbackImg).toHaveAttribute('src', carIcon);
  });

  it('displays the fallback logo after an image fails to load', async () => {
    renderWithRouter(<VehicleCard listing={mockListingWithImage} />);
    
    const imgElement = screen.getByAltText('Image Car');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', 'https://example.com/broken.jpg'); // initial render

    // Simulate image error
    fireEvent.error(imgElement);

    // It should change the source to fallback URL
    await waitFor(() => {
        expect(imgElement).toHaveAttribute('src', carIcon);
    });
  });
});
