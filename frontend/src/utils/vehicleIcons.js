import carIcon from '../assets/vehicle-icons/car.svg';
import bikeIcon from '../assets/vehicle-icons/bike.svg';
import suvIcon from '../assets/vehicle-icons/suv.svg';
import truckIcon from '../assets/vehicle-icons/truck.svg';
import vanIcon from '../assets/vehicle-icons/van.svg';
import scooterIcon from '../assets/vehicle-icons/scooter.svg';

export const getVehicleIcon = (vehicleType) => {
    if (!vehicleType) return carIcon; // Fallback default
    
    switch (vehicleType.toUpperCase()) {
        case 'BIKE':
            return bikeIcon;
        case 'SUV':
            return suvIcon;
        case 'TRUCK':
            return truckIcon;
        case 'VAN':
            return vanIcon;
        case 'SCOOTER':
            return scooterIcon;
        case 'CAR':
        default:
            return carIcon;
    }
};
