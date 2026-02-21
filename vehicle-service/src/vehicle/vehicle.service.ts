import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Like, Repository } from 'typeorm';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { PaginationInput, SearchInput } from './dto/pagination.input';
import { PaginatedVehiclesResponse } from './dto/pagination.response';

@Injectable()
export class VehicleService {

    constructor(
        @InjectRepository(Vehicle)
        private readonly vehicleRepository: Repository<Vehicle>
    ) { }

    calculateAge(manufacturedDate: Date): number {
        const today = new Date()
        const manufactured = new Date(manufacturedDate)

        let age = today.getFullYear() - manufactured.getFullYear()
        const monthDiff = today.getMonth() - manufactured.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < manufactured.getDate())) {
            age--;
        }

        return age < 0 ? 0 : age
    }

    //get find all vehicles in here
    async findAll(): Promise<Vehicle[]> {
        return this.vehicleRepository.find()
    }

    //find one vehicle with VIN
    async findOne(id: string): Promise<Vehicle> {
        const vehicle = await this.vehicleRepository.findOneBy({ id })

        if (!vehicle) {
            throw new NotFoundException(`Vehicle with this vin ${id} is not available`)
        }

        return vehicle;
    }

    //delete the vehicle with vin
    async remove(id: string): Promise<Vehicle> {
        const vehicle = await this.findOne(id); // find by UUID
        if (!vehicle) {
            throw new NotFoundException(`Vehicle with id ${id} not found`);
        }

        const ret = await this.vehicleRepository.delete(id); // delete by UUID
        if (ret.affected === 1) {
            return vehicle;
        }

        throw new NotFoundException(`Vehicle with id ${id} could not be deleted`);
    }

    // Create a vehicle logic
    async createVehicle(createVehicleInput: CreateVehicleInput): Promise<Vehicle> {

        const haveVin = await this.vehicleRepository.findOne({
            where: { vin: createVehicleInput.vin }
        });

        if (haveVin) {
            throw new ConflictException(
                `Vehicle with this ${createVehicleInput.vin} already in the database`
            );
        }

        const manufacturedDate = new Date(createVehicleInput.manufacturedDate);

        // ✅ Prevent future date 
        if (manufacturedDate > new Date()) {
            throw new ConflictException('Manufactured date cannot be a future date');
        }

        const ageOfVehicle = this.calculateAge(manufacturedDate);

        const vehicle = this.vehicleRepository.create({
            ...createVehicleInput, //spread all properties from input
            manufacturedDate,
            ageOfVehicle,
        });

        return await this.vehicleRepository.save(vehicle);
    }

    //update a vehicle
    async updatevehicle(updatedVehicleInput: Partial<Vehicle> & { id: string }): Promise<Vehicle> {

        const vehicle = await this.findOne(updatedVehicleInput.id);

        if (updatedVehicleInput.vin && updatedVehicleInput.vin !== vehicle.vin) {
            const existingvin = await this.vehicleRepository.findOneBy({ vin: updatedVehicleInput.vin });

            if (existingvin) {
                throw new NotFoundException(`Vehicle with VIN ${updatedVehicleInput.vin} already exists`);
            }
        }

        if (updatedVehicleInput.email && updatedVehicleInput.email !== vehicle.email) {
            const existingEmail = await this.vehicleRepository.findOneBy({ email: updatedVehicleInput.email });

            if (existingEmail) {
                throw new NotFoundException(`Vehicle with Email ${updatedVehicleInput.email} already exists`);
            }
        }

        if (updatedVehicleInput.manufacturedDate) {

            const manufacturedDate = new Date(updatedVehicleInput.manufacturedDate);

            // ✅ BLOCK FUTURE DATE
            if (manufacturedDate > new Date()) {
                throw new ConflictException(
                    'Manufactured date cannot be a future date'
                );
            }

            // recalc age
            updatedVehicleInput.ageOfVehicle =
                this.calculateAge(manufacturedDate);

            updatedVehicleInput.manufacturedDate = manufacturedDate as any;
        }

        Object.assign(vehicle, updatedVehicleInput)
        return await this.vehicleRepository.save(vehicle);

    }

    //paginations with vehicle
    async paginationwithvehicles(paginationInput: PaginationInput): Promise<PaginatedVehiclesResponse> {

        const { page, limit } = paginationInput;
        const skip = (page - 1) * limit

        const [vehicles, total] = await this.vehicleRepository.findAndCount({
            order: {
                manufacturedDate: 'ASC'
            },
            skip,
            take: limit
        })

        const totalPages = Math.ceil(total / limit)

        return {
            vehicles,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }


    //search vehicles with pagination
    async searchVehicles(searchInput: SearchInput, paginationInput: PaginationInput): Promise<PaginatedVehiclesResponse> {

        const { page, limit } = paginationInput;
        const skip = (page - 1) * limit

        let search = searchInput.model?.trim()

        if (search?.includes('*')) {
            search = search.replace(/\*/g, '%');
        } else {
            search = `${search}%`;
        }

        const [vehicles, total] = await this.vehicleRepository.findAndCount({
            where: {
                carModel: Like(search)
            },
            order: {
                manufacturedDate: 'ASC'
            },
            skip,
            take: limit
        })

        const totalPages = Math.ceil(total / limit);

        return {
            vehicles,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }


    //bulkcreate for importing excel
    async bulkCreate(
        vehicles: CreateVehicleInput[],
        onProgress?: (processed: number, total: number, imported: number, failed: number) => Promise<void> | void
    ): Promise<Vehicle[]> {
        const createdVehicles: Vehicle[] = [];
        const CHUNK_SIZE = 50; // Chunk size for batch inserts
        const total = vehicles.length;
        let processed = 0;
        let failed = 0;

        // Helper to calculate age from manufacturedDate
        const calculateAge = (manufacturedDate: Date) => {
            const now = new Date();
            let age = now.getFullYear() - manufacturedDate.getFullYear();
            const m = now.getMonth() - manufacturedDate.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < manufacturedDate.getDate())) age--;
            return age;
        };

        // Process in chunks
        for (let i = 0; i < vehicles.length; i += CHUNK_SIZE) {
            const chunkData = vehicles.slice(i, i + CHUNK_SIZE); //vehicles from index 0 to 50, then 51 to 100 and so on
            const vehiclesToSave: Vehicle[] = []; // createa empty array to store the vehicles that are ready to be saved in bulk

            for (const vehicleData of chunkData) {
                try {
                    const manufacturedDate = vehicleData.manufacturedDate
                        ? new Date(vehicleData.manufacturedDate)
                        : new Date(); // fallback to today if missing
                    const ageOfVehicle = calculateAge(manufacturedDate);

                    const vehicle = this.vehicleRepository.create({
                        ...vehicleData,
                        manufacturedDate,
                        ageOfVehicle,
                    });

                    vehiclesToSave.push(vehicle);
                } catch (error) {
                    failed++;
                    processed++;
                    console.error(`Error preparing vehicle with VIN ${vehicleData.vin}:`, error.message);
                }
            }

            if (vehiclesToSave.length > 0) {
                try {
                    // Bulk save the chunk
                    const savedChunk = await this.vehicleRepository.save(vehiclesToSave);
                    createdVehicles.push(...savedChunk);
                    processed += vehiclesToSave.length;
                } catch (error) {
                    console.warn(`Bulk save failed for chunk starting at index ${i}. Falling back to individual saves:`, error.message);

                    // Fallback: save each vehicle individually
                    for (const vehicle of vehiclesToSave) {
                        try {
                            const saved = await this.vehicleRepository.save(vehicle);
                            createdVehicles.push(saved);
                            processed++;
                        } catch (individualError) {
                            failed++;
                            processed++;
                            console.error(`Failed to import vehicle with VIN ${vehicle.vin}:`, individualError.message);
                        }
                    }
                }
            }

            // Report progress after each chunk
            if (onProgress) {
                await Promise.resolve(onProgress(processed, total, createdVehicles.length, failed));
            }
        }

        return createdVehicles;
    }



    async findChunkForExport(limit: number, offset: number, minAge?: number, exportAll?: boolean): Promise<Vehicle[]> {
        const query = this.vehicleRepository.createQueryBuilder('v');

        if (!exportAll && minAge !== undefined) {
            query.where('v.ageOfVehicle >= :minAge', { minAge });
        }

        return query
            .orderBy('v.id', 'ASC')
            .skip(offset)
            .take(limit)
            .getMany();
    }

}
