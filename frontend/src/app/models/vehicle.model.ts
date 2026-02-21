export interface Vehicle {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    carMake: string;
    carModel: string;
    vin: string;
    manufacturedDate: string;
    ageOfVehicle: number;
}

export interface PaginatedVehiclesResponse {
    vehicles: Vehicle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}