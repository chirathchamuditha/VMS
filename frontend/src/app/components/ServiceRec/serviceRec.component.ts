import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { GraphQLService } from '../../services/graphql.services';
import { Vehicle } from '../../models/vehicle.model';
import { ServiceRecord } from '../../models/service.model';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
    selector: 'app-service-rec',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterOutlet, NgxSonnerToaster],
    templateUrl: './serviceRec.component.html',
})

export class ServiceRecComponent implements OnInit {
    title = 'frontend';

    currentTime: string = '';
    currentDate: string = ''
    intervalId: any;
    selectedVIN: string = '';
    vehicles: Vehicle[] = [];
    selectedServices: ServiceRecord[] = [];
    loadingVehicles: boolean = false;
    loading: boolean = false;
    error: string | null = null;
    records: ServiceRecord[] = [];
    vehicle: (Vehicle & { serviceRecords: ServiceRecord[] }) | null = null;
    isNewRecord: boolean = false;
    showAddServiceModal: boolean = false;
    submitting: boolean = false;

    isEditModalOpen: boolean = false;
    selectedService: ServiceRecord | null = null;

    newService = {
        serviceType: '',
        description: '',
        cost: 0,
        serviceDate: '',
        serviceProvider: '',
        technician: '',
        nextServiceDate: ''
    };

    serviceTypes = [
        'Oil Change',
        'Tire Rotation',
        'Brake Service',
        'Inspection',
        'Battery Replacement',
        'Engine Tune-up',
        'Transmission Service',
        'Air Filter Replacement',
        'Coolant Flush',
        'Alignment',
        'Other'
    ];

    constructor(
        public router: Router,
        private graphqlService: GraphQLService,
        private toaster: NgxSonnerToaster
    ) { }

    loadVehicles(): void {
        this.loadingVehicles = true;
        this.graphqlService.getVehicles(1, 1000).subscribe({
            next: (response) => {
                this.vehicles = response.vehicles;
                this.loadingVehicles = false;
            },
            error: (err) => {
                console.error('Error loading vehicles:', err);
                this.loadingVehicles = false;
            }
        });
    }

    today: string = new Date().toISOString().split('T')[0];

    ngOnInit(): void {
        this.loadVehicles();
    }

    handleVinChange(): void {
        if (this.selectedVIN.trim()) {
            this.loadVehicleWithRecords();
        } else {
            this.vehicle = null;
            this.records = [];
        }
    }

    loadVehicleWithRecords(): void {
        if (!this.selectedVIN) return;

        this.loading = true;
        this.error = null;

        this.graphqlService.getServiceRecordByVin(this.selectedVIN).subscribe({
            next: (data: ServiceRecord[]) => {
                this.selectedServices = data || [];
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading service records:', err);
                this.error = 'Failed to load service records';
                this.loading = false;
            }
        });
    }


    addService(service?: ServiceRecord): void {
        if (!this.selectedVIN) {
            toast.error('Please select a VIN first');
            return;
        }
        this.showAddServiceModal = true;
    }

    submitNewService(): void {
        if (!this.selectedVIN) {
            toast.error('Please select a VIN first');
            return;
        }

        if (!this.newService.serviceType) {
            toast.error('Service type is required');
            return;
        }

        if (!this.newService.serviceDate) {
            toast.error('Service date is required');
            return;
        }

        if (!this.newService.serviceProvider) {
            toast.error('Service provider is required');
            return;
        }

        this.submitting = true;

        const input = {
            vin: this.selectedVIN,
            ...this.newService
        };

        this.graphqlService.createServiceRecord(input).subscribe({
            next: (data: ServiceRecord) => {
                this.selectedServices = [...this.selectedServices, data];
                this.submitting = false;
                this.showAddServiceModal = false;
                this.resetForm();
                toast.success('Service record created successfully');
            },
            error: (err) => {
                console.error('Error creating service record:', err);
                this.submitting = false;
                toast.error('Failed to create service record');
            }
        });
    }

    resetForm(): void {
        this.newService = {
            serviceType: '',
            description: '',
            cost: 0,
            serviceDate: '',
            serviceProvider: '',
            technician: '',
            nextServiceDate: ''
        };
    }

    closeAddServiceModal(): void {
        this.showAddServiceModal = false;
        this.resetForm();
    }

    editService(record: ServiceRecord): void {
        this.selectedService = { ...record };
        this.newService = {
            serviceType: record.serviceType,
            description: record.description || '',
            cost: record.cost,
            serviceDate: record.serviceDate,
            serviceProvider: record.serviceProvider,
            technician: record.technician || '',
            nextServiceDate: record.nextServiceDate || ''
        };
        this.isEditModalOpen = true;
    }

    submitEditService(): void {
        if (!this.selectedService) return;

        if (!this.newService.serviceType) {
            toast.error('Service type is required');
            return;
        }

        if (!this.newService.serviceDate) {
            toast.error('Service date is required');
            return;
        }

        if (!this.newService.serviceProvider) {
            toast.error('Service provider is required');
            return;
        }

        this.submitting = true;

        const input = {
            id: this.selectedService.id,
            ...this.newService
        };

        this.graphqlService.updateServiceRecord(input).subscribe({
            next: (data: ServiceRecord) => {
                this.selectedServices = this.selectedServices.map(s => s.id === data.id ? data : s);
                this.submitting = false;
                this.isEditModalOpen = false;
                this.selectedService = null;
                this.resetForm();
                toast.success('Service record updated successfully');
            },
            error: (err) => {
                console.error('Error updating service record:', err);
                this.submitting = false;
                toast.error('Failed to update service record');
            }
        });
    }

    closeEditServiceModal(): void {
        this.isEditModalOpen = false;
        this.selectedService = null;
        this.resetForm();
    }

    deleteService(record: ServiceRecord): void {
        if (!confirm(`Are you sure you want to delete this service record?`)) {
            return;
        }

        this.submitting = true;
        this.graphqlService.deleteServiceRecord(record.id).subscribe({
            next: () => {
                this.selectedServices = this.selectedServices.filter(s => s.id !== record.id);
                this.submitting = false;
                toast.success('Service record deleted successfully');
            },
            error: (err) => {
                console.error('Error deleting service record:', err);
                this.submitting = false;
                toast.error('Failed to delete service record');
            }
        });
    }
    }

