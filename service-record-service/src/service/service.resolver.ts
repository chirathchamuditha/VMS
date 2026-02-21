import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceService } from './service.service';
import { Service } from './entities/service.entity';
import { CreateServiceRecordInput } from './dto/create-service.input';
import { UpdateServiceInput } from './dto/update-service.input';
import { Vehicle } from './entities/vehicle.reference';
import { Parent } from '@nestjs/graphql';

@Resolver(() => Service)
export class ServiceResolver {

    constructor(private readonly serviceService: ServiceService) { }

    @Query(() => [Service], { name: 'getAllServiceRecords' })
    async getAllServiceRecords(): Promise<Service[]> {
        return this.serviceService.findAll();
    }


    @Query(() => [Service], { name: 'serviceRecordsByVin' })
    async getServiceRecordsByVin(
        @Args('vin', { type: () => String }) vin: string,
    ): Promise<Service[]> {
        return this.serviceService.findbyVin(vin);
    }


    @Query(() => Service, { name: 'getServiceRecordById' })
    async getServiceRecordById(
        @Args('id', { type: () => String }) id: string,
    ): Promise<Service> {
        return this.serviceService.findOne(id);
    }

    @Mutation(() => Service, { name: 'createServiceRecord' })
    async createServiceRecord(@Args('createServiceRecordInput') createServiceRecordInput: CreateServiceRecordInput): Promise<Service> {
        return this.serviceService.create(createServiceRecordInput);
    }

    @Mutation(() => Service, { name: 'updateServiceRecord' })
    async updateServiceRecord(
        @Args('updateServiceRecordInput') updateServiceRecordInput: UpdateServiceInput
    ): Promise<Service> {
        return this.serviceService.update(updateServiceRecordInput);
    }

    @Mutation(() => Service, { name: 'deleteServiceRecord' })
    async deleteServiceRecord(
        @Args('id', { type: () => ID }) id: string
    ): Promise<Service> {
        return this.serviceService.deleteRecord(id);
    }

    @Resolver(() => Vehicle)
    vehicle(@Parent() record: Service): Vehicle {
        return { vin: record.vin }
    }
}
