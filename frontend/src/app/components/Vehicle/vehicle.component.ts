import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, Router } from '@angular/router';
import { GraphQLService } from '../../services/graphql.services';
import { PaginatedVehiclesResponse, Vehicle } from '../../models/vehicle.model';
import { toast } from 'ngx-sonner';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
    selector: 'app-vehicle',
    standalone: true,
    imports: [RouterOutlet, CommonModule, FormsModule, NgxSonnerToaster],
    templateUrl: './vehicle.component.html',
})
export class VehicleComponent {
    title = 'frontend';

    vehicles: Vehicle[] = [];
    searchModel: string = '';
    isSearching: boolean = false;
    page: number = 1;
    limit: number = 100;
    total: number = 0;
    totalPages: number = 0;
    hasNextPage: boolean = false;
    hasPreviousPage: boolean = false;
    loading: boolean = false;
    error: string | null = null;

    searchTerm: string = '';

    isEditModalOpen: boolean = false;
    selectedVehicle: any = {}

    constructor(
        private router: Router,
        private graphqlService: GraphQLService
    ) { }

    today: string = new Date().toISOString().split('T')[0];


    ngOnInit(): void {
        this.loadVehicles();
    }

    get filteredVehicles() {
        if (!this.searchTerm) {
            return this.vehicles;
        }
        return this.vehicles.filter(vehicle =>
            vehicle.carModel.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    loadVehicles(): void {
        this.loading = true;
        this.error = null;

        const query = this.isSearching && this.searchModel.trim()
            ? this.graphqlService.searchVehicles(this.searchModel, this.page, this.limit)
            : this.graphqlService.getVehicles(this.page, this.limit);

        query.subscribe({
            next: (data: PaginatedVehiclesResponse) => {
                this.vehicles = data.vehicles;
                this.total = data.total;
                this.page = data.page;
                this.totalPages = data.totalPages;
                this.hasNextPage = data.hasNextPage;
                this.hasPreviousPage = data.hasPreviousPage;
                this.loading = false;
            },
            error: (err: unknown) => {
                if (err instanceof Error) {
                    this.error = err.message;
                } else {
                    this.error = String(err);
                }
                this.loading = false;
            }

        });
    }


    openEditModal(vehicle: Vehicle): void {
        this.selectedVehicle = { ...vehicle };
        this.isEditModalOpen = true;
    }

    closeEditModal(): void {
        this.isEditModalOpen = false;
    }

    saveEditedVehicle(): void {
        if (!this.selectedVehicle || !this.selectedVehicle.id) return;

        // Only send fields that are in the UpdatedVehicleInput DTO
        const updateInput = {
            id: this.selectedVehicle.id,
            firstName: this.selectedVehicle.firstName,
            lastName: this.selectedVehicle.lastName,
            email: this.selectedVehicle.email,
            carMake: this.selectedVehicle.carMake,
            carModel: this.selectedVehicle.carModel,
            vin: this.selectedVehicle.vin,
            manufacturedDate: this.selectedVehicle.manufacturedDate
        };

        this.graphqlService.updateVehicle(updateInput).subscribe({
            next: (updatedVehicle: Vehicle) => {
                // Update the vehicle in the local array
                this.vehicles = this.vehicles.map(v =>
                    v.id === updatedVehicle.id ? updatedVehicle : v
                );
                toast.success(`Vehicle for ${updatedVehicle.firstName} ${updatedVehicle.lastName} updated successfully!`);
                this.closeEditModal();
            },
            error: (err: unknown) => {
                const errorMessage = err instanceof Error ? err.message : String(err);
                toast.error(`Failed to update vehicle: ${errorMessage}`);
                console.error('Error updating vehicle:', err);
            }
        });
    }

    deleteVehicle(vehicleId: string, vehicleName: string): void {
        if (confirm(`Are you sure you want to delete the vehicle for ${vehicleName}?`)) {
            this.graphqlService.deleteVehicle(vehicleId).subscribe({
                next: () => {
                    this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);
                    toast.success(`Vehicle for ${vehicleName} deleted successfully!`);
                },
                error: (err: unknown) => {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    toast.error(`Failed to delete vehicle: ${errorMessage}`);
                    console.error('Error deleting vehicle:', err);
                }
            });
        } 
        
    }

    nextPage(): void {
        if (this.hasNextPage) {
            this.page++;
            this.loadVehicles();
        }
    }

    previousPage(): void {
        if (this.hasPreviousPage) {
            this.page--;
            this.loadVehicles();
        }
    }
}