import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Repository } from 'typeorm';
import { CreateServiceRecordInput } from './dto/create-service.input';
import { UpdateServiceInput } from './dto/update-service.input';

@Injectable()
export class ServiceService {

    constructor(@InjectRepository(Service) private readonly serviceRepository: Repository<Service>) { }

    //Find all service records, ordered by service date descending
    async findAll(): Promise<Service[]> {
        return this.serviceRepository.find({
            order: { serviceDate: 'DESC' }
        });
    }

    //Find all service records for a specific VIN, ordered by service date descending
    async findbyVin(vin: string): Promise<Service[]> {
        return this.serviceRepository.find({
            where: { vin },
            order: { serviceDate: 'DESC' }
        });
    }

    //Find a single service record by its ID
    async findOne(id: string): Promise<Service> {
        const serviceRec = await this.serviceRepository.findOne({ where: { id } });

        if (!serviceRec) {
            throw new Error(`Service record with id ${id} not found`);
        }

        return serviceRec;
    }

    //Find a single service record by its ID, but return null if not found (used for GraphQL resolver)
    async deleteRecord(id: string): Promise<Service> {
        const serviceRec = await this.serviceRepository.findOne({ where: { id } });

        if (!serviceRec) {
            throw new Error(`Service record with id ${id} not found`);
        }

        const ret = await this.serviceRepository.delete(id);

        if (ret.affected === 1) {
            return serviceRec;
        }
        throw new Error(`Failed to delete service record with id ${id}`);
    }

    //Create a new service record, converting date strings to Date objects before saving
    async create(
        createServiceRecordInput: CreateServiceRecordInput,
    ): Promise<Service> {

        const serviceRecord = this.serviceRepository.create({
            ...createServiceRecordInput,
            serviceDate: new Date(createServiceRecordInput.serviceDate),
            ...(createServiceRecordInput.nextServiceDate && {
                nextServiceDate: new Date(createServiceRecordInput.nextServiceDate),
            }),
        });

        return this.serviceRepository.save(serviceRecord);
    }

    //Update an existing service record, converting date strings to Date objects before saving
    async update(updateServiceRecordInput: UpdateServiceInput): Promise<Service> {
        const serviceRecord = await this.findOne(updateServiceRecordInput.id);

        if (updateServiceRecordInput.serviceDate) {
            updateServiceRecordInput['serviceDate'] = new Date(updateServiceRecordInput.serviceDate) as any;
        }

        if (updateServiceRecordInput.nextServiceDate) {
            updateServiceRecordInput['nextServiceDate'] = new Date(updateServiceRecordInput.nextServiceDate) as any;
        }

        Object.assign(serviceRecord, updateServiceRecordInput);
        return await this.serviceRepository.save(serviceRecord);
    }

}
