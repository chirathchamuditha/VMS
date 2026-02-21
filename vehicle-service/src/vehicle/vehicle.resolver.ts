import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VehicleService } from './vehicle.service';
import { Vehicle } from './entities/vehicle.entity';
import { info } from 'console';
import { BadRequestException } from '@nestjs/common';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { UpdatedVehicleInput } from './dto/update-vehicle.input';
import { PaginatedVehiclesResponse } from './dto/pagination.response';
import { PaginationInput, SearchInput } from './dto/pagination.input';

@Resolver(() => Vehicle)
export class VehicleResolver {

    constructor(private vehicleService: VehicleService) { }

    @Query(() => [Vehicle], { name: 'getAllVehicles' })
    findAll() {
        return this.vehicleService.findAll()
    }

    // In Info can resolver give what client exactly ask for
    @Query(() => Vehicle, { name: 'getVehicleByVin' })
    findOne(@Args('id') id: string, @Info() info) {
        return this.vehicleService.findOne(id);
    }

    @Mutation(() => Vehicle, { name: 'deleteVehicle' })
    async deleteVehicle(@Args('id') id: string,) {
        if (!id) {
            throw new BadRequestException('Vin is Required')
        }
        return this.vehicleService.remove(id)
    }

    @Mutation(() => Vehicle, { name: 'createVehicle' })
    async createVehicle(@Args('createVehicleInput') createVehicleInput: CreateVehicleInput): Promise<Vehicle> {
        return this.vehicleService.createVehicle(createVehicleInput)
    }

    @Mutation(() => Vehicle, { name: 'updateVehicle' })
    async updateVehicle(@Args('updatedVehicleInput') updatedVehicleInput: UpdatedVehicleInput): Promise<Vehicle> {
        return this.vehicleService.updatevehicle(updatedVehicleInput)
    }


    @Query(() => PaginatedVehiclesResponse, { name: 'pageswithVehicles' })
    async findvehicleswithPagination(
        @Args('pagination', { nullable: true, defaultValue: { page: 1, limit: 100 } })
        paginationInput: PaginationInput,
    ): Promise<PaginatedVehiclesResponse> {
        return this.vehicleService.paginationwithvehicles(paginationInput)
    }

    @Query(() => PaginatedVehiclesResponse, { name: 'searchVehicleswithPagination' })
    async seatchVehicles(@Args('search') searchInput: SearchInput, @Args('pagination', { nullable: true, defaultValue: { page: 1, limit: 100 } })
    paginationInput: PaginationInput
    ): Promise<PaginatedVehiclesResponse> {
        return this.vehicleService.searchVehicles(searchInput, paginationInput)
    }





}
