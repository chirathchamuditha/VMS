import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { ImportProcessor } from './import.processor';
import { ExportProcessor } from './export.processor';
import { VehicleService } from 'src/vehicle/vehicle.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'import'},
      { name: 'export'}
    ),

    TypeOrmModule.forFeature([Vehicle])
  ],
  controllers: [BatchController],
  providers: [ImportProcessor, ExportProcessor, VehicleService]
})
export class BatchModule {}
