import { Module } from '@nestjs/common';
import { VehicleResolver } from './vehicle.resolver';
import { VehicleService } from './vehicle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';

@Module({
    imports:[TypeOrmModule.forFeature([Vehicle])],
  providers: [VehicleResolver, VehicleService]
})
export class VehicleModule {}
