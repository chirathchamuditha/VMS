export interface ServiceRecord {
    id: string;
    vin:string;
    serviceType: string;
    description: string;
    cost: number;
    serviceDate: string;
    serviceProvider: string;
    technician?: string;
    nextServiceDate?: string;
}